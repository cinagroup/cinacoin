use axum::Json;
use serde_json::json;
use lazy_static::lazy_static;
use prometheus::{Counter, Registry, TextEncoder};

lazy_static! {
    static ref NOTIFICATIONS_SENT: Counter = Counter::new("notifications_sent_total", "Total notifications sent").unwrap();
    static ref REGISTRY: Registry = Registry::new();
}

pub async fn metrics_handler() -> Json<serde_json::Value> {
    Json(json!({
        "notifications_sent": NOTIFICATIONS_SENT.get(),
    }))
}
