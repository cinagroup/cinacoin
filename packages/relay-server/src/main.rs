//! OnChainUX Relay Server — Self-hosted WebSocket relay compatible with WalletConnect v2 protocol.
//!
//! This server provides the relay layer for end-to-end encrypted wallet connections.
//! It does NOT decrypt messages — it routes encrypted payloads by topic.
//!
//! ## Endpoints
//! - `WebSocket /v1` — Main relay WebSocket endpoint
//! - `GET /v1/health` — Health check
//! - `GET /v1/metrics` — Prometheus metrics
//! - `POST /v1/pairing` — Create a pairing URI

mod config;
mod crypto;
mod health;
mod models;
mod relay;

use std::io;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use actix_web::{web, App, HttpServer};
use redis::Client;
use tracing::info;

use crate::config::Config;
use crate::health::{create_pairing, health, metrics, Metrics, UptimeTracker};
use crate::relay::AppState;

/// Get current time in milliseconds since Unix epoch.
pub fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system time before epoch")
        .as_millis() as u64
}

#[actix_web::main]
async fn main() -> io::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("relay_server=info".parse().unwrap()),
        )
        .with_target(true)
        .init();

    let config = Config::from_env();
    info!(
        listen_addr = %config.listen_addr,
        region = %config.region,
        project_id = %config.project_id,
        nats_enabled = %config.nats_url.is_some(),
        tls_enabled = %config.tls_enabled(),
        "starting OnChainUX relay server"
    );

    // Connect to Redis
    let redis_client = Client::open(config.redis_url.clone())
        .expect("failed to parse Redis URL");
    let redis_conn = redis_client
        .get_connection_manager()
        .await
        .expect("failed to connect to Redis");

    // Initialize shared state
    let metrics = Metrics::new();
    let uptime = web::Data::new(UptimeTracker::new());

    // Create the AppState
    let state = AppState {
        redis: redis_conn,
        subscriptions: Arc::new(tokio::sync::Mutex::new(std::collections::HashMap::new())),
        client_counter: Arc::new(tokio::sync::Mutex::new(0u64)),
    };

    let server = HttpServer::new({
        let state = state.clone();
        let metrics = metrics.clone();
        let region = config.region.clone();
        let project_id = config.project_id.clone();
        let uptime = uptime.clone();

        move || {
            App::new()
                .app_data(web::Data::new(region.clone()))
                .app_data(web::Data::new(project_id.clone()))
                .app_data(web::Data::new(metrics.clone()))
                .app_data(uptime.clone())
                .app_data(web::Data::new(state.clone()))
                .service(health)
                .service(metrics)
                .service(create_pairing)
                .route("/v1", web::get().to(ws_route))
        }
    })
    .bind(&config.listen_addr)?;

    info!(addr = %config.listen_addr, "relay server listening");

    if config.tls_enabled() {
        // TLS setup would go here in production
        // For now, we just start without TLS since the TLS deps are complex
        server.run().await
    } else {
        server.run().await
    }
}

/// WebSocket route handler for `/v1`.
use crate::relay::RelaySession;

async fn ws_route(
    req: actix_web::HttpRequest,
    stream: web::Payload,
    app_state: web::Data<AppState>,
    metrics: web::Data<Metrics>,
) -> Result<actix_web::HttpResponse, actix_web::Error> {
    metrics.inc_connections();

    let client_id = app_state.next_client_id().await;
    let session = RelaySession::new(app_state.get_ref().clone(), client_id);

    let (response, _, _) = actix_web_actors::ws::start(session, &req, stream)?;
    Ok(response)
}
