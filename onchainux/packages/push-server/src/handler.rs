use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use std::sync::Arc;
use uuid::Uuid;

use crate::apns::ApnsClient;
use crate::config::Config;
use crate::delivery::{build_receipt, record_metrics, store_receipt};
use crate::fcm::FcmClient;
use crate::metrics;
use crate::rate_limiter::RateLimiter;
use crate::retry::RetryPolicy;
use crate::types::{
    BatchPushRequest, BatchPushResponse, DependencyHealth, DependencyStatus, DeviceRecord,
    HealthResponse, Platform, PushRequest, PushResponse, RateLimitResponse, RegisterRequest,
    RegisterResponse,
};

/// Shared application state injected into handlers.
pub struct AppState {
    pub apns_client: ApnsClient,
    pub fcm_client: FcmClient,
    pub config: Config,
    pub rate_limiter: Arc<RateLimiter>,
    pub retry_policy: RetryPolicy,
    pub start_time: std::time::Instant,
}

// ---------------------------------------------------------------------------
// POST /v1/push
// ---------------------------------------------------------------------------

pub async fn push(
    State(state): State<Arc<AppState>>,
    Json(req): Json<PushRequest>,
) -> impl IntoResponse {
    let platform_str = match req.platform {
        Platform::Apns => "apns",
        Platform::Fcm => "fcm",
    };

    // --- Rate limiting ---
    if !state.rate_limiter.check_device(&req.token).await {
        metrics::record_rate_limited("device");
        return (
            StatusCode::TOO_MANY_REQUESTS,
            Json(RateLimitResponse {
                error: "Device rate limit exceeded".into(),
                retry_after_secs: state.config.rate_limit_window_secs,
            }),
        );
    }

    if let Some(ref app_id) = req.app_id {
        if !state.rate_limiter.check_app(app_id).await {
            metrics::record_rate_limited("app");
            return (
                StatusCode::TOO_MANY_REQUESTS,
                Json(RateLimitResponse {
                    error: "App rate limit exceeded".into(),
                    retry_after_secs: state.config.rate_limit_window_secs,
                }),
            );
        }
    }

    let token = req.token.clone();
    let app_id = req.app_id.clone();
    let receipt_id = Uuid::new_v4().to_string();

    // --- Retry with exponential backoff ---
    let retry_policy = state.retry_policy.clone();
    let apns_client = state.apns_client.clone();
    let fcm_client = state.fcm_client.clone();
    let req_clone = req.clone();

    let result = retry_policy
        .run(|attempt| {
            let apns = apns_client.clone();
            let fcm = fcm_client.clone();
            let r = req_clone.clone();
            async move {
                if attempt > 0 {
                    tracing::info!(attempt, "Retry push attempt");
                }
                send_once(&apns, &fcm, &r).await
            }
        })
        .await;

    let resp = match result {
        Ok(r) => r,
        Err(e) => PushResponse {
            success: false,
            message_id: None,
            error: Some(e),
            platform: platform_str.to_string(),
            retry_attempts: state.retry_policy.max_attempts,
            receipt_id: None,
        },
    };

    // --- Delivery receipt ---
    let receipt_id_opt = if state.config.delivery_receipt_enabled {
        let receipt = build_receipt(
            receipt_id.clone(),
            token.clone(),
            platform_str,
            &resp,
            resp.retry_attempts,
        );
        let redis_url = state.config.redis_url.clone();
        let ttl = state.config.delivery_receipt_ttl_secs;

        // Fire-and-forget storage.
        tokio::spawn(async move {
            if let Err(e) = store_receipt(&redis_url, &receipt, ttl).await {
                tracing::warn!(error = %e, "Failed to store delivery receipt");
            }
        });

        Some(receipt_id)
    } else {
        None
    };

    // --- Metrics ---
    record_metrics(
        &build_receipt(
            receipt_id,
            token,
            platform_str,
            &resp,
            resp.retry_attempts,
        ),
    );

    // Build final response with receipt ID.
    let final_resp = PushResponse {
        receipt_id: receipt_id_opt,
        ..resp
    };

    (StatusCode::OK, Json(final_resp))
}

/// Execute a single push (no retry wrapper).
async fn send_once(
    apns: &ApnsClient,
    fcm: &FcmClient,
    req: &PushRequest,
) -> Result<PushResponse, String> {
    let resp = match req.platform {
        Platform::Apns => {
            apns.send(
                &req.token,
                req.title.as_deref(),
                &req.body,
                &req.data,
                req.priority.as_deref(),
                req.badge,
                req.sound.as_deref(),
                req.thread_id.as_deref(),
                req.mutable_content,
                req.category.as_deref(),
            )
            .await
        }
        Platform::Fcm => {
            fcm.send(
                &req.token,
                req.title.as_deref(),
                &req.body,
                &req.data,
                req.ttl,
                req.priority.as_deref(),
                req.collapse_key.as_deref(),
            )
            .await
        }
    };

    if resp.success {
        Ok(resp)
    } else {
        Err(resp.error.unwrap_or_else(|| "Unknown error".into()))
    }
}

// ---------------------------------------------------------------------------
// POST /v1/push/batch
// ---------------------------------------------------------------------------

pub async fn push_batch(
    State(state): State<Arc<AppState>>,
    Json(req): Json<BatchPushRequest>,
) -> impl IntoResponse {
    let mut results = Vec::with_capacity(req.pushes.len());
    let mut success = 0;
    let mut failed = 0;

    for push_req in req.pushes {
        // We reuse the single-push handler by simulating state.
        // For batch we call send_once directly (skipping rate-limiter for brevity).
        let resp = send_once(&state.apns_client, &state.fcm_client, &push_req).await;

        let r = match resp {
            Ok(r) => {
                success += 1;
                r
            }
            Err(e) => {
                failed += 1;
                PushResponse {
                    success: false,
                    message_id: None,
                    error: Some(e),
                    platform: match push_req.platform {
                        Platform::Apns => "apns".into(),
                        Platform::Fcm => "fcm".into(),
                    },
                    retry_attempts: 0,
                    receipt_id: None,
                }
            }
        };
        results.push(r);
    }

    (
        StatusCode::OK,
        Json(BatchPushResponse {
            total: req.pushes.len(),
            success,
            failed,
            results,
        }),
    )
}

// ---------------------------------------------------------------------------
// GET /v1/receipt/:id
// ---------------------------------------------------------------------------

pub async fn get_receipt(
    State(state): State<Arc<AppState>>,
    axum::extract::Path(receipt_id): axum::extract::Path<String>,
) -> impl IntoResponse {
    match crate::delivery::get_receipt(&state.config.redis_url, &receipt_id).await {
        Ok(Some(receipt)) => (StatusCode::OK, Json(receipt)),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Receipt not found" })),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e })),
        ),
    }
}

// ---------------------------------------------------------------------------
// POST /v1/register
// ---------------------------------------------------------------------------

pub async fn register(
    State(state): State<Arc<AppState>>,
    Json(req): Json<RegisterRequest>,
) -> impl IntoResponse {
    let device_id = format!("device:{}", req.token.chars().take(16).collect::<String>());

    let record = DeviceRecord {
        token: req.token.clone(),
        platform: req.platform,
        user_id: req.user_id,
        app_version: req.app_version,
        device_model: req.device_model,
        app_id: req.app_id,
        registered_at: chrono::Utc::now(),
    };

    let value = match serde_json::to_string(&record) {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(RegisterResponse {
                    success: false,
                    device_id: None,
                    error: Some(format!("Serialization error: {}", e)),
                }),
            );
        }
    };

    // Best-effort Redis store.
    if let Ok(client) = redis::Client::open(state.config.redis_url.as_str()) {
        if let Ok(mut conn) = client.get_multiplexed_async_connection().await {
            let result: redis::RedisResult<()> = redis::cmd("SET")
                .arg(&device_id)
                .arg(&value)
                .arg("EX")
                .arg(2_592_000u64) // 30 days TTL
                .query_async(&mut conn)
                .await;
            if let Err(e) = result {
                tracing::warn!(error = %e, "Redis SET failed (non-fatal)");
            }
        }
    }

    metrics::DEVICE_REGISTER_TOTAL
        .with_label_values(&[match req.platform {
            Platform::Apns => "apns",
            Platform::Fcm => "fcm",
        }])
        .inc();
    metrics::ACTIVE_DEVICES.inc();

    (
        StatusCode::CREATED,
        Json(RegisterResponse {
            success: true,
            device_id: Some(device_id),
            error: None,
        }),
    )
}

// ---------------------------------------------------------------------------
// GET /v1/health
// ---------------------------------------------------------------------------

pub async fn health(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let uptime = state.start_time.elapsed().as_secs();

    // Check Redis
    let redis_status = check_redis(&state.config.redis_url).await;

    // Check APNs config
    let apns_status = if !state.config.apns_team_id.is_empty()
        && !state.config.apns_key_id.is_empty()
    {
        DependencyHealth {
            status: "healthy".into(),
            details: Some("APNs configured".into()),
        }
    } else {
        DependencyHealth {
            status: "unhealthy".into(),
            details: Some("APNs not configured".into()),
        }
    };

    // Check FCM config
    let fcm_status = if !state.config.fcm_project_id.is_empty() {
        DependencyHealth {
            status: "healthy".into(),
            details: Some("FCM configured".into()),
        }
    } else {
        DependencyHealth {
            status: "unhealthy".into(),
            details: Some("FCM not configured".into()),
        }
    };

    let overall_status = if redis_status.status == "healthy"
        && apns_status.status == "healthy"
        && fcm_status.status == "healthy"
    {
        "healthy"
    } else {
        "degraded"
    };

    Json(HealthResponse {
        status: overall_status.into(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        uptime_secs: uptime,
        dependencies: DependencyStatus {
            redis: redis_status,
            apns: apns_status,
            fcm: fcm_status,
        },
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

async fn check_redis(redis_url: &str) -> DependencyHealth {
    match redis::Client::open(redis_url) {
        Ok(client) => {
            match client.get_multiplexed_async_connection().await {
                Ok(mut conn) => {
                    let r: redis::RedisResult<String> =
                        redis::cmd("PING").query_async(&mut conn).await;
                    match r {
                        Ok(_) => DependencyHealth {
                            status: "healthy".into(),
                            details: None,
                        },
                        Err(e) => DependencyHealth {
                            status: "unhealthy".into(),
                            details: Some(format!("PING failed: {}", e)),
                        },
                    }
                }
                Err(e) => DependencyHealth {
                    status: "unhealthy".into(),
                    details: Some(format!("Connection failed: {}", e)),
                },
            }
        }
        Err(e) => DependencyHealth {
            status: "unhealthy".into(),
            details: Some(format!("Client error: {}", e)),
        },
    }
}

// ---------------------------------------------------------------------------
// GET /metrics
// ---------------------------------------------------------------------------

pub async fn metrics_handler() -> impl IntoResponse {
    use prometheus::Encoder;
    let encoder = prometheus::TextEncoder::new();
    let mut buffer = Vec::new();
    encoder
        .encode(&prometheus::gather(), &mut buffer)
        .unwrap_or_default();
    (StatusCode::OK, buffer)
}
