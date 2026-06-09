//! Configuration module for the relay server.
//!
//! Loads settings from environment variables with sensible defaults.

use serde::Deserialize;

/// Top-level application configuration.
#[derive(Debug, Deserialize, Clone)]
pub struct Config {
    /// HTTP/WebSocket listen address.
    pub listen_addr: String,
    /// Redis URL for session storage and topic subscription tracking.
    pub redis_url: String,
    /// NATS URL for Pub/Sub bus (optional — falls back to Redis-only).
    pub nats_url: Option<String>,
    /// Deployment region identifier (e.g., "us-east-1").
    pub region: String,
    /// Relay server public URL (exposed to clients in pairing URIs).
    pub public_url: String,
    /// Project identifier for namespace isolation.
    pub project_id: String,
    /// TLS certificate path (optional — when None, plaintext WS only).
    pub tls_cert_path: Option<String>,
    /// TLS private key path.
    pub tls_key_path: Option<String>,

    // --- Rate Limiting ---
    /// Max new connections per IP per minute.
    pub connection_rate_limit: u32,
    /// Rate limit window in seconds.
    pub connection_rate_window_secs: u64,

    // --- Message Size Limits ---
    /// Maximum incoming message size in bytes.
    pub max_message_size_bytes: usize,
    /// Maximum outgoing message size in bytes.
    pub max_outgoing_size_bytes: usize,

    // --- Topic Expiration ---
    /// Default topic TTL in seconds (0 = no expiration).
    pub topic_ttl_secs: u64,
    /// Topic cleanup interval in seconds.
    pub topic_cleanup_interval_secs: u64,

    // --- Persistent Storage ---
    /// Whether to persist sessions to PostgreSQL.
    pub session_persistence_enabled: bool,
    /// PostgreSQL connection string for session persistence.
    pub database_url: Option<String>,

    // --- Graceful Shutdown ---
    /// Timeout in seconds for graceful shutdown.
    pub shutdown_timeout_secs: u64,

    // --- Metrics ---
    /// Prometheus metrics scrape port (0 = same as listen_addr).
    pub metrics_port: u16,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            listen_addr: std::env::var("RELAY_LISTEN_ADDR")
                .unwrap_or_else(|_| "0.0.0.0:8080".to_string()),
            redis_url: std::env::var("RELAY_REDIS_URL")
                .unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string()),
            nats_url: std::env::var("RELAY_NATS_URL").ok(),
            region: std::env::var("RELAY_REGION").unwrap_or_else(|_| "local".to_string()),
            public_url: std::env::var("RELAY_PUBLIC_URL")
                .unwrap_or_else(|_| "ws://localhost:8080".to_string()),
            project_id: std::env::var("RELAY_PROJECT_ID").unwrap_or_else(|_| "default".to_string()),
            tls_cert_path: std::env::var("RELAY_TLS_CERT").ok(),
            tls_key_path: std::env::var("RELAY_TLS_KEY").ok(),

            connection_rate_limit: std::env::var("RELAY_CONNECTION_RATE_LIMIT")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(100),
            connection_rate_window_secs: std::env::var("RELAY_CONNECTION_RATE_WINDOW_SECS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(60),

            max_message_size_bytes: std::env::var("RELAY_MAX_MESSAGE_SIZE")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(256 * 1024), // 256 KB
            max_outgoing_size_bytes: std::env::var("RELAY_MAX_OUTGOING_SIZE")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(512 * 1024), // 512 KB

            topic_ttl_secs: std::env::var("RELAY_TOPIC_TTL_SECS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(86400), // 24 hours
            topic_cleanup_interval_secs: std::env::var("RELAY_TOPIC_CLEANUP_INTERVAL")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(300), // 5 minutes

            session_persistence_enabled: std::env::var("RELAY_SESSION_PERSISTENCE")
                .ok()
                .map(|s| s.parse().unwrap_or(false))
                .unwrap_or(false),
            database_url: std::env::var("RELAY_DATABASE_URL").ok(),

            shutdown_timeout_secs: std::env::var("RELAY_SHUTDOWN_TIMEOUT_SECS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(30),

            metrics_port: std::env::var("RELAY_METRICS_PORT")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(0),
        }
    }
}

impl Config {
    /// Load configuration from environment variables.
    pub fn from_env() -> Self {
        Self::default()
    }

    /// Check if TLS is enabled.
    pub fn tls_enabled(&self) -> bool {
        self.tls_cert_path.is_some() && self.tls_key_path.is_some()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_config_has_sensible_values() {
        let cfg = Config::default();
        assert_eq!(cfg.listen_addr, "0.0.0.0:8080");
        assert_eq!(cfg.redis_url, "redis://127.0.0.1:6379");
        assert!(!cfg.tls_enabled());
    }
}
