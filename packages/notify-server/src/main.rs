//! CinaConnect Notify Server
//! 
//! A notification push system for dApp notifications, wallet alerts, and transaction status updates.

mod config;
mod database;
mod redis;
mod handlers;
mod middleware;
mod metrics;
mod types;

use axum::{
    routing::{get, post, delete},
    Router, Extension,
};
use std::sync::Arc;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[derive(Debug)]
pub struct AppState {
    pub config: config::Config,
    pub db: database::Database,
    pub redis: redis::RedisClient,
    pub push_client: reqwest::Client,
}

impl Clone for AppState {
    fn clone(&self) -> Self {
        Self {
            config: self.config.clone(),
            db: self.db.clone(),
            redis: self.redis.clone(),
            push_client: self.push_client.clone(),
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new("info,notify_server=debug"))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = config::Config::from_env()?;
    let db = database::Database::new(&config.database_url).await?;
    let redis_client = redis::RedisClient::new(&config.redis_url)?;
    let push_client = reqwest::Client::new();

    let state = Arc::new(AppState {
        config,
        db,
        redis: redis_client,
        push_client,
    });

    let app = Router::new()
        .route("/v1/health", get(handlers::health))
        .route("/v1/subscribe", post(handlers::subscribe::subscribe))
        .route("/v1/unsubscribe", delete(handlers::unsubscribe::unsubscribe))
        .route("/v1/notify", post(handlers::notify::notify))
        .route("/v1/history", get(handlers::history::history))
        .route("/v1/metrics", get(metrics::metrics_handler))
        .layer(Extension(state))
        .layer(middleware::auth::AuthLayer::new());

    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("Notify server listening on {}", addr);
    
    axum::serve(tokio::net::TcpListener::bind(addr).await?, app).await?;

    Ok(())
}
