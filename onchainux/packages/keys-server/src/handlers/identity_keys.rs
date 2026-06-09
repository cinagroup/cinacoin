use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::AppState;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterIdentityRequest {
    pub user_id: String,
    pub public_key: String,
    pub key_algorithm: Option<String>, // "ed25519" (default) or "secp256k1"
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterIdentityResponse {
    pub user_id: String,
    pub key_id: String,
    public_key: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KeyResponse {
    pub user_id: String,
    pub key_id: String,
    pub public_key: String,
    pub key_algorithm: String,
    pub status: String, // "active" | "revoked" | "rotated"
    pub created_at: String,
    pub updated_at: String,
}

// ---------------------------------------------------------------------------
// POST /v1/identity/register
// ---------------------------------------------------------------------------

pub async fn register(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<RegisterIdentityRequest>,
) -> impl axum::response::IntoResponse {
    let key_id = Uuid::new_v4().to_string();
    let algorithm = req.key_algorithm.unwrap_or_else(|| "ed25519".to_string());
    let now = chrono::Utc::now().to_rfc3339();

    // TODO: Persist to PostgreSQL
    // sqlx::query!(
    //     "INSERT INTO identity_keys (user_id, key_id, public_key, algorithm, status, metadata, created_at)
    //      VALUES ($1, $2, $3, $4, 'active', $5, $6)",
    //     req.user_id, key_id, req.public_key, algorithm, req.metadata, now
    // )
    // .execute(&state.db)
    // .await
    // .map_err(...) ?;

    tracing::info!(user_id = %req.user_id, key_id = %key_id, "Identity key registered");

    (
        StatusCode::CREATED,
        Json(RegisterIdentityResponse {
            user_id: req.user_id,
            key_id,
            public_key: req.public_key,
            created_at: now,
        }),
    )
}

// ---------------------------------------------------------------------------
// GET /v1/identity/:user_id/key
// ---------------------------------------------------------------------------

pub async fn get_key(
    State(_state): State<Arc<AppState>>,
    Path(user_id): Path<String>,
) -> impl axum::response::IntoResponse {
    // TODO: Fetch from PostgreSQL or Redis cache
    // let cached = state.redis.cache_get(&format!("identity:{}", user_id)).await;
    // if let Ok(Some(cached)) = cached { ... }
    // let row = sqlx::query!(...).fetch_one(&state.db).await?;

    (
        StatusCode::OK,
        Json(KeyResponse {
            user_id,
            key_id: "example-key-id".to_string(),
            public_key: "example-public-key".to_string(),
            key_algorithm: "ed25519".to_string(),
            status: "active".to_string(),
            created_at: chrono::Utc::now().to_rfc3339(),
            updated_at: chrono::Utc::now().to_rfc3339(),
        }),
    )
}

// ---------------------------------------------------------------------------
// PUT /v1/identity/:user_id/key
// ---------------------------------------------------------------------------

pub async fn rotate_key(
    State(_state): State<Arc<AppState>>,
    Path(user_id): Path<String>,
    Json(req): Json<RegisterIdentityRequest>,
) -> impl axum::response::IntoResponse {
    let key_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    // TODO: Mark old key as rotated, insert new key
    // sqlx::query!(
    //     "UPDATE identity_keys SET status = 'rotated', updated_at = $1 WHERE user_id = $2 AND status = 'active'",
    //     now, user_id
    // )
    // .execute(&state.db)
    // .await?;

    tracing::info!(user_id = %user_id, key_id = %key_id, "Identity key rotated");

    (
        StatusCode::OK,
        Json(RegisterIdentityResponse {
            user_id,
            key_id,
            public_key: req.public_key,
            created_at: now,
        }),
    )
}

// ---------------------------------------------------------------------------
// DELETE /v1/identity/:user_id/key
// ---------------------------------------------------------------------------

pub async fn revoke_key(
    State(_state): State<Arc<AppState>>,
    Path(user_id): Path<String>,
) -> impl axum::response::IntoResponse {
    // TODO: Mark key as revoked
    // sqlx::query!(
    //     "UPDATE identity_keys SET status = 'revoked', updated_at = $1 WHERE user_id = $2",
    //     chrono::Utc::now(), user_id
    // )
    // .execute(&state.db)
    // .await?;

    tracing::info!(user_id = %user_id, "Identity key revoked");

    (StatusCode::OK, Json(serde_json::json!({ "status": "revoked", "user_id": user_id })))
}
