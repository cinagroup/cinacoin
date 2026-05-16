use alloy_primitives::Address;
use std::collections::HashSet;

/// Bundler configuration loaded from environment variables.
#[derive(Debug, Clone)]
pub struct BundlerConfig {
    /// EntryPoint v0.7 contract address
    pub entry_point_address: Address,
    /// Bundler beneficiary (receives tips)
    pub beneficiary: Address,
    /// Chain ID
    pub chain_id: u64,
    /// Full-node RPC URL
    pub rpc_url: String,
    /// Bundler signer private key (hex, no 0x prefix)
    pub signer_private_key: String,
    /// Redis URL for mempool persistence (optional; falls back to in-memory)
    pub redis_url: String,
    /// Minimum profit margin in basis points (e.g. 500 = 5%)
    pub min_profit_margin_bps: u16,
    /// Maximum UserOps per bundle
    pub max_ops_per_bundle: usize,
    /// Bundle timeout in milliseconds
    pub bundle_timeout_ms: u64,
    /// Minimum gas limit for a UserOp
    pub min_gas_limit: u64,
    /// Blacklisted sender addresses
    pub blacklisted_senders: HashSet<Address>,
    /// HTTP listen address for the RPC server
    pub listen_addr: String,
    /// Interval (ms) between automatic bundle attempts
    pub bundle_interval_ms: u64,
}

impl BundlerConfig {
    pub fn from_env() -> Result<Self, ConfigError> {
        let entry_point_address = parse_address(
            &get_env("ENTRY_POINT_ADDRESS")
                .unwrap_or_else(|| "0x0000000071727De22E5E9d8BAf0edAc6f37da032".into()),
        )?;
        let beneficiary = parse_address(
            &get_env("BUNDLER_BENEFICIARY").ok_or_else(|| ConfigError::Missing("BUNDLER_BENEFICIARY"))?,
        )?;
        let chain_id = get_env("CHAIN_ID")
            .unwrap_or_else(|| "1".into())
            .parse()
            .map_err(|_| ConfigError::Parse("CHAIN_ID"))?;
        let rpc_url = get_env("RPC_URL")
            .ok_or_else(|| ConfigError::Missing("RPC_URL"))?;
        let signer_private_key = get_env("SIGNER_PRIVATE_KEY")
            .ok_or_else(|| ConfigError::Missing("SIGNER_PRIVATE_KEY"))?;
        let redis_url = get_env("REDIS_URL").unwrap_or_else(|| "".into());
        let min_profit_margin_bps = get_env("MIN_PROFIT_MARGIN_BPS")
            .unwrap_or_else(|| "500".into())
            .parse()
            .map_err(|_| ConfigError::Parse("MIN_PROFIT_MARGIN_BPS"))?;
        let max_ops_per_bundle = get_env("MAX_OPS_PER_BUNDLE")
            .unwrap_or_else(|| "128".into())
            .parse()
            .map_err(|_| ConfigError::Parse("MAX_OPS_PER_BUNDLE"))?;
        let bundle_timeout_ms = get_env("BUNDLE_TIMEOUT_MS")
            .unwrap_or_else(|| "5000".into())
            .parse()
            .map_err(|_| ConfigError::Parse("BUNDLE_TIMEOUT_MS"))?;
        let min_gas_limit = get_env("MIN_GAS_LIMIT")
            .unwrap_or_else(|| "21000".into())
            .parse()
            .map_err(|_| ConfigError::Parse("MIN_GAS_LIMIT"))?;
        let blacklisted_raw = get_env("BLACKLISTED_SENDERS").unwrap_or_default();
        let blacklisted_senders = blacklisted_raw
            .split(',')
            .filter(|s| !s.is_empty())
            .map(parse_address)
            .collect::<Result<HashSet<_>, _>>()?;
        let listen_addr = get_env("LISTEN_ADDR").unwrap_or_else(|| "127.0.0.1:3000".into());
        let bundle_interval_ms = get_env("BUNDLE_INTERVAL_MS")
            .unwrap_or_else(|| "2000".into())
            .parse()
            .map_err(|_| ConfigError::Parse("BUNDLE_INTERVAL_MS"))?;

        Ok(Self {
            entry_point_address,
            beneficiary,
            chain_id,
            rpc_url,
            signer_private_key,
            redis_url,
            min_profit_margin_bps,
            max_ops_per_bundle,
            bundle_timeout_ms,
            min_gas_limit,
            blacklisted_senders,
            listen_addr,
            bundle_interval_ms,
        })
    }
}

fn get_env(key: &str) -> Option<String> {
    std::env::var(key).ok()
}

fn parse_address(s: &str) -> Result<Address, ConfigError> {
    s.parse::<Address>().map_err(|_| ConfigError::ParseAddress(s.into()))
}

#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("missing required env var: {0}")]
    Missing(&'static str),
    #[error("failed to parse env var: {0}")]
    Parse(&'static str),
    #[error("invalid address: {0}")]
    ParseAddress(String),
}
