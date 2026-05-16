use axum::routing::{get, post};
use axum::Router;
use std::sync::Arc;

use crate::handler;
use crate::handler::AppState;

pub fn create_router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/v1/push", post(handler::push))
        .route("/v1/push/batch", post(handler::push_batch))
        .route("/v1/register", post(handler::register))
        .route("/v1/receipt/:id", get(handler::get_receipt))
        .route("/v1/health", get(handler::health))
        .route("/metrics", get(handler::metrics_handler))
}
