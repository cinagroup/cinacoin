use crate::config::Config;
use std::time::Duration;
use tracing;

/// Retry configuration with exponential backoff.
#[derive(Debug, Clone)]
pub struct RetryPolicy {
    /// Maximum number of retry attempts.
    pub max_attempts: u32,
    /// Initial delay before first retry (ms).
    pub initial_delay_ms: u64,
    /// Maximum delay cap (ms).
    pub max_delay_ms: u64,
    /// Backoff multiplier (e.g. 2.0 for doubling).
    pub backoff_multiplier: f64,
}

impl RetryPolicy {
    pub fn from_config(config: &Config) -> Self {
        Self {
            max_attempts: config.retry_max_attempts,
            initial_delay_ms: config.retry_initial_delay_ms,
            max_delay_ms: config.retry_max_delay_ms,
            backoff_multiplier: config.retry_backoff_multiplier,
        }
    }

    /// Calculate delay for a given attempt number (0-indexed).
    pub fn delay_for_attempt(&self, attempt: u32) -> Duration {
        let delay_ms = self.initial_delay_ms as f64
            * self.backoff_multiplier.powi(attempt as i32);
        let delay_ms = delay_ms.min(self.max_delay_ms as f64) as u64;
        Duration::from_millis(delay_ms)
    }

    /// Execute a fallible async operation with retries.
    /// The operation is called as `op(attempt)` where `attempt` starts at 0.
    /// Returns the first successful `Ok` result, or the last `Err`.
    pub async fn run<F, Fut, T, E>(&self, mut op: F) -> Result<T, E>
    where
        F: FnMut(u32) -> Fut,
        Fut: std::future::Future<Output = Result<T, E>>,
        E: std::fmt::Display,
    {
        let mut last_err = None;

        for attempt in 0..=self.max_attempts {
            match op(attempt).await {
                Ok(val) => return Ok(val),
                Err(e) => {
                    if attempt < self.max_attempts {
                        let delay = self.delay_for_attempt(attempt);
                        tracing::warn!(
                            attempt,
                            max_attempts = self.max_attempts,
                            delay_ms = delay.as_millis(),
                            error = %e,
                            "Transient failure, retrying"
                        );
                        tokio::time::sleep(delay).await;
                    }
                    last_err = Some(e);
                }
            }
        }

        // Unwrap is safe: loop always runs at least once.
        Err(last_err.unwrap())
    }
}
