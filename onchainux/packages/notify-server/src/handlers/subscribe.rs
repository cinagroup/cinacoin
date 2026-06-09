use axum::{Extension, Json};
use std::sync::Arc;
use crate::{AppState, types::{SubscribeRequest, NotificationResponse}};
use uuid::Uuid;

pub async fn subscribe(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<SubscribeRequest>,
) -> Json<NotificationResponse> {
    let _ = state.redis.add_subscription(&req.user_address, &req.dapp_id).await;
    Json(NotificationResponse {
        id: Uuid::new_v4(),
        status: "subscribed".to_string(),
        message: format!("Subscribed to dApp {}", req.dapp_id),
    })
}
