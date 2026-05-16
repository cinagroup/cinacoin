use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::AppState;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateInviteRequest {
    /// Number of uses allowed (0 = unlimited).
    pub max_uses: Option<u32>,
    /// Expiration timestamp (RFC3339). None = never expires.
    pub expires_at: Option<String>,
    /// Metadata attached to the invite.
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateInviteResponse {
    pub invite_code: String,
    pub invite_url: String,
    pub max_uses: Option<u32>,
    pub expires_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InviteResponse {
    pub invite_code: String,
    pub max_uses: Option<u32>,
    pub current_uses: u32,
    pub expires_at: Option<String>,
    pub status: String, // "active" | "expired" | "revoked"
    pub created_at: String,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RedeemInviteRequest {
    pub user_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RedeemInviteResponse {
    pub success: bool,
    pub user_id: String,
    pub error: Option<String>,
}

// ---------------------------------------------------------------------------
// POST /v1/invite/create
// ---------------------------------------------------------------------------

pub async fn create_invite(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<CreateInviteRequest>,
) -> impl axum::response::IntoResponse {
    let invite_code = generate_invite_code();
    let now = chrono::Utc::now().to_rfc3339();

    // TODO: Persist to PostgreSQL
    // sqlx::query!(
    //     "INSERT INTO invite_keys (invite_code, max_uses, current_uses, expires_at, metadata, status, created_at)
    //      VALUES ($1, $2, 0, $3, $4, 'active', $5)",
    //     invite_code, req.max_uses.unwrap_or(0), req.expires_at, req.metadata, now
    // )
    // .execute(&state.db)
    // .await?;

    crate::metrics::INVITE_KEY_OPS_TOTAL
        .with_label_values(&["create"])
        .inc();

    (
        StatusCode::CREATED,
        Json(CreateInviteResponse {
            invite_code: invite_code.clone(),
            invite_url: format!("/v1/invite/{}", invite_code),
            max_uses: req.max_uses,
            expires_at: req.expires_at.clone(),
            created_at: now,
        }),
    )
}

// ---------------------------------------------------------------------------
// GET /v1/invite/:invite_code
// ---------------------------------------------------------------------------

pub async fn get_invite(
    State(_state): State<Arc<AppState>>,
    Path(invite_code): Path<String>,
) -> impl axum::response::IntoResponse {
    // TODO: Fetch from cache or database
    // let cached = state.redis.cache_get(&format!("invite:{}", invite_code)).await;
    // if let Ok(Some(cached)) = cached { ... }

    crate::metrics::INVITE_KEY_OPS_TOTAL
        .with_label_values(&["get"])
        .inc();

    (
        StatusCode::OK,
        Json(InviteResponse {
            invite_code,
            max_uses: None,
            current_uses: 0,
            expires_at: None,
            status: "active".to_string(),
            created_at: chrono::Utc::now().to_rfc3339(),
            metadata: None,
        }),
    )
}

// ---------------------------------------------------------------------------
// POST /v1/invite/:invite_code/redeem
// ---------------------------------------------------------------------------

pub async fn redeem_invite(
    State(_state): State<Arc<AppState>>,
    Path(invite_code): Path<String>,
    Json(req): Json<RedeemInviteRequest>,
) -> impl axum::response::IntoResponse {
    // TODO: Validate invite, check expiry, increment usage count
    // TODO: Link user_id to invite

    crate::metrics::INVITE_KEY_OPS_TOTAL
        .with_label_values(&["redeem"])
        .inc();

    (
        StatusCode::OK,
        Json(RedeemInviteResponse {
            success: true,
            user_id: req.user_id,
            error: None,
        }),
    )
}

// ---------------------------------------------------------------------------
// DELETE /v1/invite/:invite_code
// ---------------------------------------------------------------------------

pub async fn revoke_invite(
    State(_state): State<Arc<AppState>>,
    Path(invite_code): Path<String>,
) -> impl axum::response::IntoResponse {
    // TODO: Mark invite as revoked
    // sqlx::query!(
    //     "UPDATE invite_keys SET status = 'revoked' WHERE invite_code = $1",
    //     invite_code
    // )
    // .execute(&state.db)
    // .await?;

    crate::metrics::INVITE_KEY_OPS_TOTAL
        .with_label_values(&["revoke"])
        .inc();

    (StatusCode::OK, Json(serde_json::json!({ "status": "revoked", "invite_code": invite_code })))
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn generate_invite_code() -> String {
    let uuid = Uuid::new_v4();
    let hex = uuid.to_string().replace('-', "");
    // Take first 8 chars and uppercase for a short code like "A1B2C3D4"
    hex[..8].to_uppercase()
}
