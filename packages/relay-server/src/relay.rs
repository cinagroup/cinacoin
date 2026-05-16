//! Relay core: WebSocket handler with topic subscription, message routing, and pub/sub.
//!
//! Each WebSocket connection is handled by an `ActixActor` that:
//! 1. Receives messages from the client
//! 2. Validates and routes them (subscribe/unsubscribe/publish)
//! 3. Delivers published messages to subscribers via NATS or Redis Pub/Sub
//! 4. Maintains per-connection subscription state
//! 5. Enforces message size limits, rate limiting, and topic expiration

use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use std::time::{Duration, Instant};

use actix::prelude::*;
use actix_web::web;
use actix_web_actors::ws;
use redis::aio::ConnectionManager;
use serde_json::json;
use tokio::sync::Mutex;
use tracing::{debug, error, info, warn};

use crate::config::Config;
use crate::metrics;
use crate::models::*;

/// Heartbeat interval (seconds).
const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(30);

/// Client inactivity timeout.
const CLIENT_TIMEOUT: Duration = Duration::from_secs(60);

/// Topic metadata for expiration tracking.
#[derive(Debug, Clone)]
pub struct TopicMeta {
    pub created_at: Instant,
    pub ttl_secs: u64,
    pub last_activity: Instant,
}

impl TopicMeta {
    pub fn is_expired(&self) -> bool {
        if self.ttl_secs == 0 {
            return false;
        }
        self.last_activity.elapsed().as_secs() > self.ttl_secs
            || self.created_at.elapsed().as_secs() > self.ttl_secs
    }
}

/// Shared state accessible by all WebSocket sessions.
#[derive(Clone)]
pub struct AppState {
    /// Redis connection for session storage and topic tracking.
    pub redis: ConnectionManager,
    /// Map of topic → list of connected client IDs subscribed to that topic.
    pub subscriptions: Arc<Mutex<HashMap<String, Vec<String>>>>,
    /// Topic metadata for expiration tracking.
    pub topic_meta: Arc<Mutex<HashMap<String, TopicMeta>>>,
    /// Counter for generating unique client IDs.
    pub client_counter: Arc<Mutex<u64>>,
    /// In-memory rate limiter: IP → (count, reset_at).
    pub rate_limiter: Arc<Mutex<HashMap<String, (u32, Instant)>>>,
    /// Server configuration.
    pub config: Config,
}

impl AppState {
    /// Generate a unique client ID.
    pub async fn next_client_id(&self) -> String {
        let mut counter = self.client_counter.lock().await;
        *counter += 1;
        format!("client-{}", counter)
    }

    /// Check whether an IP is rate-limited.
    pub async fn check_rate_limit(&self, ip: &str) -> bool {
        let mut limiter = self.rate_limiter.lock().await;
        let now = Instant::now();
        let window = Duration::from_secs(self.config.connection_rate_window_secs);

        let entry = limiter.entry(ip.to_string()).or_insert((0, now));

        // Reset counter if window expired.
        if now.duration_since(entry.1) > window {
            entry.0 = 0;
            entry.1 = now;
        }

        if entry.0 >= self.config.connection_rate_limit {
            metrics::RELAY_RATE_LIMITED_TOTAL.inc();
            return false;
        }

        entry.0 += 1;
        true
    }

    /// Register or refresh topic metadata.
    pub async fn touch_topic(&self, topic: &str) {
        let mut meta = self.topic_meta.lock().await;
        meta.insert(
            topic.to_string(),
            TopicMeta {
                created_at: meta
                    .get(topic)
                    .map(|m| m.created_at)
                    .unwrap_or_else(Instant::now),
                ttl_secs: self.config.topic_ttl_secs,
                last_activity: Instant::now(),
            },
        );
    }

    /// Remove expired topics.
    pub async fn cleanup_expired_topics(&self) -> Vec<String> {
        let mut meta = self.topic_meta.lock().await;
        let mut subs = self.subscriptions.lock().await;
        let mut expired = Vec::new();

        meta.retain(|topic, m| {
            if m.is_expired() {
                expired.push(topic.clone());
                subs.remove(topic);
                false
            } else {
                true
            }
        });

        for topic in &expired {
            metrics::RELAY_TOPICS_EXPIRED_TOTAL.inc();
            let subs_key = format!("topic:{}:subs", topic);
            let _ = self.redis.del(&subs_key).await;
            info!(topic, "expired topic cleaned up");
        }

        expired
    }
}

/// WebSocket session actor for a single client connection.
pub struct RelaySession {
    /// Unique identifier for this connection.
    pub id: String,
    /// Set of topics this client is subscribed to.
    pub subscriptions: HashSet<String>,
    /// Reference to shared application state.
    pub state: AppState,
    /// Last heartbeat timestamp.
    pub hb: Instant,
}

impl RelaySession {
    /// Create a new relay session.
    pub fn new(state: AppState, id: String) -> Self {
        metrics::RELAY_ACTIVE_CONNECTIONS.inc();
        metrics::RELAY_CONNECTIONS_TOTAL.inc();
        Self {
            id,
            subscriptions: HashSet::new(),
            state,
            hb: Instant::now(),
        }
    }

    /// Start the heartbeat timer for this session.
    fn heartbeat(&self, ctx: &mut <Self as Actor>::Context) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
                warn!(client_id = %act.id, "client heartbeat timeout — disconnecting");
                ctx.stop();
                return;
            }
            ctx.ping(b"");
        });
    }

    /// Send a text frame to the client.
    fn send_text(ctx: &mut <Self as Actor>::Context, text: String) {
        ctx.text(text);
    }

    /// Handle subscribe: register the client for a topic.
    async fn do_subscribe(
        redis: &ConnectionManager,
        shared_subs: &Arc<Mutex<HashMap<String, Vec<String>>>>,
        client_id: &str,
        topic: &str,
    ) {
        // Add to shared subscription map
        {
            let mut subs = shared_subs.lock().await;
            subs.entry(topic.to_string())
                .or_default()
                .push(client_id.to_string());
        }

        // Track session in Redis with 30-day TTL
        let session_key = format!("session:{}", topic);
        let now_ms = crate::now_ms();
        if let Err(e) = redis
            .set_ex(
                &session_key,
                serde_json::to_string(&json!({
                    "connected_at": now_ms,
                    "client_id": client_id,
                }))
                .unwrap_or_default(),
                30 * 24 * 3600u64,
            )
            .await
        {
            warn!(error = %e, "failed to store session in redis");
        }

        // Track subscriber set in Redis
        let subs_key = format!("topic:{}:subs", topic);
        let _ = redis.sadd(&subs_key, client_id).await;
    }

    /// Handle unsubscribe: deregister the client from a topic.
    async fn do_unsubscribe(
        redis: &ConnectionManager,
        shared_subs: &Arc<Mutex<HashMap<String, Vec<String>>>>,
        client_id: &str,
        topic: &str,
    ) {
        {
            let mut subs = shared_subs.lock().await;
            if let Some(clients) = subs.get_mut(topic) {
                clients.retain(|id| id != client_id);
            }
        }

        let subs_key = format!("topic:{}:subs", topic);
        let _ = redis.srem(&subs_key, client_id).await;
    }

    /// Handle publish: route a message to all topic subscribers.
    async fn do_publish(
        redis: &ConnectionManager,
        shared_subs: &Arc<Mutex<HashMap<String, Vec<String>>>>,
        client_id: &str,
        topic: &str,
        payload: &str,
    ) {
        let message = RelayMessage {
            msg_type: MessageType::Message,
            topic: topic.to_string(),
            payload: payload.to_string(),
            tag: None,
            id: Some(uuid::Uuid::new_v4().to_string()),
            timestamp: crate::now_ms(),
        };

        let json_str = serde_json::to_string(&message).unwrap_or_default();
        let payload_size = payload.len();

        metrics::RELAY_MESSAGES_PUBLISHED_TOTAL.inc();
        metrics::RELAY_MESSAGE_SIZE
            .observe(payload_size as f64);

        // Log routing
        {
            let subs = shared_subs.lock().await;
            if let Some(clients) = subs.get(topic) {
                for sub_id in clients {
                    if sub_id != client_id {
                        debug!(topic, from = %client_id, to = %sub_id, "routing message");
                        // In production: deliver via NATS.publish or direct ws.send
                    }
                }
            }
        }

        // Cross-instance delivery via Redis Pub/Sub
        let channel = format!("topic:{}", topic);
        if let Err(e) = redis.publish(&channel, &json_str).await {
            warn!(error = %e, "failed to publish to redis");
            metrics::RELAY_PUBLISH_ERRORS_TOTAL.inc();
        }
    }
}

impl Actor for RelaySession {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        info!(client_id = %self.id, "websocket connection established");
        // Set max frame size from config
        ctx.set_max_frame_size(self.state.config.max_message_size_bytes);
        self.heartbeat(ctx);
    }

    fn stopped(&mut self, _ctx: &mut Self::Context) {
        info!(client_id = %self.id, "websocket connection closed");
        metrics::RELAY_ACTIVE_CONNECTIONS.dec();

        // Clean up all subscriptions
        let state = self.state.clone();
        let id = self.id.clone();
        let topics: Vec<String> = self.subscriptions.iter().cloned().collect();

        actix::spawn(async move {
            let mut subs = state.subscriptions.lock().await;
            for topic in &topics {
                if let Some(clients) = subs.get_mut(topic) {
                    clients.retain(|cid| cid != &id);
                }
                let subs_key = format!("topic:{}:subs", topic);
                let _ = state.redis.srem(&subs_key, &id).await;
            }
        });
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for RelaySession {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        match msg {
            Ok(ws::Message::Ping(n)) => {
                self.hb = Instant::now();
                ctx.pong(&n);
            }
            Ok(ws::Message::Pong(_)) => {
                self.hb = Instant::now();
            }
            Ok(ws::Message::Text(text)) => {
                let text = text.to_string();

                // --- Message size limit ---
                if text.len() > self.state.config.max_message_size_bytes {
                    metrics::RELAY_MESSAGE_SIZE_EXCEEDED_TOTAL.inc();
                    Self::send_text(
                        ctx,
                        serde_json::to_string(&json!({
                            "type": "error",
                            "message": "message too large",
                            "code": 413,
                        }))
                        .unwrap_or_default(),
                    );
                    return;
                }

                let id = self.id.clone();
                let state = self.state.clone();

                // Parse the message synchronously
                let relay_msg = match RelayMessage::from_json(&text) {
                    Ok(m) => m,
                    Err(e) => {
                        warn!(client_id = %id, error = %e, "invalid json");
                        metrics::RELAY_PARSE_ERRORS_TOTAL.inc();
                        Self::send_text(
                            ctx,
                            serde_json::to_string(&json!({
                                "type": "error",
                                "message": format!("invalid json: {}", e),
                                "code": 400,
                            }))
                            .unwrap_or_default(),
                        );
                        return;
                    }
                };

                match relay_msg.msg_type {
                    MessageType::Subscribe => {
                        if let Err(e) = validate_topic(&relay_msg.topic) {
                            Self::send_text(
                                ctx,
                                serde_json::to_string(&json!({
                                    "type": "error",
                                    "message": e,
                                    "code": 400,
                                }))
                                .unwrap_or_default(),
                            );
                            return;
                        }
                        if !self.subscriptions.contains(&relay_msg.topic) {
                            self.subscriptions.insert(relay_msg.topic.clone());
                            metrics::RELAY_SUBSCRIPTIONS_TOTAL.inc();
                            metrics::RELAY_ACTIVE_SUBSCRIPTIONS.inc();
                        }

                        // Touch topic for expiration tracking
                        let state_clone = self.state.clone();
                        let topic = relay_msg.topic.clone();
                        actix::spawn(async move {
                            state_clone.touch_topic(&topic).await;
                        });

                        let redis = state.redis.clone();
                        let shared_subs = state.subscriptions.clone();
                        let client_id = id.clone();
                        let topic = relay_msg.topic.clone();

                        Self::send_text(
                            ctx,
                            serde_json::to_string(&json!({
                                "type": "ack",
                                "topic": topic,
                            }))
                            .unwrap_or_default(),
                        );

                        actix::spawn(async move {
                            Self::do_subscribe(&redis, &shared_subs, &client_id, &topic).await;
                            info!(client_id = %client_id, topic, "subscribed");
                        });
                    }
                    MessageType::Unsubscribe => {
                        if let Err(e) = validate_topic(&relay_msg.topic) {
                            Self::send_text(
                                ctx,
                                serde_json::to_string(&json!({
                                    "type": "error",
                                    "message": e,
                                    "code": 400,
                                }))
                                .unwrap_or_default(),
                            );
                            return;
                        }
                        self.subscriptions.remove(&relay_msg.topic);
                        metrics::RELAY_ACTIVE_SUBSCRIPTIONS.dec();

                        let redis = state.redis.clone();
                        let shared_subs = state.subscriptions.clone();
                        let client_id = id.clone();
                        let topic = relay_msg.topic.clone();

                        Self::send_text(
                            ctx,
                            serde_json::to_string(&json!({
                                "type": "ack",
                                "topic": topic,
                            }))
                            .unwrap_or_default(),
                        );

                        actix::spawn(async move {
                            Self::do_unsubscribe(&redis, &shared_subs, &client_id, &topic).await;
                            info!(client_id = %client_id, topic, "unsubscribed");
                        });
                    }
                    MessageType::Publish => {
                        if let Err(e) = validate_topic(&relay_msg.topic) {
                            Self::send_text(
                                ctx,
                                serde_json::to_string(&json!({
                                    "type": "error",
                                    "message": e,
                                    "code": 400,
                                }))
                                .unwrap_or_default(),
                            );
                            return;
                        }

                        let redis = state.redis.clone();
                        let shared_subs = state.subscriptions.clone();
                        let client_id = id.clone();
                        let topic = relay_msg.topic.clone();
                        let payload = relay_msg.payload.clone();

                        Self::send_text(
                            ctx,
                            serde_json::to_string(&json!({
                                "type": "ack",
                                "topic": topic,
                            }))
                            .unwrap_or_default(),
                        );

                        actix::spawn(async move {
                            Self::do_publish(&redis, &shared_subs, &client_id, &topic, &payload)
                                .await;
                        });
                    }
                    MessageType::Ping => {
                        Self::send_text(
                            ctx,
                            serde_json::to_string(&json!({
                                "type": "pong",
                                "timestamp": crate::now_ms(),
                            }))
                            .unwrap_or_default(),
                        );
                    }
                    _ => {
                        warn!(client_id = %id, msg_type = ?relay_msg.msg_type, "unexpected message type");
                    }
                }
            }
            Ok(ws::Message::Binary(_bin)) => {
                Self::send_text(
                    ctx,
                    serde_json::to_string(&json!({
                        "type": "error",
                        "message": "binary messages not supported",
                        "code": 400,
                    }))
                    .unwrap_or_default(),
                );
            }
            Ok(ws::Message::Close(reason)) => {
                info!(client_id = %self.id, reason = ?reason, "client closed connection");
                ctx.stop();
            }
            Err(e) => {
                error!(client_id = %self.id, error = %e, "protocol error");
                metrics::RELAY_PROTOCOL_ERRORS_TOTAL.inc();
                ctx.stop();
            }
        }
    }
}
