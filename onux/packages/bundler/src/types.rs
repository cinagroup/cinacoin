//! Core Bundler types: UserOperation, GasEstimation, etc.
//!
//! Aligned with ERC-4337 v0.7 specification.

use alloy_primitives::{Address, Bytes, B256, U256};
use serde::{Deserialize, Serialize};

/// UserOperation as defined in ERC-4337 v0.7.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UserOperation {
    /// The address of the smart account sender
    pub sender: Address,
    /// Anti-replay parameter (see EIP-4337 §Nonce)
    #[serde(with = "alloy_primitives::serde::quantity")]
    pub nonce: U256,
    /// `initCode` for account deployment (empty if already deployed)
    pub init_code: Bytes,
    /// Calldata for the account execution
    pub call_data: Bytes,
    /// Gas limit for account execution
    #[serde(with = "alloy_primitives::serde::quantity")]
    pub call_gas_limit: U256,
    /// Gas limit for verification
    #[serde(with = "alloy_primitives::serde::quantity")]
    pub verification_gas_limit: U256,
    /// Pre-verification gas (compensation for bundler overhead)
    #[serde(with = "alloy_primitives::serde::quantity")]
    pub pre_verification_gas: U256,
    /// Max fee per gas (EIP-1559)
    #[serde(with = "alloy_primitives::serde::quantity")]
    pub max_fee_per_gas: U256,
    /// Max priority fee per gas (EIP-1559)
    #[serde(with = "alloy_primitives::serde::quantity")]
    pub max_priority_fee_per_gas: U256,
    /// Paymaster metadata (empty if self-paying)
    pub paymaster: Address,
    #[serde(with = "alloy_primitives::serde::quantity")]
    pub paymaster_verification_gas_limit: U256,
    #[serde(with = "alloy_primitives::serde::quantity")]
    pub paymaster_post_op_gas_limit: U256,
    pub paymaster_data: Bytes,
    /// Account signature over the UserOp hash
    pub signature: Bytes,
}

impl UserOperation {
    /// Compute the total gas limit the bundler must front.
    pub fn total_gas_limit(&self) -> U256 {
        self.call_gas_limit
            + self.verification_gas_limit
            + self.pre_verification_gas
            + self.paymaster_verification_gas_limit
            + self.paymaster_post_op_gas_limit
    }

    /// Estimate the maximum cost at current gas prices.
    pub fn max_cost(&self) -> U256 {
        self.total_gas_limit() * self.max_fee_per_gas
    }

    /// Whether this UserOp uses a paymaster.
    pub fn has_paymaster(&self) -> bool {
        self.paymaster != Address::ZERO
    }
}

/// Result of gas estimation for a UserOp.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GasEstimation {
    pub call_gas_limit: U256,
    pub verification_gas_limit: U256,
    pub pre_verification_gas: U256,
    pub max_fee_per_gas: U256,
    pub max_priority_fee_per_gas: U256,
}

/// Status of a UserOp in the mempool.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UserOpStatus {
    Pending,
    Bundled,
    Included,
    Rejected,
}

/// A tracked UserOp with metadata.
#[derive(Debug, Clone, serde::Serialize)]
pub struct TrackedUserOp {
    pub user_op: UserOperation,
    pub hash: B256,
    pub status: UserOpStatus,
    pub received_at: chrono::DateTime<chrono::Utc>,
    pub bundle_tx_hash: Option<B256>,
}

/// Response for `eth_getUserOperationReceipt`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserOpReceipt {
    pub user_op_hash: B256,
    pub sender: Address,
    pub nonce: U256,
    pub actual_gas_cost: U256,
    pub actual_gas_used: U256,
    pub success: bool,
    pub logs: Vec<serde_json::Value>,
    pub receipt: serde_json::Value,
}
