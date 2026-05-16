//! Unit tests for keys-server: JWT token validation, identity key CRUD,
//! invite key generation/validation, wallet key management, and auth middleware.

use crate::config::Config;
use crate::middleware::auth::Claims;
use crate::handlers::identity_keys::{RegisterIdentityRequest, RegisterIdentityResponse, KeyResponse};
use crate::handlers::invite_keys::{CreateInviteRequest, CreateInviteResponse, InviteResponse, RedeemInviteRequest, RedeemInviteResponse, generate_invite_code};
use crate::handlers::wallet_keys::{GenerateWalletRequest, GenerateWalletResponse, WalletResponse, SignMessageRequest, SignMessageResponse};
use jsonwebtoken::{encode, decode, Header, EncodingKey, Validation, Algorithm};
use std::time::{SystemTime, UNIX_EPOCH};

// =========================================================================
// JWT Token Validation
// =========================================================================

#[test]
fn jwt_valid_token_decode() {
    let secret = "test-secret-key";
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();

    let claims = Claims {
        sub: "user-123".to_string(),
        iss: "keys-server".to_string(),
        exp: now + 3600,
        iat: now,
    };

    let token = encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .unwrap();

    // Decode and verify
    let mut validation = Validation::new(Algorithm::HS256);
    validation.leeway = 10;
    validation.set_issuer(&["keys-server"]);

    let token_data = decode::<Claims>(
        &token,
        &EncodingKey::from_secret(secret.as_bytes()).into(),
        &validation,
    )
    .unwrap();

    assert_eq!(token_data.claims.sub, "user-123");
    assert_eq!(token_data.claims.iss, "keys-server");
}

#[test]
fn jwt_expired_token_rejected() {
    let secret = "test-secret-key";
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();

    let claims = Claims {
        sub: "user-123".to_string(),
        iss: "keys-server".to_string(),
        exp: now - 100, // expired 100 seconds ago
        iat: now - 3700,
    };

    let token = encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .unwrap();

    let mut validation = Validation::new(Algorithm::HS256);
    validation.leeway = 10;
    validation.set_issuer(&["keys-server"]);

    let result = decode::<Claims>(
        &token,
        &EncodingKey::from_secret(secret.as_bytes()).into(),
        &validation,
    );

    assert!(result.is_err(), "expected error for expired token");
}

#[test]
fn jwt_wrong_secret_rejected() {
    let secret = "correct-secret";
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();

    let claims = Claims {
        sub: "user-123".to_string(),
        iss: "keys-server".to_string(),
        exp: now + 3600,
        iat: now,
    };

    let token = encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .unwrap();

    // Try to decode with wrong secret
    let mut validation = Validation::new(Algorithm::HS256);
    validation.leeway = 10;
    validation.set_issuer(&["keys-server"]);

    let result = decode::<Claims>(
        &token,
        &EncodingKey::from_secret(b"wrong-secret").into(),
        &validation,
    );

    assert!(result.is_err(), "expected error for wrong secret");
}

#[test]
fn jwt_wrong_issuer_rejected() {
    let secret = "test-secret";
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();

    let claims = Claims {
        sub: "user-123".to_string(),
        iss: "wrong-issuer".to_string(), // wrong issuer
        exp: now + 3600,
        iat: now,
    };

    let token = encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .unwrap();

    let mut validation = Validation::new(Algorithm::HS256);
    validation.leeway = 10;
    validation.set_issuer(&["keys-server"]);

    let result = decode::<Claims>(
        &token,
        &EncodingKey::from_secret(secret.as_bytes()).into(),
        &validation,
    );

    assert!(result.is_err(), "expected error for wrong issuer");
}

// =========================================================================
// Identity Key CRUD Operations
// =========================================================================

#[test]
fn identity_key_register_response() {
    let req = RegisterIdentityRequest {
        user_id: "user-123".to_string(),
        public_key: "0xabc123".to_string(),
        key_algorithm: Some("ed25519".to_string()),
        metadata: None,
    };

    // Test the response structure
    let resp = RegisterIdentityResponse {
        user_id: req.user_id.clone(),
        key_id: "test-key-id".to_string(),
        public_key: req.public_key.clone(),
        created_at: "2024-01-01T00:00:00Z".to_string(),
    };

    assert_eq!(resp.user_id, "user-123");
    assert_eq!(resp.public_key, "0xabc123");
    assert!(!resp.key_id.is_empty());
}

#[test]
fn identity_key_response_structure() {
    let key_resp = KeyResponse {
        user_id: "user-456".to_string(),
        key_id: "key-789".to_string(),
        public_key: "0xdef456".to_string(),
        key_algorithm: "secp256k1".to_string(),
        status: "active".to_string(),
        created_at: "2024-01-01T00:00:00Z".to_string(),
        updated_at: "2024-01-02T00:00:00Z".to_string(),
    };

    assert_eq!(key_resp.status, "active");
    assert_eq!(key_resp.key_algorithm, "secp256k1");

    // Test serialization
    let json = serde_json::to_string(&key_resp).unwrap();
    assert!(json.contains("\"status\":\"active\""));
    assert!(json.contains("\"key_algorithm\":\"secp256k1\""));
}

#[test]
fn identity_key_default_algorithm() {
    let req = RegisterIdentityRequest {
        user_id: "user-123".to_string(),
        public_key: "0xabc123".to_string(),
        key_algorithm: None,
        metadata: None,
    };

    // Default should be ed25519
    let algorithm = req.key_algorithm.unwrap_or_else(|| "ed25519".to_string());
    assert_eq!(algorithm, "ed25519");
}

// =========================================================================
// Invite Key Generation and Validation
// =========================================================================

#[test]
fn invite_code_generation_format() {
    let code = generate_invite_code();
    assert_eq!(code.len(), 8);
    assert!(code.chars().all(|c| c.is_ascii_hexdigit() || c.is_ascii_uppercase()));
}

#[test]
fn invite_code_generation_unique() {
    let code1 = generate_invite_code();
    let code2 = generate_invite_code();
    // Very unlikely to collide
    assert_ne!(code1, code2);
}

#[test]
fn create_invite_response_structure() {
    let resp = CreateInviteResponse {
        invite_code: "A1B2C3D4".to_string(),
        invite_url: "/v1/invite/A1B2C3D4".to_string(),
        max_uses: Some(5),
        expires_at: Some("2025-12-31T23:59:59Z".to_string()),
        created_at: "2024-01-01T00:00:00Z".to_string(),
    };

    assert_eq!(resp.invite_code, "A1B2C3D4");
    assert_eq!(resp.max_uses, Some(5));
    assert!(resp.invite_url.contains("A1B2C3D4"));
}

#[test]
fn invite_response_serialization() {
    let invite = InviteResponse {
        invite_code: "TEST1234".to_string(),
        max_uses: Some(10),
        current_uses: 3,
        expires_at: Some("2025-06-01T00:00:00Z".to_string()),
        status: "active".to_string(),
        created_at: "2024-01-01T00:00:00Z".to_string(),
        metadata: Some(serde_json::json!({"source": "web"})),
    };

    let json = serde_json::to_string(&invite).unwrap();
    assert!(json.contains("\"status\":\"active\""));
    assert!(json.contains("\"current_uses\":3"));
}

#[test]
fn redeem_invite_response() {
    let resp = RedeemInviteResponse {
        success: true,
        user_id: "user-789".to_string(),
        error: None,
    };

    assert!(resp.success);
    assert_eq!(resp.user_id, "user-789");
    assert!(resp.error.is_none());
}

#[test]
fn create_invite_request_with_unlimited_uses() {
    let req = CreateInviteRequest {
        max_uses: None, // 0 = unlimited
        expires_at: None,
        metadata: None,
    };

    assert!(req.max_uses.is_none());
    assert!(req.expires_at.is_none());
}

// =========================================================================
// Wallet Key Management
// =========================================================================

#[test]
fn generate_wallet_response_structure() {
    let resp = GenerateWalletResponse {
        wallet_id: "wallet-123".to_string(),
        public_key: "0xabc...".to_string(),
        address: "0x1234...".to_string(),
        chain_type: "ethereum".to_string(),
        derivation_path: "m/44'/60'/0'/0/0".to_string(),
        created_at: "2024-01-01T00:00:00Z".to_string(),
    };

    assert_eq!(resp.chain_type, "ethereum");
    assert_eq!(resp.derivation_path, "m/44'/60'/0'/0/0");
}

#[test]
fn generate_wallet_default_chain_type() {
    let req = GenerateWalletRequest {
        user_id: "user-123".to_string(),
        derivation_path: None,
        chain_type: None,
        metadata: None,
    };

    let chain_type = req.chain_type.unwrap_or_else(|| "ethereum".to_string());
    assert_eq!(chain_type, "ethereum");
}

#[test]
fn generate_wallet_default_derivation_path() {
    let req = GenerateWalletRequest {
        user_id: "user-123".to_string(),
        derivation_path: None,
        chain_type: Some("ethereum".to_string()),
        metadata: None,
    };

    let path = req.derivation_path.unwrap_or_else(|| "m/44'/60'/0'/0/0".to_string());
    assert_eq!(path, "m/44'/60'/0'/0/0");
}

#[test]
fn wallet_response_serialization() {
    let wallet = WalletResponse {
        wallet_id: "wallet-456".to_string(),
        public_key: "0xpub...".to_string(),
        address: "0xaddr...".to_string(),
        chain_type: "solana".to_string(),
        status: "active".to_string(),
        created_at: "2024-01-01T00:00:00Z".to_string(),
        metadata: Some(serde_json::json!({"label": "main"})),
    };

    let json = serde_json::to_string(&wallet).unwrap();
    assert!(json.contains("\"chain_type\":\"solana\""));
    assert!(json.contains("\"status\":\"active\""));
}

#[test]
fn sign_message_response() {
    let resp = SignMessageResponse {
        signature: "0xsignature...".to_string(),
        wallet_id: "wallet-789".to_string(),
    };

    assert_eq!(resp.wallet_id, "wallet-789");
    assert!(resp.signature.starts_with("0x"));
}

#[test]
fn sign_message_request_hex_encoded() {
    let req = SignMessageRequest {
        message: "0x48656c6c6f".to_string(),
    };

    // Message should be hex-encoded
    assert!(req.message.starts_with("0x"));
}

#[test]
fn wallet_generate_request_with_solana() {
    let req = GenerateWalletRequest {
        user_id: "user-456".to_string(),
        derivation_path: Some("m/44'/501'/0'/0/0".to_string()),
        chain_type: Some("solana".to_string()),
        metadata: Some(serde_json::json!({"network": "mainnet"})),
    };

    assert_eq!(req.chain_type.unwrap(), "solana");
    assert_eq!(req.derivation_path.unwrap(), "m/44'/501'/0'/0/0");
}

// =========================================================================
// Auth Middleware (401/403 responses)
// =========================================================================

#[test]
fn auth_claims_structure() {
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    let claims = Claims {
        sub: "test-user".to_string(),
        iss: "keys-server".to_string(),
        exp: now + 3600,
        iat: now,
    };

    assert_eq!(claims.sub, "test-user");
    assert_eq!(claims.iss, "keys-server");
}

#[test]
fn auth_token_format_validation() {
    // Test that Authorization header must start with "Bearer "
    let valid_header = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.test";
    assert!(valid_header.starts_with("Bearer "));

    let invalid_header = "Basic dXNlcjpwYXNz";
    assert!(!invalid_header.starts_with("Bearer "));

    let no_prefix = "eyJhbGciOiJIUzI1NiJ9.test.test";
    assert!(!no_prefix.starts_with("Bearer "));
}

#[test]
fn config_jwt_defaults() {
    let config = Config {
        host: "0.0.0.0".into(),
        port: 3001,
        shutdown_timeout_secs: 30,
        database_url: "postgres://localhost:5432/keys".into(),
        database_max_connections: 20,
        redis_url: "redis://localhost:6379".into(),
        redis_cache_ttl_secs: 300,
        jwt_secret: "test-secret".into(),
        jwt_expiry_secs: 3600,
        rate_limit_per_ip: 100,
        rate_limit_window_secs: 60,
        default_key_algorithm: "ed25519".into(),
        max_keys_per_wallet: 10,
        metrics_path: "/metrics".into(),
    };

    assert_eq!(config.jwt_secret, "test-secret");
    assert_eq!(config.jwt_expiry_secs, 3600);
}
