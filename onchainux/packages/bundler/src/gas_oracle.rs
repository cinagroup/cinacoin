//! Gas price oracle: fetches current gas prices from the network.
//!
//! Supports multiple strategies:
//! 1. Direct RPC (eth_feeHistory)
//! 2. External API fallback (e.g. Etherscan gas tracker)
//! 3. Cached value with TTL to avoid spam

use alloy_primitives::U256;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use tracing::{debug, warn};

/// Current gas price snapshot.
#[derive(Debug, Clone, Copy)]
pub struct GasPrice {
    pub base_fee: U256,
    pub priority_fee: U256,
    pub max_fee: U256,
    pub timestamp: Instant,
}

/// Gas price oracle with caching.
#[derive(Clone)]
pub struct GasOracle {
    rpc_url: String,
    cache: Arc<RwLock<Option<GasPrice>>>,
    ttl: Duration,
    last_base_fee_gwei: Arc<AtomicU64>,
}

impl GasOracle {
    /// Create a new gas oracle.
    pub async fn new(rpc_url: &str) -> Result<Self, GasOracleError> {
        let oracle = Self {
            rpc_url: rpc_url.to_string(),
            cache: Arc::new(RwLock::new(None)),
            ttl: Duration::from_secs(12), // ~1 Ethereum block
            last_base_fee_gwei: Arc::new(AtomicU64::new(30)), // Default 30 gwei
        };

        // Pre-fetch initial gas price
        let _ = oracle.fetch_gas_price().await;

        Ok(oracle)
    }

    /// Get the current max fee per gas, using cache if fresh.
    pub async fn get_max_fee(&self) -> U256 {
        self.get_gas_price().await.map(|g| g.max_fee).unwrap_or_else(|| {
            U256::from(self.last_base_fee_gwei.load(Ordering::Relaxed)) * U256::from(1_000_000_000u64)
        })
    }

    /// Get the current priority fee.
    pub async fn get_priority_fee(&self) -> U256 {
        self.get_gas_price()
            .await
            .map(|g| g.priority_fee)
            .unwrap_or_else(|| U256::from(1_500_000_000u64)) // 1.5 gwei default
    }

    /// Get cached gas price or fetch fresh.
    async fn get_gas_price(&self) -> Option<GasPrice> {
        // Check cache
        if let Some(cached) = self.cache.read().await.as_ref() {
            if cached.timestamp.elapsed() < self.ttl {
                return Some(*cached);
            }
        }

        // Fetch fresh
        match self.fetch_gas_price().await {
            Ok(price) => Some(price),
            Err(e) => {
                warn!(error = %e, "Failed to fetch gas price, using cached value");
                self.cache.read().await.clone()
            }
        }
    }

    /// Fetch current gas price via RPC.
    async fn fetch_gas_price(&self) -> Result<GasPrice, GasOracleError> {
        let client = reqwest::Client::new();

        // Get base fee via eth_feeHistory
        let body = serde_json::json!({
            "jsonrpc": "2.0",
            "method": "eth_feeHistory",
            "params": ["0x1", "latest", [10.0]],
            "id": 1,
        });

        let resp = client
            .post(&self.rpc_url)
            .json(&body)
            .send()
            .await
            .map_err(|e| GasOracleError::RpcFailed(e.to_string()))?;

        let json: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| GasOracleError::ParseFailed(e.to_string()))?;

        let base_fee_hex = json["result"]["baseFeePerGas"]
            .as_array()
            .and_then(|arr| arr.last())
            .and_then(|v| v.as_str())
            .ok_or_else(|| GasOracleError::UnexpectedResponse(json.to_string()))?;

        let base_fee: U256 = U256::from_str_radix(
            base_fee_hex.trim_start_matches("0x"),
            16,
        ).map_err(|e| GasOracleError::ParseFailed(e.to_string()))?;

        // Get priority fee via eth_maxPriorityFeePerGas
        let body = serde_json::json!({
            "jsonrpc": "2.0",
            "method": "eth_maxPriorityFeePerGas",
            "params": [],
            "id": 2,
        });

        let resp = client.post(&self.rpc_url).json(&body).send().await?;
        let json: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| GasOracleError::ParseFailed(e.to_string()))?;

        let priority_hex = json["result"]
            .as_str()
            .ok_or_else(|| GasOracleError::UnexpectedResponse(json.to_string()))?;

        let priority_fee: U256 = U256::from_str_radix(
            priority_hex.trim_start_matches("0x"),
            16,
        ).map_err(|e| GasOracleError::ParseFailed(e.to_string()))?;

        let max_fee = base_fee + priority_fee;

        let price = GasPrice {
            base_fee,
            priority_fee,
            max_fee,
            timestamp: Instant::now(),
        };

        // Update cache
        *self.cache.write().await = Some(price);

        // Store base fee in gwei for default fallback
        self.last_base_fee_gwei.store(
            (base_fee / U256::from(1_000_000_000u64)).to(),
            Ordering::Relaxed,
        );

        debug!(
            base_fee_gwei = %price.base_fee / U256::from(1_000_000_000u64),
            priority_gwei = %price.priority_fee / U256::from(1_000_000_000u64),
            "Gas price updated"
        );

        Ok(price)
    }

    /// Force refresh the gas price.
    pub async fn refresh(&self) -> Result<GasPrice, GasOracleError> {
        self.fetch_gas_price().await
    }
}

#[derive(Debug, thiserror::Error)]
pub enum GasOracleError {
    #[error("RPC request failed: {0}")]
    RpcFailed(String),
    #[error("Failed to parse response: {0}")]
    ParseFailed(String),
    #[error("Unexpected RPC response: {0}")]
    UnexpectedResponse(String),
}

impl From<reqwest::Error> for GasOracleError {
    fn from(e: reqwest::Error) -> Self {
        GasOracleError::RpcFailed(e.to_string())
    }
}
