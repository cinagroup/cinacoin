//! JWT bearer-token authentication for the push server.
//!
//! Every endpoint except health/metrics requires a valid `Authorization:
//! Bearer <token>` header. Tokens are verified with HMAC-SHA256 against the
//! configured `JWT_SECRET`, including signature, expiry, and issuer checks.

use axum::{
    body::Body,
    extract::{Request, State},
    http::{header::AUTHORIZATION, StatusCode},
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::handler::AppState;

/// JWT claims expected in inbound tokens.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub iss: String,
    pub exp: u64,
    pub iat: u64,
}

/// Auth middleware. Allow-lists health/metrics; everything else needs a valid JWT.
pub async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    request: Request,
    next: Next,
) -> Response {
    let path = request.uri().path().to_string();
    if path == "/v1/health" || path == "/metrics" || path == state.config.metrics_path {
        return next.run(request).await;
    }

    let token = match request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
    {
        Some(t) if !t.is_empty() => t.to_string(),
        Some(_) => return unauthorized("Empty bearer token"),
        None => return unauthorized("Missing or malformed authorization header"),
    };

    match validate_token(&token, &state.config.jwt_secret) {
        Ok(claims) => {
            let (mut parts, body) = request.into_parts();
            parts.extensions.insert(claims);
            next.run(Request::from_parts(parts, body)).await
        }
        Err(e) => unauthorized(&e),
    }
}

fn validate_token(token: &str, secret: &str) -> Result<Claims, String> {
    let mut validation = Validation::new(jsonwebtoken::Algorithm::HS256);
    validation.leeway = 10;
    validation.set_issuer(&["keys-server", "cinacoin"]);

    let data = decode::<Claims>(token, &DecodingKey::from_secret(secret.as_bytes()), &validation)
        .map_err(|e| match e.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => "Token has expired".to_string(),
            jsonwebtoken::errors::ErrorKind::InvalidSignature => {
                "Invalid token signature".to_string()
            }
            jsonwebtoken::errors::ErrorKind::InvalidIssuer => "Invalid token issuer".to_string(),
            _ => format!("Invalid token: {}", e),
        })?;

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();
    if data.claims.exp < now {
        return Err("Token has expired".to_string());
    }

    Ok(data.claims)
}

fn unauthorized(message: &str) -> Response {
    Response::builder()
        .status(StatusCode::UNAUTHORIZED)
        .header("content-type", "application/json")
        .body(Body::from(
            serde_json::json!({ "error": "unauthorized", "message": message }).to_string(),
        ))
        .unwrap()
}
