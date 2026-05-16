//! Sender reputation scoring system.
//!
//! Tracks per-sender behaviour and assigns a reputation score.
//! Senders that submit invalid UserOps lose reputation.
//! Once a sender drops below a threshold they are throttled,
//! and if they hit the ban threshold they are banned entirely.

use crate::config::ReputationConfig;
use alloy_primitives::Address;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::debug;

/// Per-sender reputation state.
#[derive(Debug, Clone)]
pub struct SenderReputation {
    /// Current reputation score (100 = pristine, 0 = banned).
    pub score: u32,
    /// Number of violations (failed validations).
    pub violations: u32,
    /// Number of successful UserOps submitted.
    pub successes: u32,
    /// Timestamp when the sender was last seen.
    pub last_seen: chrono::DateTime<chrono::Utc>,
    /// When the sender's current throttle/ban expires (if any).
    pub penalty_until: Option<chrono::DateTime<chrono::Utc>>,
}

impl SenderReputation {
    fn new() -> Self {
        Self {
            score: 100,
            violations: 0,
            successes: 0,
            last_seen: chrono::Utc::now(),
            penalty_until: None,
        }
    }
}

/// Reputation status for a sender.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReputationStatus {
    /// Sender is in good standing.
    Good,
    /// Sender is throttled (reduced priority).
    Throttled,
    /// Sender is banned entirely.
    Banned,
}

/// Reputation tracker.
#[derive(Clone)]
pub struct ReputationTracker {
    senders: Arc<RwLock<HashMap<Address, SenderReputation>>>,
    config: ReputationConfig,
}

impl ReputationTracker {
    /// Create a new tracker.
    pub fn new(config: ReputationConfig) -> Self {
        Self {
            senders: Arc::new(RwLock::new(HashMap::new())),
            config,
        }
    }

    /// Record a successful UserOp submission for a sender.
    pub async fn record_success(&self, sender: Address) {
        let mut map = self.senders.write().await;
        let entry = map.entry(sender).or_insert_with(SenderReputation::new);
        entry.successes += 1;
        entry.last_seen = chrono::Utc::now();
        // Slowly recover score on success
        if entry.score < 100 {
            entry.score = (entry.score + 1).min(100);
        }
    }

    /// Record a violation (failed validation) for a sender.
    pub async fn record_violation(&self, sender: Address, reason: &str) {
        let mut map = self.senders.write().await;
        let entry = map.entry(sender).or_insert_with(SenderReputation::new);
        entry.violations += 1;
        entry.last_seen = chrono::Utc::now();
        entry.score = entry.score.saturating_sub(10);

        // Apply throttle if threshold reached
        if entry.violations >= self.config.throttle_threshold
            && entry.penalty_until.is_none()
        {
            let until = chrono::Utc::now()
                + chrono::Duration::seconds(self.config.throttle_duration_sec as i64);
            entry.penalty_until = Some(until);
            debug!(sender = %sender, until = %until, "Sender throttled");
        }

        // Apply ban if ban threshold reached
        if entry.violations >= self.config.ban_threshold {
            if self.config.ban_duration_sec == 0 {
                entry.penalty_until = None; // Permanent ban
            } else {
                let until = chrono::Utc::now()
                    + chrono::Duration::seconds(self.config.ban_duration_sec as i64);
                entry.penalty_until = Some(until);
            }
            debug!(sender = %sender, "Sender banned");
        }
    }

    /// Get the current reputation status of a sender.
    pub async fn status(&self, sender: Address) -> ReputationStatus {
        let map = self.senders.read().await;
        let Some(entry) = map.get(&sender) else {
            return ReputationStatus::Good;
        };

        // Check if penalty has expired
        if let Some(until) = entry.penalty_until {
            if chrono::Utc::now() < until {
                // Permanent ban if penalty_until is None and violations >= ban_threshold
                if entry.violations >= self.config.ban_threshold {
                    return ReputationStatus::Banned;
                }
                return ReputationStatus::Throttled;
            } else {
                // Penalty expired — clear it
                drop(map);
                let mut map = self.senders.write().await;
                if let Some(e) = map.get_mut(&sender) {
                    e.penalty_until = None;
                }
                return ReputationStatus::Good;
            }
        }

        ReputationStatus::Good
    }

    /// Get the reputation score (0-100) for a sender.
    pub async fn score(&self, sender: Address) -> u32 {
        let map = self.senders.read().await;
        map.get(&sender).map(|e| e.score).unwrap_or(100)
    }

    /// Check if a sender is allowed to submit more ops (respects per-sender limit).
    pub async fn can_submit(&self, sender: Address, current_pending: u32) -> bool {
        let status = self.status(sender).await;
        if status == ReputationStatus::Banned {
            return false;
        }
        current_pending < self.config.max_pending_per_sender
    }

    /// Get the priority multiplier for a sender (0.0 = blocked, 1.0 = normal, >1.0 = high rep).
    pub async fn priority_multiplier(&self, sender: Address) -> f64 {
        let status = self.status(sender).await;
        match status {
            ReputationStatus::Banned => 0.0,
            ReputationStatus::Throttled => 0.5,
            ReputationStatus::Good => {
                let score = self.score(sender).await;
                // Scale from 0.8 (new) to 1.2 (perfect)
                0.8 + (score as f64 / 100.0) * 0.4
            }
        }
    }

    /// Get stats for all tracked senders.
    pub async fn stats(&self) -> Vec<(Address, SenderReputation)> {
        let map = self.senders.read().await;
        map.iter().map(|(k, v)| (*k, v.clone())).collect()
    }

    /// Manually ban a sender.
    pub async fn ban(&self, sender: Address) {
        let mut map = self.senders.write().await;
        let entry = map.entry(sender).or_insert_with(SenderReputation::new);
        entry.penalty_until = None; // Permanent
        entry.score = 0;
        entry.violations = self.config.ban_threshold;
    }

    /// Manually unban a sender.
    pub async fn unban(&self, sender: Address) {
        let mut map = self.senders.write().await;
        if let Some(entry) = map.get_mut(&sender) {
            entry.penalty_until = None;
            entry.score = 50; // Reset to neutral
            entry.violations = 0;
        }
    }
}
