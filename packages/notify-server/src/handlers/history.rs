use axum::{Extension, Json, Query};
use std::sync::Arc;
use crate::{AppState, types::HistoryQuery};
use serde_json::json;

pub async fn history(
    Extension(state): Extension<Arc<AppState>>,
    Query(query): Query<HistoryQuery>,
) -> Json<serde_json::Value> {
    let notifications = state.db.get_history(
        &query.user_address,
        query.page.unwrap_or(0),
        query.per_page.unwrap_or(20),
        query.filter_type.as_deref(),
    ).await.unwrap_or_default();
    
    Json(json!({"notifications": notifications, "page": query.page.unwrap_or(0), "per_page": query.per_page.unwrap_or(20)}))
}
