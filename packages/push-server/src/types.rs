use serde::{Deserialize, Serialize};

/// Platform identifier for push routing.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Platform {
    Apns,
    Fcm,
}

/// Unified push notification request body.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PushRequest {
    /// Device-specific token (APNs device token or FCM registration ID).
    pub token: String,
    /// Platform: "apns" or "fcm".
    pub platform: Platform,
    /// Notification title.
    pub title: Option<String>,
    /// Notification body text.
    pub body: String,
    /// Optional badge number (APNs only).
    pub badge: Option<i32>,
    /// Optional sound name or file path.
    pub sound: Option<String>,
    /// Custom key-value payload for the notification.
    #[serde(default)]
    pub data: std::collections::HashMap<String, String>,
    /// Optional priority: "high" or "normal" (default: "high").
    pub priority: Option<String>,
    /// Optional time-to-live in seconds (FCM only, default: 2419200 = 4 weeks).
    pub ttl: Option<u32>,
    /// Collapse key for grouping notifications (FCM).
    pub collapse_key: Option<String>,
    /// Thread identifier for grouping notifications (APNs).
    pub thread_id: Option<String>,
    /// Mutable content flag for APNs (allows Notification Service Extension).
    pub mutable_content: Option<bool>,
    /// Custom category identifier for APNs action buttons.
    pub category: Option<String>,
    /// Application identifier for rate limiting.
    pub app_id: Option<String>,
}

/// Unified push notification response.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PushResponse {
    /// Whether the push was accepted by the platform.
    pub success: bool,
    /// Platform-specific message ID.
    pub message_id: Option<String>,
    /// Error description if push failed.
    pub error: Option<String>,
    /// Platform that handled the push.
    pub platform: String,
    /// Number of retry attempts made (0 on first attempt).
    pub retry_attempts: u32,
    /// Delivery receipt ID for tracking.
    pub receipt_id: Option<String>,
}

/// Delivery receipt stored in Redis for tracking.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeliveryReceipt {
    /// Unique receipt identifier.
    pub receipt_id: String,
    /// Device token the notification was sent to.
    pub token: String,
    /// Platform used (apns / fcm).
    pub platform: String,
    /// Whether delivery succeeded.
    pub success: bool,
    /// Provider message ID.
    pub message_id: Option<String>,
    /// Error if delivery failed.
    pub error: Option<String>,
    /// Timestamp of delivery attempt (RFC3339).
    pub timestamp: String,
    /// Number of retry attempts.
    pub retry_attempts: u32,
}

/// Batch push request for sending to multiple devices.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchPushRequest {
    /// Individual push requests.
    pub pushes: Vec<PushRequest>,
}

/// Batch push response.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchPushResponse {
    /// Total number of pushes in the request.
    pub total: usize,
    /// Number of successful pushes.
    pub success: usize,
    /// Number of failed pushes.
    pub failed: usize,
    /// Individual results.
    pub results: Vec<PushResponse>,
}

/// Device token registration request.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterRequest {
    /// Device token / registration ID.
    pub token: String,
    /// Platform: "apns" or "fcm".
    pub platform: Platform,
    /// Optional user identifier to associate with this device.
    pub user_id: Option<String>,
    /// Optional app version.
    pub app_version: Option<String>,
    /// Device model identifier.
    pub device_model: Option<String>,
    /// Application identifier.
    pub app_id: Option<String>,
}

/// Device token registration response.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterResponse {
    /// Whether registration succeeded.
    pub success: bool,
    /// Device identifier in our system.
    pub device_id: Option<String>,
    /// Error description if registration failed.
    pub error: Option<String>,
}

/// Health check response with dependency status.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
    pub uptime_secs: u64,
    pub dependencies: DependencyStatus,
    pub timestamp: String,
}

/// Status of each dependency.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyStatus {
    pub redis: DependencyHealth,
    pub apns: DependencyHealth,
    pub fcm: DependencyHealth,
}

/// Health of a single dependency.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyHealth {
    pub status: String, // "healthy" | "degraded" | "unhealthy"
    pub details: Option<String>,
}

/// Rate limit exceeded response.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitResponse {
    pub error: String,
    pub retry_after_secs: u64,
}

/// Internal device record for Redis storage.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceRecord {
    pub token: String,
    pub platform: Platform,
    pub user_id: Option<String>,
    pub app_version: Option<String>,
    pub device_model: Option<String>,
    pub app_id: Option<String>,
    pub registered_at: chrono::DateTime<chrono::Utc>,
}
