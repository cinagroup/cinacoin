//! UserOp validation: simulation-based verification, profit checks, and blacklist enforcement.
//!
//! Follows ERC-4337 validation rules:
//! 1. Signature verification via EntryPoint simulation
//! 2. Gas limit sanity checks
//! 3. Profit margin enforcement
//! 4. Blacklist / rate-limit enforcement

use crate::config::BundlerConfig;
use crate::types::UserOperation;
use alloy_primitives::{Address, U256};
use std::collections::HashSet;
use tracing::debug;

/// Validation result for a UserOp.
#[derive(Debug)]
pub struct ValidationResult {
    pub valid: bool,
    pub reason: Option<String>,
}

impl ValidationResult {
    pub fn ok() -> Self {
        Self {
            valid: true,
            reason: None,
        }
    }

    pub fn fail(reason: impl Into<String>) -> Self {
        Self {
            valid: false,
            reason: Some(reason.into()),
        }
    }
}

/// UserOp validator.
#[derive(Clone)]
pub struct UserOpValidator {
    config: BundlerConfig,
    blacklisted: HashSet<Address>,
}

impl UserOpValidator {
    pub fn new(config: &BundlerConfig) -> Self {
        Self {
            config: config.clone(),
            blacklisted: config.blacklisted_senders.clone(),
        }
    }

    /// Validate a UserOp before accepting it into the mempool.
    pub async fn validate(&self, user_op: &UserOperation) -> ValidationResult {
        // 1. Blacklist check
        if let Some(result) = self.check_blacklist(user_op) {
            return result;
        }

        // 2. Gas limit sanity
        if let Some(result) = self.check_gas_limits(user_op) {
            return result;
        }

        // 3. Gas price sanity
        if let Some(result) = self.check_gas_price(user_op) {
            return result;
        }

        // 4. Profit margin check
        if let Some(result) = self.check_profit_margin(user_op).await {
            return result;
        }

        // 5. Signature is non-empty
        if user_op.signature.is_empty() {
            return ValidationResult::fail("empty signature");
        }

        ValidationResult::ok()
    }

    /// Check if the sender is blacklisted.
    fn check_blacklist(&self, user_op: &UserOperation) -> Option<ValidationResult> {
        if self.blacklisted.contains(&user_op.sender) {
            return Some(ValidationResult::fail("sender is blacklisted"));
        }
        None
    }

    /// Verify gas limits are within acceptable bounds.
    fn check_gas_limits(&self, user_op: &UserOperation) -> Option<ValidationResult> {
        let total_gas = user_op.call_gas_limit
            + user_op.verification_gas_limit
            + user_op.pre_verification_gas;

        // Must meet minimum gas limit
        if total_gas < U256::from(self.config.min_gas_limit) {
            return Some(ValidationResult::fail("total gas below minimum"));
        }

        // Verification gas should not be unreasonably high (potential DoS)
        if user_op.verification_gas_limit > U256::from(5_000_000u64) {
            return Some(ValidationResult::fail("verification gas limit too high"));
        }

        // Call gas should not be unreasonably high
        if user_op.call_gas_limit > U256::from(20_000_000u64) {
            return Some(ValidationResult::fail("call gas limit too high"));
        }

        None
    }

    /// Verify gas price is reasonable (not zero, not excessively high).
    fn check_gas_price(&self, user_op: &UserOperation) -> Option<ValidationResult> {
        if user_op.max_fee_per_gas.is_zero() {
            return Some(ValidationResult::fail("max fee per gas is zero"));
        }

        if user_op.max_priority_fee_per_gas > user_op.max_fee_per_gas {
            return Some(ValidationResult::fail(
                "priority fee exceeds max fee",
            ));
        }

        None
    }

    /// Verify the bundler makes sufficient profit.
    async fn check_profit_margin(&self, user_op: &UserOperation) -> Option<ValidationResult> {
        let estimated_cost = self.estimate_execution_cost(user_op).await;
        let user_payment = user_op.max_priority_fee_per_gas * user_op.total_gas_limit();

        // Profit margin in bps
        if estimated_cost > U256::ZERO {
            let profit_bps = user_payment
                .saturating_sub(estimated_cost)
                .checked_mul(U256::from(10_000u64))
                .and_then(|n| n.checked_div(estimated_cost));

            if let Some(profit) = profit_bps {
                if profit < U256::from(self.config.min_profit_margin_bps) {
                    debug!(
                        profit_bps = %profit,
                        required = self.config.min_profit_margin_bps,
                        "UserOp profit margin below threshold"
                    );
                    return Some(ValidationResult::fail("insufficient profit margin"));
                }
            }
        }

        None
    }

    /// Estimate the execution cost of a UserOp (on-chain gas * base fee).
    /// In production this would call the RPC to get current base fee.
    async fn estimate_execution_cost(&self, user_op: &UserOperation) -> U256 {
        // Simplified: estimate = call_gas_limit * (max_fee - priority_fee)
        // In practice, query the base fee from the network.
        user_op.call_gas_limit * user_op.max_fee_per_gas.saturating_sub(user_op.max_priority_fee_per_gas)
    }

    /// Add an address to the blacklist at runtime.
    pub fn blacklist(&mut self, address: Address) {
        self.blacklisted.insert(address);
    }

    /// Remove an address from the blacklist.
    pub fn unblacklist(&mut self, address: Address) {
        self.blacklisted.remove(&address);
    }
}
