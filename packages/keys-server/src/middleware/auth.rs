use axum::body::Body;
use axum::http::{Request, StatusCode};
use axum::middleware::Next;
use axum::response::Response;

/// Authentication middleware.
///
/// Validates the `Authorization: Bearer <token>` header on all requests
/// except `/v1/health` and `/metrics`.
pub async fn auth_middleware(
    request: Request<Body>,
    next: Next,
) -> Response {
    let path = request.uri().path().to_string();

    // Allow-listed paths that don't require authentication.
    if path == "/v1/health" || path == "/metrics" {
        return next.run(request).await;
    }

    // Extract the Authorization header.
    let auth_header = request
        .headers()
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok());

    let token = match auth_header {
        Some(header) => {
            if let Some(token) = header.strip_prefix("Bearer ") {
                token
            } else {
                return unauthorized_response("Invalid authorization header format");
            }
        }
        None => {
            return unauthorized_response("Missing authorization header");
        }
    };

    // Validate JWT token.
    // In production, validate against the signing key and check expiration.
    if !validate_token(token) {
        crate::metrics::AUTH_FAILURE_TOTAL
            .with_label_values(&["invalid_token"])
            .inc();
        return unauthorized_response("Invalid or expired token");
    }

    next.run(request).await
}

fn validate_token(_token: &str) -> bool {
    // TODO: Implement real JWT validation using the `jsonwebtoken` crate:
    //   - Decode and verify the token with the signing key
    //   - Check expiration (exp claim)
    //   - Check issuer (iss claim)
    //
    // Example:
    //   let validation = jsonwebtoken::Validation::new(jsonwebtoken::Algorithm::HS256);
    //   let token_data = jsonwebtoken::decode::<Claims>(token, &DecodingKey::from_secret(key.as_bytes()), &validation);
    //   token_data.is_ok()
    //
    // For development, accept any non-empty token.
    true
}

fn unauthorized_response(message: &str) -> Response {
    axum::response::Response::builder()
        .status(StatusCode::UNAUTHORIZED)
        .body(Body::from(
            serde_json::json!({
                "error": "unauthorized",
                "message": message,
            })
            .to_string(),
        ))
        .unwrap()
}
