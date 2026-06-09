use crate::config::Config;
use crate::metrics;
use crate::types::{DeliveryReceipt, PushResponse};
use redis::AsyncCommands;
use tracing;

/// Store a delivery receipt in Redis for later retrieval.
pub async fn store_receipt(
    redis_url: &str,
    receipt: &DeliveryReceipt,
    ttl_secs: u64,
) -> Result<(), String> {
    let client =
        redis::Client::open(redis_url.as_str()).map_err(|e| format!("Redis client error: {}", e))?;

    let mut conn = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| format!("Redis connection error: {}", e))?;

    let key = format!("receipt:{}", receipt.receipt_id);
    let value =
        serde_json::to_string(receipt).map_err(|e| format!("Serialize error: {}", e))?;

    let _: () = conn
        .set_ex(key, value, ttl_secs)
        .await
        .map_err(|e| format!("Redis SET error: {}", e))?;

    tracing::debug!(
        receipt_id = %receipt.receipt_id,
        "Delivery receipt stored"
    );

    Ok(())
}

/// Retrieve a delivery receipt by ID.
pub async fn get_receipt(redis_url: &str, receipt_id: &str) -> Result<Option<DeliveryReceipt>, String> {
    let client =
        redis::Client::open(redis_url.as_str()).map_err(|e| format!("Redis client error: {}", e))?;

    let mut conn = client
        .get_multiplexed_async_connection()
        .await
        .map_err(|e| format!("Redis connection error: {}", e))?;

    let key = format!("receipt:{}", receipt_id);
    let value: Option<String> = conn
        .get(key)
        .await
        .map_err(|e| format!("Redis GET error: {}", e))?;

    match value {
        Some(v) => {
            let receipt: DeliveryReceipt = serde_json::from_str(&v)
                .map_err(|e| format!("Deserialize error: {}", e))?;
            Ok(Some(receipt))
        }
        None => Ok(None),
    }
}

/// Build a DeliveryReceipt from a PushResponse.
pub fn build_receipt(
    receipt_id: String,
    token: String,
    platform: &str,
    resp: &PushResponse,
    retry_attempts: u32,
) -> DeliveryReceipt {
    DeliveryReceipt {
        receipt_id,
        token,
        platform: platform.to_string(),
        success: resp.success,
        message_id: resp.message_id.clone(),
        error: resp.error.clone(),
        timestamp: chrono::Utc::now().to_rfc3339(),
        retry_attempts,
    }
}

/// Record delivery metrics from a receipt.
pub fn record_metrics(receipt: &DeliveryReceipt) {
    if receipt.success {
        metrics::PUSH_DELIVERY_SUCCESS
            .with_label_values(&[&receipt.platform])
            .inc();
    } else {
        metrics::PUSH_DELIVERY_FAILURE
            .with_label_values(&[&receipt.platform])
            .inc();
    }

    metrics::PUSH_DELIVERY_LATENCY
        .with_label_values(&[&receipt.platform])
        .observe(receipt.retry_attempts as f64);
}
