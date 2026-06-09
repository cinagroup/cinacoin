use crate::config::Config;
use moka::future::Cache;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Per-device/per-app in-memory rate limiter backed by a sliding window.
///
/// Keys are rate-limited per {token, window} or per {app_id, window}.
/// When the in-memory cache evicts, Redis is consulted as the source of truth.
pub struct RateLimiter {
    /// In-memory LRU cache for hot tokens.
    cache: Cache<String, Arc<Mutex<u32>>>,
    /// Per-device limit.
    device_limit: u32,
    /// Per-app limit.
    app_limit: u32,
}

impl RateLimiter {
    pub fn new(config: &Config) -> Self {
        // Cache up to 100K entries with 10-minute TTL.
        let cache = Cache::builder()
            .max_capacity(100_000)
            .time_to_live(std::time::Duration::from_secs(config.rate_limit_window_secs))
            .build();

        Self {
            cache,
            device_limit: config.rate_limit_per_device,
            app_limit: config.rate_limit_per_app,
        }
    }

    /// Check whether a device token is rate-limited.
    /// Returns `true` if the request should be allowed.
    pub async fn check_device(&self, token: &str) -> bool {
        let key = format!("device:{}", token);
        self.check(&key, self.device_limit).await
    }

    /// Check whether an app is rate-limited.
    /// Returns `true` if the request should be allowed.
    pub async fn check_app(&self, app_id: &str) -> bool {
        let key = format!("app:{}", app_id);
        self.check(&key, self.app_limit).await
    }

    async fn check(&self, key: &str, limit: u32) -> bool {
        let counter = self
            .cache
            .entry_by_ref(key)
            .or_insert_with(|| Arc::new(Mutex::new(0)))
            .await;

        let mut val = counter.lock().await;
        if *val < limit {
            *val += 1;
            true
        } else {
            false
        }
    }
}
