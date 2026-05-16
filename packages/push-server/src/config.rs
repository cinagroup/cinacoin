use serde::Deserialize;

/// Application configuration loaded from environment variables.
#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    // --- Server ---
    /// Server bind host.
    pub host: String,
    /// Server bind port.
    pub port: u16,
    /// Graceful shutdown timeout in seconds.
    pub shutdown_timeout_secs: u64,

    // --- APNs ---
    /// APNs team ID (10-char string from Apple Developer portal).
    pub apns_team_id: String,
    /// APNs key ID (10-char string for the .p8 key).
    pub apns_key_id: String,
    /// Path to the APNs private key file (PKCS#8 .p8).
    pub apns_cert_path: String,
    /// APNs bundle identifier (e.g. "com.example.app").
    pub apns_topic: String,
    /// APNs environment: "production" or "development".
    pub apns_environment: String,
    /// Base URL for APNs (Apple manages this; override for testing).
    pub apns_base_url: String,

    // --- FCM ---
    /// Firebase Cloud Messaging project ID.
    pub fcm_project_id: String,
    /// Path to Firebase service account JSON key.
    pub fcm_service_account_path: String,

    // --- Redis ---
    /// Redis URL for device token caching and rate limiting.
    pub redis_url: String,

    // --- Rate Limiting ---
    /// Max push requests per minute per device token.
    pub rate_limit_per_device: u32,
    /// Max push requests per minute per app.
    pub rate_limit_per_app: u32,
    /// Rate limit window in seconds.
    pub rate_limit_window_secs: u64,

    // --- Retry ---
    /// Max retry attempts for transient push failures.
    pub retry_max_attempts: u32,
    /// Initial retry delay in milliseconds.
    pub retry_initial_delay_ms: u64,
    /// Max retry delay in milliseconds.
    pub retry_max_delay_ms: u64,
    /// Retry backoff multiplier.
    pub retry_backoff_multiplier: f64,

    // --- Delivery Receipts ---
    /// Whether to store delivery receipts in Redis.
    pub delivery_receipt_enabled: bool,
    /// TTL for delivery receipts in seconds.
    pub delivery_receipt_ttl_secs: u64,

    // --- Metrics ---
    /// Prometheus metrics endpoint path.
    pub metrics_path: String,
}

impl Config {
    /// Load configuration from environment variables.
    /// Panics on missing required variables.
    pub fn from_env() -> Self {
        Self {
            host: std::env::var("PUSH_SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".into()),
            port: std::env::var("PUSH_SERVER_PORT")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(3000),
            shutdown_timeout_secs: std::env::var("PUSH_SHUTDOWN_TIMEOUT_SECS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(30),

            apns_team_id: require_env("APNS_TEAM_ID"),
            apns_key_id: require_env("APNS_KEY_ID"),
            apns_cert_path: require_env("APNS_CERT_PATH"),
            apns_topic: require_env("APNS_TOPIC"),
            apns_environment: std::env::var("APNS_ENVIRONMENT").unwrap_or_else(|_| "production".into()),
            apns_base_url: std::env::var("APNS_BASE_URL")
                .unwrap_or_else(|_| "https://api.push.apple.com".into()),

            fcm_project_id: require_env("FCM_PROJECT_ID"),
            fcm_service_account_path: require_env("FCM_SERVICE_ACCOUNT_PATH"),

            redis_url: std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://localhost:6379".into()),

            rate_limit_per_device: std::env::var("PUSH_RATE_LIMIT_PER_DEVICE")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(60),
            rate_limit_per_app: std::env::var("PUSH_RATE_LIMIT_PER_APP")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(1000),
            rate_limit_window_secs: std::env::var("PUSH_RATE_LIMIT_WINDOW_SECS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(60),

            retry_max_attempts: std::env::var("PUSH_RETRY_MAX_ATTEMPTS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(3),
            retry_initial_delay_ms: std::env::var("PUSH_RETRY_INITIAL_DELAY_MS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(500),
            retry_max_delay_ms: std::env::var("PUSH_RETRY_MAX_DELAY_MS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(30_000),
            retry_backoff_multiplier: std::env::var("PUSH_RETRY_BACKOFF_MULTIPLIER")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(2.0),

            delivery_receipt_enabled: std::env::var("PUSH_DELIVERY_RECEIPT_ENABLED")
                .ok()
                .map(|s| s.parse().unwrap_or(true))
                .unwrap_or(true),
            delivery_receipt_ttl_secs: std::env::var("PUSH_DELIVERY_RECEIPT_TTL_SECS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(86400 * 7), // 7 days

            metrics_path: std::env::var("PUSH_METRICS_PATH")
                .unwrap_or_else(|_| "/metrics".into()),
        }
    }
}

fn require_env(key: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| panic!("Missing required env var: {}", key))
}
