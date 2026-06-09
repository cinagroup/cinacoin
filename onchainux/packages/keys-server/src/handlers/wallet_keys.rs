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
pub struct GenerateWalletRequest {
    pub user_id: String,
    /// Key derivation path (BIP32/BIP44).
    pub derivation_path: Option<String>,
    /// Chain type: "ethereum", "solana", "bitcoin".
    pub chain_type: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateWalletResponse {
    pub wallet_id: String,
    pub public_key: String,
    pub address: String,
    pub chain_type: String,
    pub derivation_path: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WalletResponse {
    pub wallet_id: String,
    pub public_key: String,
    pub address: String,
    pub chain_type: String,
    pub status: String, // "active" | "deleted"
    pub created_at: String,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SignMessageRequest {
    /// Hex-encoded message to sign.
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SignMessageResponse {
    pub signature: String,
    pub wallet_id: String,
}

// ---------------------------------------------------------------------------
// POST /v1/wallet/generate
// ---------------------------------------------------------------------------

pub async fn generate_wallet(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<GenerateWalletRequest>,
) -> impl axum::response::IntoResponse {
    let wallet_id = Uuid::new_v4().to_string();
    let chain_type = req.chain_type.unwrap_or_else(|| "ethereum".to_string());
    let derivation_path = req
        .derivation_path
        .unwrap_or_else(|| "m/44'/60'/0'/0/0".to_string());
    let now = chrono::Utc::now().to_rfc3339();

    // TODO: Generate actual keypair using ring or ed25519-dalek
    // let keypair = ring::signature::Ed25519KeyPair::generate_pkcs8(rng)?;
    // let public_key = extract_public_key(&keypair)?;
    // let address = derive_address(&public_key, &chain_type)?;

    // TODO: Persist encrypted key material to PostgreSQL
    // sqlx::query!(
    //     "INSERT INTO wallet_keys (wallet_id, user_id, encrypted_key, public_key, address, chain_type, derivation_path, status, metadata, created_at)
    //      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9)",
    //     wallet_id, req.user_id, encrypted_key, public_key, address, chain_type, derivation_path, req.metadata, now
    // )
    // .execute(&state.db)
    // .await?;

    crate::metrics::WALLET_KEY_OPS_TOTAL
        .with_label_values(&["generate"])
        .inc();
    crate::metrics::ACTIVE_WALLET_KEYS.inc();

    (
        StatusCode::CREATED,
        Json(GenerateWalletResponse {
            wallet_id,
            public_key: "0x...".to_string(),
            address: "0x...".to_string(),
            chain_type,
            derivation_path,
            created_at: now,
        }),
    )
}

// ---------------------------------------------------------------------------
// GET /v1/wallet/:wallet_id
// ---------------------------------------------------------------------------

pub async fn get_wallet(
    State(_state): State<Arc<AppState>>,
    Path(wallet_id): Path<String>,
) -> impl axum::response::IntoResponse {
    // TODO: Fetch from cache or database
    // let cached = state.redis.cache_get(&format!("wallet:{}", wallet_id)).await;

    crate::metrics::WALLET_KEY_OPS_TOTAL
        .with_label_values(&["get"])
        .inc();

    (
        StatusCode::OK,
        Json(WalletResponse {
            wallet_id,
            public_key: "0x...".to_string(),
            address: "0x...".to_string(),
            chain_type: "ethereum".to_string(),
            status: "active".to_string(),
            created_at: chrono::Utc::now().to_rfc3339(),
            metadata: None,
        }),
    )
}

// ---------------------------------------------------------------------------
// POST /v1/wallet/:wallet_id/sign
// ---------------------------------------------------------------------------

pub async fn sign_message(
    State(_state): State<Arc<AppState>>,
    Path(wallet_id): Path<String>,
    Json(req): Json<SignMessageRequest>,
) -> impl axum::response::IntoResponse {
    // TODO: Load encrypted private key from secure storage
    // TODO: Sign message using ring or appropriate crypto library
    // let signature = sign_with_key(&encrypted_key, &req.message)?;

    crate::metrics::WALLET_KEY_OPS_TOTAL
        .with_label_values(&["sign"])
        .inc();

    (
        StatusCode::OK,
        Json(SignMessageResponse {
            signature: "0x...".to_string(),
            wallet_id,
        }),
    )
}

// ---------------------------------------------------------------------------
// DELETE /v1/wallet/:wallet_id
// ---------------------------------------------------------------------------

pub async fn delete_wallet(
    State(_state): State<Arc<AppState>>,
    Path(wallet_id): Path<String>,
) -> impl axum::response::IntoResponse {
    // TODO: Mark wallet as deleted (soft delete - never actually destroy key material)
    // sqlx::query!(
    //     "UPDATE wallet_keys SET status = 'deleted' WHERE wallet_id = $1",
    //     wallet_id
    // )
    // .execute(&state.db)
    // .await?;

    crate::metrics::WALLET_KEY_OPS_TOTAL
        .with_label_values(&["delete"])
        .inc();
    crate::metrics::ACTIVE_WALLET_KEYS.dec();

    (StatusCode::OK, Json(serde_json::json!({ "status": "deleted", "wallet_id": wallet_id })))
}
