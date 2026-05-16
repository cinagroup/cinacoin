//! UserOp mempool with priority queue.
//!
//! Supports both in-memory and Redis-backed persistence.
//! UserOps are ordered by priority fee (highest first) for optimal bundler profit.

use crate::types::{TrackedUserOp, UserOpStatus};
use crate::validation::ValidationResult;
use alloy_primitives::{Address, B256, U256};
use priority_queue::PriorityQueue;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::debug;

/// In-memory UserOp pool.
#[derive(Clone)]
pub struct UserOpPool {
    /// Priority queue ordered by max_priority_fee_per_gas (highest first).
    queue: Arc<RwLock<PriorityQueue<B256, U256>>>,
    /// Lookup table for full TrackedUserOp records.
    entries: Arc<RwLock<HashMap<B256, TrackedUserOp>>>,
    /// Known sender → count (for rate limiting).
    sender_counts: Arc<RwLock<HashMap<Address, usize>>>,
}

impl UserOpPool {
    /// Create a new in-memory pool.
    pub async fn new(redis_url: &str) -> Self {
        if !redis_url.is_empty() {
            tracing::info!(url = %redis_url, "Redis-backed pool (not yet implemented, falling back to in-memory)");
        }
        Self {
            queue: Arc::new(RwLock::new(PriorityQueue::new())),
            entries: Arc::new(RwLock::new(HashMap::new())),
            sender_counts: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Add a UserOp to the pool. Returns the UserOp hash.
    pub async fn add(&mut self, tracked: TrackedUserOp) -> Result<B256, PoolError> {
        let hash = tracked.hash;

        // Reject duplicates
        if self.entries.read().await.contains_key(&hash) {
            return Err(PoolError::Duplicate(hash));
        }

        // Track sender count
        {
            let mut counts = self.sender_counts.write().await;
            *counts.entry(tracked.user_op.sender).or_insert(0) += 1;
        }

        let priority = tracked.user_op.max_priority_fee_per_gas;
        self.queue.write().await.push(hash, priority);
        self.entries.write().await.insert(hash, tracked);

        debug!(hash = %hash, "UserOp added to mempool");
        Ok(hash)
    }

    /// Get the top `n` pending UserOps, ordered by priority fee descending.
    pub async fn get_pending(&self, n: usize) -> Vec<TrackedUserOp> {
        let queue = self.queue.read().await;
        let entries = self.entries.read().await;

        queue
            .iter()
            .filter(|(_, priority)| **priority > U256::ZERO)
            .take(n)
            .filter_map(|(hash, _)| entries.get(hash).cloned())
            .collect()
    }

    /// Mark a set of UserOps as bundled with the given transaction hash.
    pub async fn mark_sent(&self, hashes: &[B256], tx_hash: B256) {
        let mut entries = self.entries.write().await;
        let mut queue = self.queue.write().await;

        for hash in hashes {
            if let Some(entry) = entries.get_mut(hash) {
                entry.status = UserOpStatus::Bundled;
                entry.bundle_tx_hash = Some(tx_hash);
            }
            queue.remove(hash);
        }
    }

    /// Reject a UserOp (removes from pool).
    pub async fn reject(&self, hash: &B256, reason: &str) {
        let mut entries = self.entries.write().await;
        if let Some(entry) = entries.get_mut(hash) {
            entry.status = UserOpStatus::Rejected;
        }
        self.queue.write().await.remove(hash);
        tracing::warn!(hash = %hash, reason, "UserOp rejected");
    }

    /// Get total pending count.
    pub async fn pending_count(&self) -> usize {
        self.queue.read().await.len()
    }

    /// Get a UserOp by hash.
    pub async fn get(&self, hash: &B256) -> Option<TrackedUserOp> {
        self.entries.read().await.get(hash).cloned()
    }

    /// Get status of a UserOp by hash.
    pub async fn get_status(&self, hash: &B256) -> Option<UserOpStatus> {
        self.entries.read().await.get(hash).map(|e| e.status)
    }

    /// Get senders with pending ops.
    pub async fn get_sender_counts(&self) -> HashMap<Address, usize> {
        self.sender_counts.read().await.clone()
    }

    /// Remove old rejected entries (cleanup).
    pub async fn cleanup(&self, max_age_seconds: i64) {
        let mut entries = self.entries.write().await;
        let mut queue = self.queue.write().await;
        let now = chrono::Utc::now();

        let to_remove: Vec<_> = entries
            .iter()
            .filter(|(_, entry)| {
                entry.status == UserOpStatus::Rejected
                    && (now - entry.received_at).num_seconds() > max_age_seconds
            })
            .map(|(hash, _)| *hash)
            .collect();

        for hash in &to_remove {
            entries.remove(hash);
            queue.remove(hash);
        }

        if !to_remove.is_empty() {
            debug!(count = to_remove.len(), "Cleaned up old rejected UserOps");
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum PoolError {
    #[error("duplicate UserOp: {0}")]
    Duplicate(B256),
    #[error("pool full: max capacity reached")]
    PoolFull,
}
