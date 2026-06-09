use axum::{Extension, Json};
use std::sync::Arc;
use crate::{AppState, types::{UnsubscribeRequest, NotificationResponse}};
use uuid::Uuid;

pub async fn unsubscribe(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<UnsubscribeRequest>,
) -> Json<NotificationResponse> {
    let _ = state.redis.remove_subscription(&req.user_address, &req.dapp_id).await;
    Json(NotificationResponse {
        id: Uuid::new_v4(),
        status: "unsubscribed".to_string(),
        message: format!("Unsubscribed from {}", req.dapp_id),
    })
}
