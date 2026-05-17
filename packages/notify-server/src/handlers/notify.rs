use axum::{Extension, Json};
use std::sync::Arc;
use crate::{AppState, types::{NotifyRequest, Notification, NotificationResponse}};
use uuid::Uuid;

pub async fn notify(
    Extension(state): Extension<Arc<AppState>>,
    Json(req): Json<NotifyRequest>,
) -> Json<NotificationResponse> {
    let notification = Notification {
        id: Uuid::new_v4(),
        user_address: req.user_address,
        dapp_id: req.dapp_id,
        notification_type: req.notification_type,
        title: req.title,
        body: req.body,
        data: req.data,
        status: crate::types::NotificationStatus::Pending,
        created_at: chrono::Utc::now(),
        sent_at: None,
        read_at: None,
    };
    
    let id = state.db.insert_notification(&notification).await.unwrap_or(Uuid::nil());
    
    let _ = state.push_client
        .post(&format!("{}/v1/push", state.config.push_server_url))
        .json(&serde_json::json!({"address": notification.user_address, "title": notification.title, "body": notification.body}))
        .send().await;
    
    Json(NotificationResponse { id, status: "sent".into(), message: "Notification sent".into() })
}
