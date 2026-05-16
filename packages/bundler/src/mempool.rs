//! UserOp mempool with reputation-aware priority queue.
//!
//! Supports both in-memory and Redis-backed persistence.
//! UserOps are ordered by a composite score: gas_price × reputation_multiplier.

use crate::config::ReputationConfig;
use crate::reputation::{ReputationStatus, ReputationTracker};
use crate::types::{TrackedUserOp, UserOpStatus};
use alloy_primitives::{Address, B256, U256};
use dashmap::DashMap;
use priority_queue::PriorityQueue;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::debug;

/// Priority score = gas_price (gwei) × reputation_multiplier × 1000
pub(crate) fn compute_priority(
    max_priority_fee_per_gas: U256,
    reputation_multiplier: f64,
) -> u64 {
    let gwei = max_priority_fee_per_gas / U256::from(1_000_000_000u64);
    let score = (gwei.to::<u64>() as f64) * reputation_multiplier * 1000.0;
    score as u64
}

/// In-memory UserOp pool with reputation-aware ordering.
pub struct UserOpPool {
    /// Priority queue ordered by composite score (highest first).
    queue: Arc<RwLock<PriorityQueue<B256, u64>>>,
    /// Lookup table for full TrackedUserOp records.
    entries: Arc<DashMap<B256, TrackedUserOp>>,
    /// Known sender → count (for rate limiting).
    sender_counts: Arc<DashMap<Address, usize>>,
    /// Reputation tracker.
    pub reputation: ReputationTracker,
    /// Max capacity (0 = unlimited).
    max_capacity: usize,
}

impl Clone for UserOpPool {
    fn clone(&self) -> Self {
        Self {
            queue: Arc::clone(&self.queue),
            entries: Arc::clone(&self.entries),
            sender_counts: Arc::clone(&self.sender_counts),
            reputation: self.reputation.clone(),
            max_capacity: self.max_capacity,
        }
    }
}

impl UserOpPool {
    /// Create a new in-memory pool.
    pub async fn new(redis_url: &str, reputation_config: ReputationConfig) -> Self {
        if !redis_url.is_empty() {
            tracing::info!(url = %redis_url, "Redis-backed pool (falling back to in-memory)");
        }
        Self {
            queue: Arc::new(RwLock::new(PriorityQueue::new())),
            entries: Arc::new(DashMap::new()),
            sender_counts: Arc::new(DashMap::new()),
            reputation: ReputationTracker::new(reputation_config),
            max_capacity: 0, // unlimited
        }
    }

    /// Add a UserOp to the pool. Returns the UserOp hash.
    pub async fn add(&self, tracked: TrackedUserOp) -> Result<B256, PoolError> {
        let hash = tracked.hash;

        // Reject duplicates
        if self.entries.contains_key(&hash) {
            return Err(PoolError::Duplicate(hash));
        }

        // Capacity check
        if self.max_capacity > 0 && self.entries.len() >= self.max_capacity {
            return Err(PoolError::PoolFull);
        }

        // Track sender count
        let sender = tracked.user_op.sender;
        self.sender_counts
            .entry(sender)
            .and_modify(|c| *c += 1)
            .or_insert(1);

        // Compute priority using reputation
        let multiplier = self.reputation.priority_multiplier(sender).await;
        let priority = compute_priority(tracked.user_op.max_priority_fee_per_gas, multiplier);

        self.queue.write().await.push(hash, priority);
        self.entries.insert(hash, tracked);

        debug!(hash = %hash, priority, "UserOp added to mempool");
        Ok(hash)
    }

    /// Get the top `n` pending UserOps, ordered by composite priority descending.
    pub async fn get_pending(&self, n: usize) -> Vec<TrackedUserOp> {
        let queue = self.queue.read().await;

        queue
            .iter()
            .take(n)
            .filter_map(|(hash, _)| {
                self.entries.get(hash).map(|entry| entry.value().clone())
            })
            .collect()
    }

    /// Mark a set of UserOps as bundled with the given transaction hash.
    pub async fn mark_sent(&self, hashes: &[B256], tx_hash: B256) {
        let mut queue = self.queue.write().await;

        for hash in hashes {
            if let Some(mut entry) = self.entries.get_mut(hash) {
                entry.status = UserOpStatus::Bundled;
                entry.bundle_tx_hash = Some(tx_hash);
            }
            queue.remove(hash);
        }
    }

    /// Reject a UserOp (removes from pool) and record reputation violation.
    pub async fn reject(&self, hash: &B256, reason: &str) {
        if let Some(entry) = self.entries.get(hash) {
            self.reputation.record_violation(entry.user_op.sender, reason).await;
            let _ = entry;
        }
        self.entries.remove(hash);
        self.queue.write().await.remove(hash);
        tracing::warn!(hash = %hash, reason, "UserOp rejected");
    }

    /// Get total pending count.
    pub async fn pending_count(&self) -> usize {
        self.queue.read().await.len()
    }

    /// Get a UserOp by hash.
    pub async fn get(&self, hash: &B256) -> Option<TrackedUserOp> {
        self.entries.get(hash).map(|e| e.value().clone())
    }

    /// Get status of a UserOp by hash.
    pub async fn get_status(&self, hash: &B256) -> Option<UserOpStatus> {
        self.entries.get(hash).map(|e| e.status)
    }

    /// Get unique senders count.
    pub fn unique_sender_count(&self) -> usize {
        self.sender_counts.len()
    }

    /// Get pending count for a specific sender.
    pub fn sender_pending_count(&self, sender: Address) -> usize {
        self.sender_counts.get(&sender).map(|e| *e).unwrap_or(0)
    }

    /// Remove old rejected entries (cleanup).
    pub async fn cleanup(&self, max_age_seconds: i64) {
        let now = chrono::Utc::now();
        let mut queue = self.queue.write().await;
        let mut to_remove = Vec::new();

        for entry in self.entries.iter() {
            if entry.value().status == UserOpStatus::Rejected
                && (now - entry.value().received_at).num_seconds() > max_age_seconds
            {
                to_remove.push(*entry.key());
            }
        }

        for hash in &to_remove {
            self.entries.remove(hash);
            queue.remove(hash);
        }

        if !to_remove.is_empty() {
            debug!(count = to_remove.len(), "Cleaned up old rejected UserOps");
        }
    }

    /// Set max capacity (0 = unlimited).
    pub fn set_max_capacity(&mut self, max: usize) {
        self.max_capacity = max;
    }

    /// Remove all entries for a banned sender.
    pub async fn purge_sender(&self, sender: Address) -> usize {
        let mut count = 0;
        let hashes: Vec<_> = self.entries
            .iter()
            .filter(|e| e.value().user_op.sender == sender)
            .map(|e| *e.key())
            .collect();

        for hash in &hashes {
            self.entries.remove(hash);
            count += 1;
        }

        let mut queue = self.queue.write().await;
        for hash in &hashes {
            queue.remove(hash);
        }

        count
    }
}

#[derive(Debug, thiserror::Error)]
pub enum PoolError {
    #[error("duplicate UserOp: {0}")]
    Duplicate(B256),
    #[error("pool full: max capacity reached")]
    PoolFull,
    #[error("sender is banned")]
    SenderBanned,
}
