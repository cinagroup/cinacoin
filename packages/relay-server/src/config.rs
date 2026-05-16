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
