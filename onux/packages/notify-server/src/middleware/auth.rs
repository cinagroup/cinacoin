use axum::{
    body::Body,
    extract::Request,
    http::{header::AUTHORIZATION, StatusCode},
    middleware::Next,
    response::Response,
    Extension,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::AppState;

/// JWT claims expected in incoming tokens.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    /// Subject (user identifier).
    pub sub: String,
    /// Issuer.
    pub iss: String,
    /// Expiration time (seconds since epoch).
    pub exp: u64,
    /// Issued-at time (seconds since epoch).
    pub iat: u64,
}

/// Authentication middleware.
///
/// Validates the `Authorization: Bearer <token>` header on all requests
/// except the health and metrics endpoints. Verifies the JWT signature
/// (HMAC-SHA256), expiry, issuer, and a Redis-backed revocation blacklist.
pub async fn auth_middleware(
    Extension(state): Extension<Arc<AppState>>,
    request: Request,
    next: Next,
) -> Response {
    let path = request.uri().path().to_string();

    // Allow-listed paths that don't require authentication.
    if path == "/v1/health" || path == "/v1/metrics" || path == "/metrics" {
        return next.run(request).await;
    }

    // Extract and validate the bearer token.
    let token = match request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
    {
        Some(token) if !token.is_empty() => token.to_string(),
        Some(_) => return unauthorized_response("Empty bearer token"),
        None => return unauthorized_response("Missing or malformed authorization header"),
    };

    match validate_token(&token, &state).await {
        Ok(claims) => {
            // Attach verified claims for downstream handlers.
            let (mut parts, body) = request.into_parts();
            parts.extensions.insert(claims);
            next.run(Request::from_parts(parts, body)).await
        }
        Err(e) => unauthorized_response(&e),
    }
}

/// Validate a JWT: decode, verify signature, check expiry/issuer, and check the blacklist.
async fn validate_token(token: &str, state: &AppState) -> Result<Claims, String> {
    let secret = state.config.jwt_secret.as_bytes();

    let mut validation = Validation::new(jsonwebtoken::Algorithm::HS256);
    validation.leeway = 10; // tolerate up to 10s of clock skew
    validation.set_issuer(&["keys-server", "cinacoin"]);

    let token_data = decode::<Claims>(token, &DecodingKey::from_secret(secret), &validation)
        .map_err(|e| match e.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => "Token has expired".to_string(),
            jsonwebtoken::errors::ErrorKind::InvalidSignature => {
                "Invalid token signature".to_string()
            }
            jsonwebtoken::errors::ErrorKind::InvalidIssuer => "Invalid token issuer".to_string(),
            _ => format!("Invalid token: {}", e),
        })?;

    let claims = token_data.claims;

    // Defence-in-depth: verify expiry manually.
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();
    if claims.exp < now {
        return Err("Token has expired".to_string());
    }

    // Best-effort revocation check (don't fail closed if Redis is unavailable).
    if let Ok(true) = state.redis.is_token_revoked(token).await {
        return Err("Token has been revoked".to_string());
    }

    Ok(claims)
}

fn unauthorized_response(message: &str) -> Response {
    Response::builder()
        .status(StatusCode::UNAUTHORIZED)
        .header("content-type", "application/json")
        .body(Body::from(
            serde_json::json!({ "error": "unauthorized", "message": message }).to_string(),
        ))
        .unwrap()
}
