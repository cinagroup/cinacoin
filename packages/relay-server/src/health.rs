//! Health check endpoint and Prometheus metrics.
//!
//! Exposes:
//! - `GET /v1/health` — liveness/readiness probe
//! - `GET /v1/metrics` — Prometheus-compatible metrics

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

use actix_web::{get, web, HttpResponse, Result};
use prometheus::{IntCounter, IntGauge, Registry};
use serde_json::json;

/// Shared metrics collector.
#[derive(Clone)]
pub struct Metrics {
    registry: Arc<Registry>,
    total_connections: Arc<IntCounter>,
    active_connections: Arc<IntGauge>,
    total_messages_published: Arc<IntCounter>,
    total_messages_delivered: Arc<IntCounter>,
    total_subscriptions: Arc<IntCounter>,
    total_errors: Arc<IntCounter>,
}

impl Metrics {
    /// Create a new metrics collector with registered counters.
    pub fn new() -> Self {
        let registry = Registry::default();

        let total_connections = IntCounter::new(
            "relay_total_connections",
            "Total number of WebSocket connections established",
        )
        .unwrap();
        let active_connections = IntGauge::new(
            "relay_active_connections",
            "Currently active WebSocket connections",
        )
        .unwrap();
        let total_messages_published = IntCounter::new(
            "relay_total_messages_published",
            "Total messages published to the relay",
        )
        .unwrap();
        let total_messages_delivered = IntCounter::new(
            "relay_total_messages_delivered",
            "Total messages delivered to subscribers",
        )
        .unwrap();
        let total_subscriptions = IntCounter::new(
            "relay_total_subscriptions",
            "Total topic subscriptions created",
        )
        .unwrap();
        let total_errors = IntCounter::new(
            "relay_total_errors",
            "Total errors encountered",
        )
        .unwrap();

        registry
            .register(Box::new(total_connections.clone()))
            .unwrap();
        registry
            .register(Box::new(active_connections.clone()))
            .unwrap();
        registry
            .register(Box::new(total_messages_published.clone()))
            .unwrap();
        registry
            .register(Box::new(total_messages_delivered.clone()))
            .unwrap();
        registry
            .register(Box::new(total_subscriptions.clone()))
            .unwrap();
        registry
            .register(Box::new(total_errors.clone()))
            .unwrap();

        Self {
            registry: Arc::new(registry),
            total_connections: Arc::new(total_connections),
            active_connections: Arc::new(active_connections),
            total_messages_published: Arc::new(total_messages_published),
            total_messages_delivered: Arc::new(total_messages_delivered),
            total_subscriptions: Arc::new(total_subscriptions),
            total_errors: Arc::new(total_errors),
        }
    }

    /// Get the Prometheus registry.
    pub fn registry(&self) -> &Registry {
        &self.registry
    }

    pub fn inc_connections(&self) {
        self.total_connections.inc();
        self.active_connections.inc();
    }

    pub fn dec_connections(&self) {
        self.active_connections.dec();
    }

    pub fn inc_published(&self) {
        self.total_messages_published.inc();
    }

    pub fn inc_delivered(&self) {
        self.total_messages_delivered.inc();
    }

    pub fn inc_subscriptions(&self) {
        self.total_subscriptions.inc();
    }

    pub fn inc_errors(&self) {
        self.total_errors.inc();
    }
}

/// Health check response.
#[derive(serde::Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
    pub region: String,
    pub uptime_seconds: u64,
}

/// Shared uptime tracker.
pub struct UptimeTracker {
    start_time: std::time::Instant,
}

impl UptimeTracker {
    pub fn new() -> Self {
        Self {
            start_time: std::time::Instant::now(),
        }
    }

    pub fn uptime_seconds(&self) -> u64 {
        self.start_time.elapsed().as_secs()
    }
}

/// Health check endpoint.
#[get("/v1/health")]
pub async fn health(
    uptime: web::Data<UptimeTracker>,
    region: web::Data<String>,
) -> Result<HttpResponse> {
    let response = HealthResponse {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        region: region.get_ref().clone(),
        uptime_seconds: uptime.uptime_seconds(),
    };
    Ok(HttpResponse::Ok().json(response))
}

/// Prometheus metrics endpoint.
#[get("/v1/metrics")]
pub async fn metrics(metrics_data: web::Data<Metrics>) -> Result<HttpResponse> {
    use prometheus::Encoder;
    let encoder = prometheus::TextEncoder::new();
    let metric_families = metrics_data.registry().gather();
    let mut buffer = Vec::new();
    encoder.encode(&metric_families, &mut buffer).unwrap();

    Ok(HttpResponse::Ok()
        .content_type("text/plain; version=0.0.4")
        .body(buffer))
}

/// Pairing endpoint — creates a pairing URI for wallet connection.
///
/// This is the HTTP entry point for initiating a pairing before the
/// WebSocket connection is established.
#[actix_web::post("/v1/pairing")]
pub async fn create_pairing(
    metrics: web::Data<Metrics>,
    project_id: web::Data<String>,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse> {
    let public_key = body
        .get("publicKey")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown");

    let pairing_id = uuid::Uuid::new_v4().to_string();

    // Construct a WalletConnect-compatible pairing URI
    let uri = format!(
        "wc:{}@2?relay-protocol=ws&relay-url=wss://relay.onchainux.com/v1&symKey={}",
        pairing_id, public_key
    );

    metrics.inc_published();

    Ok(HttpResponse::Created().json(json!({
        "pairingId": pairing_id,
        "uri": uri,
        "relayUrl": format!("wss://relay.onchainux.com/v1"),
        "createdAt": crate::now_ms(),
    })))
}
