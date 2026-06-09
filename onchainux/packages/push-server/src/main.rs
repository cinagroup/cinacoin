mod apns;
mod config;
mod delivery;
mod fcm;
mod handler;
mod metrics;
mod rate_limiter;
mod retry;
mod router;
mod types;

#[cfg(test)]
mod tests;

use axum::Router;
use std::sync::Arc;
use tokio::signal;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() {
    metrics::init();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    let config = config::Config::from_env();
    let rate_limiter = Arc::new(rate_limiter::RateLimiter::new(&config));
    let retry_policy = retry::RetryPolicy::from_config(&config);

    let state = Arc::new(handler::AppState {
        apns_client: apns::ApnsClient::new(&config),
        fcm_client: fcm::FcmClient::new(&config),
        config: config.clone(),
        rate_limiter,
        retry_policy,
        start_time: std::time::Instant::now(),
    });

    let app = Router::new()
        .merge(router::create_router())
        .with_state(state)
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive());

    let addr = format!("{}:{}", config.host, config.port);
    tracing::info!("Push server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("failed to bind address");

    let shutdown_timeout = std::time::Duration::from_secs(config.shutdown_timeout_secs);

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("server error");

    tracing::info!("Shutdown timeout: {}s", config.shutdown_timeout_secs);
    tokio::time::sleep(shutdown_timeout).await;
    tracing::info!("Graceful shutdown complete");
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    tracing::info!("Shutdown signal received");
}
