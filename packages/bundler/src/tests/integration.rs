//! Integration tests for the bundler.
//!
//! Tests the full bundler lifecycle: submit → validate → bundle → send.

use crate::config::{BundlerConfig, ReputationConfig, SimulationConfig};
use crate::mempool::UserOpPool;
use crate::types::{UserOperation, UserOpStatus, TrackedUserOp};
use crate::bundler::{Bundler, BundlerError, compute_user_op_hash};
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
            enabled: false,
            max_simulation_gas: 30_000_000,
        },
        metrics: crate::config::MetricsConfig::default(),
        health: crate::config::HealthConfig::default(),
    }
}

// ---------------------------------------------------------------------------
// Full bundler lifecycle integration tests
// ---------------------------------------------------------------------------

#[test]
fn integration_submit_valid_op_succeeds() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = make_config_with_defaults();
        let rep_config = ReputationConfig::default();
        let pool = UserOpPool::new("", rep_config).await;
        let gas_oracle = crate::gas_oracle::GasOracle::new("http://invalid-host-99999.example").await.unwrap();
        let metrics = Metrics::new();

        let bundler = Bundler::new(config, pool, gas_oracle, std::sync::Arc::new(metrics)).await.unwrap();

        let sender = Address::random();
        let op = make_user_op(
            sender,
            U256::from(2_000_000_000u64),
            U256::from(1_000_000_000u64),
            Bytes::from(vec![1u8; 65]),
        );

        let result = bundler.submit_user_op(op).await;
        assert!(result.is_ok());
    });
}

#[test]
fn integration_submit_rejected_op_fails() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = make_config_with_defaults();
        let rep_config = ReputationConfig::default();
        let pool = UserOpPool::new("", rep_config).await;
        let gas_oracle = crate::gas_oracle::GasOracle::new("http://invalid-host-99999.example").await.unwrap();
        let metrics = Metrics::new();

        let bundler = Bundler::new(config, pool, gas_oracle, std::sync::Arc::new(metrics)).await.unwrap();

        let sender = Address::random();
        let op = make_user_op(
            sender,
            U256::ZERO, // zero fee — should be rejected
            U256::ZERO,
            Bytes::from(vec![1u8; 65]),
        );

        let result = bundler.submit_user_op(op).await;
        assert!(result.is_err());
    });
}

#[test]
fn integration_bundle_empty_returns_ok() {
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
fn integration_submit_and_bundle() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = make_config_with_defaults();
        let rep_config = ReputationConfig::default();
        let pool = UserOpPool::new("", rep_config).await;
        let gas_oracle = crate::gas_oracle::GasOracle::new("http://invalid-host-99999.example").await.unwrap();
        let metrics = Metrics::new();

        let bundler = Bundler::new(config.clone(), pool, gas_oracle, std::sync::Arc::new(metrics)).await.unwrap();

        let sender = Address::random();
        let op = make_user_op(
            sender,
            U256::from(2_000_000_000u64),
            U256::from(1_000_000_000u64),
            Bytes::from(vec![1u8; 65]),
        );

        // Submit
        bundler.submit_user_op(op).await.unwrap();
        assert_eq!(bundler.mempool.pending_count().await, 1);

        // Bundle
        bundler.maybe_bundle().await.unwrap();
        // After bundle, pending should be 0
        assert_eq!(bundler.mempool.pending_count().await, 0);
    });
}

#[test]
fn integration_multiple_submits_bundle_all() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = make_config_with_defaults();
        let rep_config = ReputationConfig::default();
        let pool = UserOpPool::new("", rep_config).await;
        let gas_oracle = crate::gas_oracle::GasOracle::new("http://invalid-host-99999.example").await.unwrap();
        let metrics = Metrics::new();

        let bundler = Bundler::new(config.clone(), pool, gas_oracle, std::sync::Arc::new(metrics)).await.unwrap();

        // Submit 5 ops from different senders
        for _ in 0..5 {
            let sender = Address::random();
            let op = make_user_op(
                sender,
                U256::from(2_000_000_000u64),
                U256::from(1_000_000_000u64),
                Bytes::from(vec![1u8; 65]),
            );
            bundler.submit_user_op(op).await.unwrap();
        }

        assert_eq!(bundler.mempool.pending_count().await, 5);

        // Bundle all
        bundler.maybe_bundle().await.unwrap();
        assert_eq!(bundler.mempool.pending_count().await, 0);
    });
}

#[test]
fn integration_banned_sender_rejected() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let mut config = make_config_with_defaults();
        let blacklisted = Address::random();
        config.blacklisted_senders.insert(blacklisted);

        let rep_config = ReputationConfig::default();
        let pool = UserOpPool::new("", rep_config).await;
        let gas_oracle = crate::gas_oracle::GasOracle::new("http://invalid-host-99999.example").await.unwrap();
        let metrics = Metrics::new();

        let bundler = Bundler::new(config, pool, gas_oracle, std::sync::Arc::new(metrics)).await.unwrap();

        let op = make_user_op(
            blacklisted,
            U256::from(2_000_000_000u64),
            U256::from(1_000_000_000u64),
            Bytes::from(vec![1u8; 65]),
        );

        let result = bundler.submit_user_op(op).await;
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), BundlerError::ValidationFailed(_)));
    });
}

#[test]
fn integration_supported_entry_points() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = make_config_with_defaults();
        let rep_config = ReputationConfig::default();
        let pool = UserOpPool::new("", rep_config).await;
        let gas_oracle = crate::gas_oracle::GasOracle::new("http://invalid-host-99999.example").await.unwrap();
        let metrics = Metrics::new();

        let bundler = Bundler::new(config.clone(), pool, gas_oracle, std::sync::Arc::new(metrics)).await.unwrap();

        let eps = bundler.supported_entry_points();
        assert_eq!(eps.len(), 1);
        assert_eq!(eps[0], config.entry_point_address);
    });
}

#[test]
fn integration_gas_estimation_returns_values() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = make_config_with_defaults();
        let rep_config = ReputationConfig::default();
        let pool = UserOpPool::new("", rep_config).await;
        let gas_oracle = crate::gas_oracle::GasOracle::new("http://invalid-host-99999.example").await.unwrap();
        let metrics = Metrics::new();

        let bundler = Bundler::new(config.clone(), pool, gas_oracle, std::sync::Arc::new(metrics)).await.unwrap();

        let sender = Address::random();
        let op = make_user_op(
            sender,
            U256::from(2_000_000_000u64),
            U256::from(1_000_000_000u64),
            Bytes::from(vec![1u8; 65]),
        );

        let est = bundler.estimate_gas(&op).await.unwrap();
        assert_eq!(est.call_gas_limit, op.call_gas_limit);
        assert_eq!(est.verification_gas_limit, op.verification_gas_limit);
        assert_eq!(est.pre_verification_gas, op.pre_verification_gas);
    });
}

#[test]
fn integration_mempool_status_tracking() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let config = make_config_with_defaults();
        let rep_config = ReputationConfig::default();
        let pool = UserOpPool::new("", rep_config).await;
        let gas_oracle = crate::gas_oracle::GasOracle::new("http://invalid-host-99999.example").await.unwrap();
        let metrics = Metrics::new();

        let bundler = Bundler::new(config.clone(), pool, gas_oracle, std::sync::Arc::new(metrics)).await.unwrap();

        let sender = Address::random();
        let op = make_user_op(
            sender,
            U256::from(2_000_000_000u64),
            U256::from(1_000_000_000u64),
            Bytes::from(vec![1u8; 65]),
        );

        let hash = bundler.submit_user_op(op).await.unwrap();

        // Check status
        let status = bundler.mempool.get_status(&hash).await;
        assert_eq!(status, Some(UserOpStatus::Pending));

        // Mark as bundled
        bundler.mempool.mark_sent(&[hash], B256::from([0xAAu8; 32])).await;
        let status = bundler.mempool.get_status(&hash).await;
        assert_eq!(status, Some(UserOpStatus::Bundled));
    });
}

#[test]
fn integration_bundle_respects_max_ops() {
    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        let mut config = make_config_with_defaults();
        config.max_ops_per_bundle = 3; // Only bundle 3 at a time

        let rep_config = ReputationConfig::default();
        let pool = UserOpPool::new("", rep_config).await;
        let gas_oracle = crate::gas_oracle::GasOracle::new("http://invalid-host-99999.example").await.unwrap();
        let metrics = Metrics::new();

        let bundler = Bundler::new(config.clone(), pool, gas_oracle, std::sync::Arc::new(metrics)).await.unwrap();

        // Submit 10 ops
        for _ in 0..10 {
            let sender = Address::random();
            let op = make_user_op(
                sender,
                U256::from(2_000_000_000u64),
                U256::from(1_000_000_000u64),
                Bytes::from(vec![1u8; 65]),
            );
            bundler.submit_user_op(op).await.unwrap();
        }

        assert_eq!(bundler.mempool.pending_count().await, 10);

        // Bundle should only take max_ops_per_bundle
        bundler.maybe_bundle().await.unwrap();

        // Check remaining
        let remaining = bundler.mempool.pending_count().await;
        assert_eq!(remaining, 7); // 10 - 3 = 7
    });
}
