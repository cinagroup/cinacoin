//! Unit tests for the bundler: mempool prioritization, UserOp validation,
//! gas oracle, reputation scoring, and bundle creation.

use crate::config::{ReputationConfig, SimulationConfig};
use crate::mempool::{UserOpPool, PoolError, compute_priority};
use crate::reputation::{ReputationTracker, ReputationStatus};
use crate::types::{UserOperation, UserOpStatus, TrackedUserOp, GasEstimation};
use crate::validation::{UserOpValidator, ValidationResult};
use crate::bundler::{Bundler, BundlerError, compute_user_op_hash};
use crate::config::BundlerConfig;
use crate::metrics::Metrics;
use alloy_primitives::{Address, B256, U256, Bytes};

// ---------------------------------------------------------------------------
// Helper: build a minimal UserOperation
// ---------------------------------------------------------------------------

fn make_user_op(sender: Address, max_fee: U256, max_priority_fee: U256, signature: Bytes) -> UserOperation {
    UserOperation {
        sender,
        nonce: U256::ZERO,
        init_code: Bytes::new(),
        call_data: Bytes::new(),
        call_gas_limit: U256::from(500_000u64),
        verification_gas_limit: U256::from(100_000u64),
        pre_verification_gas: U256::from(50_000u64),
        max_fee_per_gas: max_fee,
        max_priority_fee_per_gas: max_priority_fee,
        paymaster: Address::ZERO,
        paymaster_verification_gas_limit: U256::ZERO,
        paymaster_post_op_gas_limit: U256::ZERO,
        paymaster_data: Bytes::new(),
        signature,
    }
}

fn make_tracked(op: UserOperation) -> TrackedUserOp {
    TrackedUserOp {
        hash: B256::ZERO,
        user_op: op,
        status: UserOpStatus::Pending,
        received_at: chrono::Utc::now(),
        bundle_tx_hash: None,
    }
}

// ---------------------------------------------------------------------------
// Mempool: Gas Price Priority Sorting
// ---------------------------------------------------------------------------

#[test]
fn compute_priority_higher_gas_higher_priority() {
    let p_low = compute_priority(U256::from(1_000_000_000u64), 1.0);  // 1 gwei
    let p_high = compute_priority(U256::from(2_000_000_000u64), 1.0); // 2 gwei
    assert!(p_high > p_low);
}

#[test]
fn compute_priority_with_reputation_multiplier() {
    let p_base = compute_priority(U256::from(1_000_000_000u64), 1.0);
    let p_boosted = compute_priority(U256::from(1_000_000_000u64), 1.2);
    assert!(p_boosted > p_base);
}

#[test]
fn compute_priority_zero_gas() {
    let p = compute_priority(U256::ZERO, 1.0);
    assert_eq!(p, 0);
}

#[test]
fn mempool_add_and_get_pending() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let rep_config = ReputationConfig::default();
        let pool = UserOpPool::new("", rep_config).await;

        let sender = Address::random();
        let op = make_user_op(sender, U256::from(2_000_000_000u64), U256::from(1_000_000_000u64), Bytes::from(vec![1u8; 65]));
        let tracked = make_tracked(op);

        let hash = pool.add(tracked).await.unwrap();
        assert_eq!(pool.pending_count().await, 1);

        let retrieved = pool.get_pending(10).await;
        assert_eq!(retrieved.len(), 1);
    });
}

#[test]
fn mempool_rejects_duplicates() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let rep_config = ReputationConfig::default();
        let pool = UserOpPool::new("", rep_config).await;

        let sender = Address::random();
        let op = make_user_op(sender, U256::from(1_000_000_000u64), U256::from(500_000_000u64), Bytes::from(vec![1u8; 65]));
        let tracked = make_tracked(op);

        let hash1 = pool.add(tracked.clone()).await.unwrap();
        let result = pool.add(tracked).await;
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), PoolError::Duplicate(_)));
    });
}

#[test]
fn mempool_orders_by_priority_descending() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let rep_config = ReputationConfig::default();
        let pool = UserOpPool::new("", rep_config).await;

        // Add low-priority op first
        let sender1 = Address::random();
        let op_low = make_user_op(sender1, U256::from(1_000_000_000u64), U256::from(500_000_000u64), Bytes::from(vec![1u8; 65]));
        let tracked_low = make_tracked(op_low);
        pool.add(tracked_low).await.unwrap();

        // Add high-priority op second
        let sender2 = Address::random();
        let op_high = make_user_op(sender2, U256::from(10_000_000_000u64), U256::from(5_000_000_000u64), Bytes::from(vec![2u8; 65]));
        let tracked_high = make_tracked(op_high);
        pool.add(tracked_high).await.unwrap();

        // High-priority should come first
        let pending = pool.get_pending(10).await;
        assert!(!pending.is_empty());
        assert_eq!(pending[0].user_op.max_fee_per_gas, U256::from(10_000_000_000u64));
    });
}

#[test]
fn mempool_mark_sent_removes_from_queue() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let rep_config = ReputationConfig::default();
        let pool = UserOpPool::new("", rep_config).await;

        let sender = Address::random();
        let op = make_user_op(sender, U256::from(1_000_000_000u64), U256::from(500_000_000u64), Bytes::from(vec![1u8; 65]));
        let tracked = make_tracked(op);
        let hash = pool.add(tracked).await.unwrap();

        pool.mark_sent(&[hash], B256::from([0xAAu8; 32])).await;
        assert_eq!(pool.pending_count().await, 0);

        let status = pool.get_status(&hash).await;
        assert_eq!(status, Some(UserOpStatus::Bundled));
    });
}

#[test]
fn mempool_purge_sender() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let rep_config = ReputationConfig::default();
        let pool = UserOpPool::new("", rep_config).await;

        let sender = Address::random();
        let other = Address::random();

        for _ in 0..3 {
            let op = make_user_op(sender, U256::from(1_000_000_000u64), U256::from(500_000_000u64), Bytes::from(vec![1u8; 65]));
            pool.add(make_tracked(op)).await.unwrap();
        }
        let op = make_user_op(other, U256::from(1_000_000_000u64), U256::from(500_000_000u64), Bytes::from(vec![1u8; 65]));
        pool.add(make_tracked(op)).await.unwrap();

        let removed = pool.purge_sender(sender).await;
        assert_eq!(removed, 3);
        assert_eq!(pool.pending_count().await, 1);
    });
}

#[test]
fn mempool_unique_sender_count() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let rep_config = ReputationConfig::default();
        let pool = UserOpPool::new("", rep_config).await;

        let sender1 = Address::random();
        let sender2 = Address::random();

        let op1 = make_user_op(sender1, U256::from(1_000_000_000u64), U256::from(500_000_000u64), Bytes::from(vec![1u8; 65]));
        pool.add(make_tracked(op1)).await.unwrap();

        let op2 = make_user_op(sender1, U256::from(1_000_000_000u64), U256::from(500_000_000u64), Bytes::from(vec![1u8; 65]));
        let result = pool.add(make_tracked(op2)).await;
        // Duplicate with different hash (make_tracked uses B256::ZERO) — will be rejected
        assert!(result.is_err());

        let op3 = make_user_op(sender2, U256::from(1_000_000_000u64), U256::from(500_000_000u64), Bytes::from(vec![1u8; 65]));
        pool.add(make_tracked(op3)).await.unwrap();

        assert_eq!(pool.unique_sender_count(), 2);
    });
}

// ---------------------------------------------------------------------------
// UserOp Validation
// ---------------------------------------------------------------------------

fn make_config_with_defaults() -> BundlerConfig {
    BundlerConfig {
        rpc_url: "http://localhost:8545".to_string(),
        chain_id: 1,
        entry_point_address: Address::ZERO,
        signer_private_key: String::new(),
        beneficiary: None,
        listen_addr: "0.0.0.0:3000".to_string(),
        max_ops_per_bundle: 128,
        bundle_interval_ms: 2000,
        bundle_timeout_ms: 5000,
        min_gas_limit: 21000,
        redis_url: String::new(),
        min_profit_margin_bps: 500,
        reputation: ReputationConfig::default(),
        blacklisted_senders: Default::default(),
        simulation: SimulationConfig {
            enabled: false, // disable for unit tests
            max_simulation_gas: 30_000_000,
        },
        metrics: crate::config::MetricsConfig::default(),
        health: crate::config::HealthConfig::default(),
    }
}

#[test]
fn validation_accepts_valid_user_op() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = make_config_with_defaults();
        let validator = UserOpValidator::new(&config);

        let sender = Address::random();
        let op = make_user_op(
            sender,
            U256::from(2_000_000_000u64),
            U256::from(1_000_000_000u64),
            Bytes::from(vec![1u8; 65]),
        );

        let result = validator.validate(&op).await;
        assert!(result.valid, "validation failed: {:?}", result.reason);
    });
}

#[test]
fn validation_rejects_empty_signature() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = make_config_with_defaults();
        let validator = UserOpValidator::new(&config);

        let sender = Address::random();
        let op = make_user_op(
            sender,
            U256::from(2_000_000_000u64),
            U256::from(1_000_000_000u64),
            Bytes::new(), // empty signature
        );

        let result = validator.validate(&op).await;
        assert!(!result.valid);
        assert!(result.reason.as_ref().unwrap().contains("empty signature"));
    });
}

#[test]
fn validation_rejects_blacklisted_sender() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let mut config = make_config_with_defaults();
        let blacklisted = Address::random();
        config.blacklisted_senders.insert(blacklisted);
        let validator = UserOpValidator::new(&config);

        let op = make_user_op(
            blacklisted,
            U256::from(2_000_000_000u64),
            U256::from(1_000_000_000u64),
            Bytes::from(vec![1u8; 65]),
        );

        let result = validator.validate(&op).await;
        assert!(!result.valid);
        assert!(result.reason.as_ref().unwrap().contains("blacklisted"));
    });
}

#[test]
fn validation_rejects_zero_max_fee() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = make_config_with_defaults();
        let validator = UserOpValidator::new(&config);

        let sender = Address::random();
        let op = make_user_op(
            sender,
            U256::ZERO,
            U256::ZERO,
            Bytes::from(vec![1u8; 65]),
        );

        let result = validator.validate(&op).await;
        assert!(!result.valid);
        assert!(result.reason.as_ref().unwrap().contains("zero"));
    });
}

#[test]
fn validation_rejects_priority_fee_exceeds_max_fee() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = make_config_with_defaults();
        let validator = UserOpValidator::new(&config);

        let sender = Address::random();
        let op = make_user_op(
            sender,
            U256::from(1_000_000_000u64),    // max_fee = 1 gwei
            U256::from(2_000_000_000u64),    // priority_fee = 2 gwei (exceeds max)
            Bytes::from(vec![1u8; 65]),
        );

        let result = validator.validate(&op).await;
        assert!(!result.valid);
        assert!(result.reason.as_ref().unwrap().contains("priority fee exceeds max fee"));
    });
}

#[test]
fn validation_rejects_excessive_verification_gas() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = make_config_with_defaults();
        let validator = UserOpValidator::new(&config);

        let sender = Address::random();
        let mut op = make_user_op(
            sender,
            U256::from(2_000_000_000u64),
            U256::from(1_000_000_000u64),
            Bytes::from(vec![1u8; 65]),
        );
        op.verification_gas_limit = U256::from(10_000_000u64); // exceeds 5M limit

        let result = validator.validate(&op).await;
        assert!(!result.valid);
        assert!(result.reason.as_ref().unwrap().contains("verification gas limit too high"));
    });
}

#[test]
fn validation_rejects_excessive_call_gas() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = make_config_with_defaults();
        let validator = UserOpValidator::new(&config);

        let sender = Address::random();
        let mut op = make_user_op(
            sender,
            U256::from(2_000_000_000u64),
            U256::from(1_000_000_000u64),
            Bytes::from(vec![1u8; 65]),
        );
        op.call_gas_limit = U256::from(30_000_000u64); // exceeds 20M limit

        let result = validator.validate(&op).await;
        assert!(!result.valid);
        assert!(result.reason.as_ref().unwrap().contains("call gas limit too high"));
    });
}

#[test]
fn validation_rejects_below_minimum_gas() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = make_config_with_defaults();
        let validator = UserOpValidator::new(&config);

        let sender = Address::random();
        let mut op = make_user_op(
            sender,
            U256::from(2_000_000_000u64),
            U256::from(1_000_000_000u64),
            Bytes::from(vec![1u8; 65]),
        );
        op.call_gas_limit = U256::from(100u64);         // tiny
        op.verification_gas_limit = U256::from(100u64);  // tiny
        op.pre_verification_gas = U256::from(100u64);    // tiny

        let result = validator.validate(&op).await;
        assert!(!result.valid);
        assert!(result.reason.as_ref().unwrap().contains("total gas below minimum"));
    });
}

#[test]
fn validation_blacklist_runtime_modification() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = make_config_with_defaults();
        let mut validator = UserOpValidator::new(&config);

        let sender = Address::random();
        let op = make_user_op(
            sender,
            U256::from(2_000_000_000u64),
            U256::from(1_000_000_000u64),
            Bytes::from(vec![1u8; 65]),
        );

        // Should pass initially
        let result = validator.validate(&op).await;
        assert!(result.valid);

        // Blacklist at runtime
        validator.blacklist(sender);

        let result = validator.validate(&op).await;
        assert!(!result.valid);

        // Unblock
        validator.unblacklist(sender);

        let result = validator.validate(&op).await;
        assert!(result.valid);
    });
}

// ---------------------------------------------------------------------------
// Gas Oracle: Price Estimation
// ---------------------------------------------------------------------------

#[test]
fn gas_oracle_default_fallback() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        // Create gas oracle with invalid RPC URL — should fallback to defaults
        let oracle = crate::gas_oracle::GasOracle::new("http://invalid-host-99999.example").await;
        // Constructor should succeed even with invalid URL (pre-fetch is best-effort)
        assert!(oracle.is_ok());
        let oracle = oracle.unwrap();

        // Should return default fallback values
        let max_fee = oracle.get_max_fee().await;
        let priority_fee = oracle.get_priority_fee().await;

        // Default base fee is 30 gwei
        assert_eq!(max_fee, U256::from(30u64) * U256::from(1_000_000_000u64));
        // Default priority fee is 1.5 gwei
        assert_eq!(priority_fee, U256::from(1_500_000_000u64));
    });
}

// ---------------------------------------------------------------------------
// Reputation: Scoring
// ---------------------------------------------------------------------------

#[test]
fn reputation_starts_good() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = ReputationConfig::default();
        let tracker = ReputationTracker::new(config);

        let sender = Address::random();
        let status = tracker.status(sender).await;
        assert_eq!(status, ReputationStatus::Good);
        assert_eq!(tracker.score(sender).await, 100);
    });
}

#[test]
fn reputation_violation_decreases_score() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = ReputationConfig::default();
        let tracker = ReputationTracker::new(config);

        let sender = Address::random();
        tracker.record_violation(sender, "bad sig").await;
        assert_eq!(tracker.score(sender).await, 90); // 100 - 10
    });
}

#[test]
fn reputation_success_increases_score() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = ReputationConfig::default();
        let tracker = ReputationTracker::new(config);

        let sender = Address::random();
        tracker.record_violation(sender, "bad sig").await;
        assert_eq!(tracker.score(sender).await, 90);

        tracker.record_success(sender).await;
        assert_eq!(tracker.score(sender).await, 91);
    });
}

#[test]
fn reputation_throttle_after_threshold() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let mut config = ReputationConfig::default();
        config.throttle_threshold = 3;
        config.throttle_duration_sec = 60;
        config.ban_threshold = 10;
        let tracker = ReputationTracker::new(config);

        let sender = Address::random();
        for _ in 0..3 {
            tracker.record_violation(sender, "violation").await;
        }

        assert_eq!(tracker.status(sender).await, ReputationStatus::Throttled);
    });
}

#[test]
fn reputation_ban_after_ban_threshold() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let mut config = ReputationConfig::default();
        config.throttle_threshold = 5;
        config.ban_threshold = 10;
        config.ban_duration_sec = 3600;
        let tracker = ReputationTracker::new(config);

        let sender = Address::random();
        for _ in 0..10 {
            tracker.record_violation(sender, "violation").await;
        }

        assert_eq!(tracker.status(sender).await, ReputationStatus::Banned);
    });
}

#[test]
fn reputation_priority_multiplier() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = ReputationConfig::default();
        let tracker = ReputationTracker::new(config);

        let good_sender = Address::random();
        let bad_sender = Address::random();

        // Good sender gets ~0.8-1.2 range
        let mult = tracker.priority_multiplier(good_sender).await;
        assert!(mult >= 0.8 && mult <= 1.2);

        // Make bad sender banned
        for _ in 0..config.ban_threshold {
            tracker.record_violation(bad_sender, "x").await;
        }
        assert_eq!(tracker.priority_multiplier(bad_sender).await, 0.0);
    });
}

#[test]
fn reputation_can_submit_banned_sender() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let mut config = ReputationConfig::default();
        config.ban_threshold = 5;
        config.ban_duration_sec = 3600;
        let tracker = ReputationTracker::new(config);

        let sender = Address::random();
        for _ in 0..5 {
            tracker.record_violation(sender, "x").await;
        }

        assert!(!tracker.can_submit(sender, 0).await);
    });
}

#[test]
fn reputation_manual_ban_and_unban() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = ReputationConfig::default();
        let tracker = ReputationTracker::new(config);

        let sender = Address::random();
        tracker.ban(sender).await;
        assert_eq!(tracker.status(sender).await, ReputationStatus::Banned);
        assert_eq!(tracker.score(sender).await, 0);

        tracker.unban(sender).await;
        assert_eq!(tracker.score(sender).await, 50);
    });
}

// ---------------------------------------------------------------------------
// Bundle Creation
// ---------------------------------------------------------------------------

#[test]
fn bundler_maybe_bundle_empty_mempool() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = make_config_with_defaults();
        let rep_config = ReputationConfig::default();
        let pool = UserOpPool::new("", rep_config).await;
        let gas_oracle = crate::gas_oracle::GasOracle::new("http://invalid-host-99999.example").await.unwrap();
        let metrics = Metrics::new();

        let bundler = Bundler::new(config, pool, gas_oracle, std::sync::Arc::new(metrics)).await.unwrap();

        // Empty mempool should return Ok
        let result = bundler.maybe_bundle().await;
        assert!(result.is_ok());
    });
}

#[test]
fn compute_user_op_hash_is_deterministic() {
    let sender = Address::random();
    let op = make_user_op(
        sender,
        U256::from(2_000_000_000u64),
        U256::from(1_000_000_000u64),
        Bytes::from(vec![1u8; 65]),
    );

    let h1 = compute_user_op_hash(&op, Address::ZERO, 1);
    let h2 = compute_user_op_hash(&op, Address::ZERO, 1);
    assert_eq!(h1, h2);
}

#[test]
fn compute_user_op_hash_different_senders() {
    let op1 = make_user_op(
        Address::random(),
        U256::from(2_000_000_000u64),
        U256::from(1_000_000_000u64),
        Bytes::from(vec![1u8; 65]),
    );
    let op2 = make_user_op(
        Address::random(),
        U256::from(2_000_000_000u64),
        U256::from(1_000_000_000u64),
        Bytes::from(vec![1u8; 65]),
    );

    let h1 = compute_user_op_hash(&op1, Address::ZERO, 1);
    let h2 = compute_user_op_hash(&op2, Address::ZERO, 1);
    assert_ne!(h1, h2);
}

#[test]
fn compute_user_op_hash_different_chain_ids() {
    let sender = Address::random();
    let op = make_user_op(
        sender,
        U256::from(2_000_000_000u64),
        U256::from(1_000_000_000u64),
        Bytes::from(vec![1u8; 65]),
    );

    let h1 = compute_user_op_hash(&op, Address::ZERO, 1);
    let h137 = compute_user_op_hash(&op, Address::ZERO, 137);
    assert_ne!(h1, h137);
}

// ---------------------------------------------------------------------------
// GasEstimation
// ---------------------------------------------------------------------------

#[test]
fn gas_estimation_serialization() {
    let ge = GasEstimation {
        call_gas_limit: U256::from(500_000u64),
        verification_gas_limit: U256::from(100_000u64),
        pre_verification_gas: U256::from(50_000u64),
        max_fee_per_gas: U256::from(2_000_000_000u64),
        max_priority_fee_per_gas: U256::from(1_000_000_000u64),
    };

    let json = serde_json::to_string(&ge).unwrap();
    assert!(json.contains("callGasLimit"));
    assert!(json.contains("verificationGasLimit"));

    let parsed: GasEstimation = serde_json::from_str(&json).unwrap();
    assert_eq!(parsed.call_gas_limit, ge.call_gas_limit);
    assert_eq!(parsed.max_fee_per_gas, ge.max_fee_per_gas);
}
