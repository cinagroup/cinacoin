use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::Response,
};

pub struct AuthLayer;

impl AuthLayer {
    pub fn new() -> Self { Self }
}

pub async fn auth_middleware(
    req: Request,
    next: Next,
) -> Response {
    // JWT validation placeholder
    let auth_header = req.headers().get("Authorization");
    if auth_header.is_none() {
        return StatusCode::UNAUTHORIZED.into_response();
    }
    next.run(req).await
}
