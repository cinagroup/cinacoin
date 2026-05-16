//! Core bundler logic: submit, validate, bundle, and send UserOps.
//!
//! The Bundler is the heart of the ERC-4337 infrastructure. It:
//! 1. Receives UserOps via RPC
//! 2. Validates them against the EntryPoint
//! 3. Pools them in the mempool
//! 4. Periodically bundles and submits to the chain

use crate::config::BundlerConfig;
use crate::gas_oracle::GasOracle;
use crate::mempool::UserOpPool;
use crate::types::{GasEstimation, TrackedUserOp, UserOpStatus, UserOperation};
use crate::validation::{UserOpValidator, ValidationResult};
use alloy_primitives::{keccak256, Address, B256, U256};
use std::sync::Arc;
use tracing::{debug, error, info, warn};

/// The core bundler.
#[derive(Clone)]
pub struct Bundler {
    config: BundlerConfig,
    mempool: UserOpPool,
    gas_oracle: GasOracle,
    validator: Arc<UserOpValidator>,
}

impl Bundler {
    /// Create a new bundler instance.
    pub async fn new(
        config: BundlerConfig,
        mempool: UserOpPool,
        gas_oracle: GasOracle,
    ) -> Result<Self, BundlerError> {
        let validator = Arc::new(UserOpValidator::new(&config));

        Ok(Self {
            config,
            mempool,
            gas_oracle,
            validator,
        })
    }

    /// Submit a UserOp to the bundler's mempool.
    /// Returns the UserOp hash if accepted.
    pub async fn submit_user_op(&self, user_op: UserOperation) -> Result<B256, BundlerError> {
        info!(sender = %user_op.sender, "Submitting UserOp");

        // Validate
        let validation = self.validator.validate(&user_op).await;
        if !validation.valid {
            let reason = validation.reason.unwrap_or_else(|| "unknown".into());
            warn!(reason, sender = %user_op.sender, "UserOp validation failed");
            return Err(BundlerError::ValidationFailed(reason));
        }

        // Compute UserOp hash (simplified — in production, hash per EIP-4337)
        let hash = compute_user_op_hash(
            &user_op,
            self.config.entry_point_address,
            self.config.chain_id,
        );

        let tracked = TrackedUserOp {
            user_op,
            hash,
            status: UserOpStatus::Pending,
            received_at: chrono::Utc::now(),
            bundle_tx_hash: None,
        };

        let op_hash = self
            .mempool
            .add(tracked)
            .await
            .map_err(|e| BundlerError::PoolError(e.to_string()))?;

        info!(hash = %op_hash, "UserOp accepted into mempool");
        Ok(op_hash)
    }

    /// Attempt to bundle pending UserOps and submit to the chain.
    pub async fn maybe_bundle(&self) -> Result<(), BundlerError> {
        let pending_count = self.mempool.pending_count().await;
        if pending_count == 0 {
            return Ok(());
        }

        debug!(pending = pending_count, "Attempting to bundle");

        let ops = self
            .mempool
            .get_pending(self.config.max_ops_per_bundle)
            .await;

        if ops.is_empty() {
            return Ok(());
        }

        // Get current gas prices
        let max_fee = self.gas_oracle.get_max_fee().await;
        let priority_fee = self.gas_oracle.get_priority_fee().await;

        // Build and send the handleOps transaction
        let tx_hash = self
            .create_handle_ops_tx(&ops, max_fee, priority_fee)
            .await?;

        // Mark as sent
        let hashes: Vec<_> = ops.iter().map(|op| op.hash).collect();
        self.mempool.mark_sent(&hashes, tx_hash).await;

        info!(
            tx_hash = %tx_hash,
            ops = ops.len(),
            "Bundle sent to EntryPoint"
        );

        Ok(())
    }

    /// Create and send an EntryPoint handleOps transaction.
    /// In production, this would encode the calldata and send via a signer.
    async fn create_handle_ops_tx(
        &self,
        ops: &[TrackedUserOp],
        max_fee: U256,
        priority_fee: U256,
    ) -> Result<B256, BundlerError> {
        if ops.is_empty() {
            return Err(BundlerError::NoOpsToBundle);
        }

        let user_ops: Vec<_> = ops.iter().map(|op| op.user_op.clone()).collect();

        // Simulate handleOps to check it won't revert
        self.simulate_handle_ops(&user_ops).await?;

        // In production, encode and send the actual transaction:
        // let tx = entry_point.handleOps(user_ops, self.config.beneficiary);
        // let pending = provider.send_transaction(tx).await?;
        // Ok(*pending.tx_hash())

        // For now, return a zero hash as placeholder
        debug!(ops = user_ops.len(), max_fee = %max_fee, priority_fee = %priority_fee,
            "handleOps transaction would be sent");

        // Placeholder — in real implementation this returns the actual tx hash
        Ok(B256::ZERO)
    }

    /// Simulate handleOps to predict success/failure before sending.
    async fn simulate_handle_ops(&self, ops: &[UserOperation]) -> Result<(), BundlerError> {
        if ops.is_empty() {
            return Ok(());
        }

        // In production: call eth_call with handleOps calldata
        // Check the revert reason if simulation fails
        debug!("Simulating handleOps for {} UserOps", ops.len());
        Ok(())
    }

    /// Estimate gas for a UserOp.
    pub async fn estimate_gas(&self, user_op: &UserOperation) -> Result<GasEstimation, BundlerError> {
        // In production, call eth_estimateUserOperationGas on EntryPoint
        let max_fee = self.gas_oracle.get_max_fee().await;
        let priority_fee = self.gas_oracle.get_priority_fee().await;

        Ok(GasEstimation {
            call_gas_limit: user_op.call_gas_limit,
            verification_gas_limit: user_op.verification_gas_limit,
            pre_verification_gas: user_op.pre_verification_gas,
            max_fee_per_gas: max_fee,
            max_priority_fee_per_gas: priority_fee,
        })
    }

    /// Get the current supported entry points.
    pub fn supported_entry_points(&self) -> Vec<Address> {
        vec![self.config.entry_point_address]
    }
}

/// Compute the UserOp hash per EIP-4337 spec.
/// This is a simplified version — full implementation would use the
/// actual EIP-4337 hashing algorithm via the EntryPoint contract.
fn compute_user_op_hash(op: &UserOperation, entry_point: Address, chain_id: u64) -> B256 {
    // In production: call EntryPoint.getUserOpHash(userOp)
    // For now, use a simplified hash of all fields
    let mut buf = Vec::new();
    buf.extend_from_slice(op.sender.as_slice());
    buf.extend_from_slice(&op.nonce.to_be_bytes::<32>());
    buf.extend_from_slice(&op.call_data);
    buf.extend_from_slice(&op.call_gas_limit.to_be_bytes::<32>());
    buf.extend_from_slice(&op.verification_gas_limit.to_be_bytes::<32>());
    buf.extend_from_slice(&op.pre_verification_gas.to_be_bytes::<32>());
    buf.extend_from_slice(&op.max_fee_per_gas.to_be_bytes::<32>());
    buf.extend_from_slice(&op.max_priority_fee_per_gas.to_be_bytes::<32>());
    buf.extend_from_slice(op.paymaster.as_slice());
    buf.extend_from_slice(entry_point.as_slice());
    buf.extend_from_slice(&chain_id.to_be_bytes());

    keccak256(&buf)
}

#[derive(Debug, thiserror::Error)]
pub enum BundlerError {
    #[error("validation failed: {0}")]
    ValidationFailed(String),
    #[error("pool error: {0}")]
    PoolError(String),
    #[error("no ops to bundle")]
    NoOpsToBundle,
    #[error("RPC error: {0}")]
    RpcError(String),
    #[error("simulation failed: {0}")]
    SimulationFailed(String),
    #[error("encoding error: {0}")]
    EncodingError(String),
}
