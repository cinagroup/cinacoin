//! Bundler configuration: loaded from YAML file with env-var fallback.
//!
//! Priority: env vars > YAML defaults > compiled-in defaults.

use alloy_primitives::Address;
use serde::Deserialize;
use std::collections::HashSet;

/// Top-level bundler configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct BundlerConfig {
    // --- Network ---
    #[serde(default = "default_rpc_url")]
    pub rpc_url: String,
    #[serde(default = "default_chain_id")]
    pub chain_id: u64,
    #[serde(default = "default_entry_point")]
    pub entry_point_address: Address,

    // --- Signer ---
    #[serde(default)]
    pub signer_private_key: String,
    pub beneficiary: Option<Address>,

    // --- Server ---
    #[serde(default = "default_listen_addr")]
    pub listen_addr: String,

    // --- Mempool ---
    #[serde(default = "default_max_ops")]
    pub max_ops_per_bundle: usize,
    #[serde(default = "default_bundle_interval")]
    pub bundle_interval_ms: u64,
    #[serde(default = "default_bundle_timeout")]
    pub bundle_timeout_ms: u64,
    #[serde(default = "default_min_gas")]
    pub min_gas_limit: u64,
    #[serde(default)]
    pub redis_url: String,

    // --- Gas ---
    #[serde(default = "default_profit_margin")]
    pub min_profit_margin_bps: u16,

    // --- Reputation ---
    #[serde(default)]
    pub reputation: ReputationConfig,

    // --- Blacklist ---
    #[serde(default)]
    pub blacklisted_senders: HashSet<Address>,

    // --- Simulation ---
    #[serde(default)]
    pub simulation: SimulationConfig,

    // --- Metrics ---
    #[serde(default)]
    pub metrics: MetricsConfig,

    // --- Health ---
    #[serde(default)]
    pub health: HealthConfig,
}

/// Reputation system configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct ReputationConfig {
    /// After this many violations, sender gets throttled.
    #[serde(default = "default_throttle_threshold")]
    pub throttle_threshold: u32,
    /// After this many violations, sender gets banned.
    #[serde(default = "default_ban_threshold")]
    pub ban_threshold: u32,
    /// Throttle duration in seconds.
    #[serde(default = "default_throttle_duration")]
    pub throttle_duration_sec: u64,
    /// Ban duration in seconds (0 = permanent).
    #[serde(default = "default_ban_duration")]
    pub ban_duration_sec: u64,
    /// Max pending ops per sender.
    #[serde(default = "default_max_pending")]
    pub max_pending_per_sender: u32,
}

/// Simulation configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct SimulationConfig {
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default = "default_max_sim_gas")]
    pub max_simulation_gas: u64,
}

/// Metrics configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct MetricsConfig {
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default = "default_metrics_path")]
    pub path: String,
}

/// Health check configuration.
#[derive(Debug, Clone, Deserialize)]
pub struct HealthConfig {
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default = "default_health_path")]
    pub path: String,
}

// --- Defaults ---

fn default_rpc_url() -> String { std::env::var("RPC_URL").unwrap_or_default() }
fn default_chain_id() -> u64 { std::env::var("CHAIN_ID").ok().and_then(|v| v.parse().ok()).unwrap_or(1) }
fn default_entry_point() -> Address { "0x0000000071727De22E5E9d8BAf0edAc6f37da032".parse().unwrap() }
fn default_listen_addr() -> String { "0.0.0.0:3000".into() }
fn default_max_ops() -> usize { 128 }
fn default_bundle_interval() -> u64 { 2000 }
fn default_bundle_timeout() -> u64 { 5000 }
fn default_min_gas() -> u64 { 21000 }
fn default_profit_margin() -> u16 { 500 }
fn default_throttle_threshold() -> u32 { 5 }
fn default_ban_threshold() -> u32 { 20 }
fn default_throttle_duration() -> u64 { 3600 }
fn default_ban_duration() -> u64 { 86400 }
fn default_max_pending() -> u32 { 16 }
fn default_true() -> bool { true }
fn default_max_sim_gas() -> u64 { 30_000_000 }
fn default_metrics_path() -> String { "/metrics".into() }
fn default_health_path() -> String { "/health".into() }

impl BundlerConfig {
    /// Load config from YAML file, falling back to environment variables.
    pub fn from_file(path: &str) -> Result<Self, ConfigError> {
        // Load .env if present
        let _ = dotenv::dotenv();

        let content = std::fs::read_to_string(path)
            .map_err(|e| ConfigError::Io(e.to_string()))?;

        // First pass: expand ${VAR} references from env
        let rendered = expand_env_vars(&content);

        // Second pass: parse YAML
        let config: BundlerConfig = serde_yaml::from_str(&rendered)
            .map_err(|e| ConfigError::Parse(e.to_string()))?;

        // Override signer_private_key from env if not set in YAML
        let mut config = config;
        if let Ok(key) = std::env::var("SIGNER_PRIVATE_KEY") {
            config.signer_private_key = key;
        }
        if let Ok(beneficiary) = std::env::var("BUNDLER_BENEFICIARY") {
            config.beneficiary = beneficiary.parse::<Address>().ok();
        }
        if let Ok(redis) = std::env::var("REDIS_URL") {
            config.redis_url = redis;
        }

        Ok(config)
    }

    /// Load from env vars only (backward-compatible).
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
            .map_err(|_| ConfigError::Parse("CHAIN_ID".into()))?;
        let rpc_url = get_env("RPC_URL")
            .ok_or_else(|| ConfigError::Missing("RPC_URL"))?;
        let signer_private_key = get_env("SIGNER_PRIVATE_KEY")
            .ok_or_else(|| ConfigError::Missing("SIGNER_PRIVATE_KEY"))?;
        let redis_url = get_env("REDIS_URL").unwrap_or_default();
        let min_profit_margin_bps = get_env("MIN_PROFIT_MARGIN_BPS")
            .unwrap_or_else(|| "500".into())
            .parse()
            .map_err(|_| ConfigError::Parse("MIN_PROFIT_MARGIN_BPS".into()))?;
        let max_ops_per_bundle = get_env("MAX_OPS_PER_BUNDLE")
            .unwrap_or_else(|| "128".into())
            .parse()
            .map_err(|_| ConfigError::Parse("MAX_OPS_PER_BUNDLE".into()))?;
        let bundle_timeout_ms = get_env("BUNDLE_TIMEOUT_MS")
            .unwrap_or_else(|| "5000".into())
            .parse()
            .map_err(|_| ConfigError::Parse("BUNDLE_TIMEOUT_MS".into()))?;
        let min_gas_limit = get_env("MIN_GAS_LIMIT")
            .unwrap_or_else(|| "21000".into())
            .parse()
            .map_err(|_| ConfigError::Parse("MIN_GAS_LIMIT".into()))?;
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
            .map_err(|_| ConfigError::Parse("BUNDLE_INTERVAL_MS".into()))?;

        Ok(Self {
            entry_point_address,
            beneficiary: Some(beneficiary),
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
            reputation: ReputationConfig::default(),
            simulation: SimulationConfig::default(),
            metrics: MetricsConfig::default(),
            health: HealthConfig::default(),
        })
    }

    /// Get the beneficiary address.
    pub fn beneficiary(&self) -> Address {
        self.beneficiary.unwrap_or(Address::ZERO)
    }
}

impl Default for ReputationConfig {
    fn default() -> Self {
        Self {
            throttle_threshold: default_throttle_threshold(),
            ban_threshold: default_ban_threshold(),
            throttle_duration_sec: default_throttle_duration(),
            ban_duration_sec: default_ban_duration(),
            max_pending_per_sender: default_max_pending(),
        }
    }
}

impl Default for SimulationConfig {
    fn default() -> Self {
        Self {
            enabled: default_true(),
            max_simulation_gas: default_max_sim_gas(),
        }
    }
}

impl Default for MetricsConfig {
    fn default() -> Self {
        Self {
            enabled: default_true(),
            path: default_metrics_path(),
        }
    }
}

impl Default for HealthConfig {
    fn default() -> Self {
        Self {
            enabled: default_true(),
            path: default_health_path(),
        }
    }
}

fn get_env(key: &str) -> Option<String> {
    std::env::var(key).ok()
}

fn parse_address(s: &str) -> Result<Address, ConfigError> {
    s.parse::<Address>().map_err(|_| ConfigError::ParseAddress(s.into()))
}

/// Expand ${VAR} references in a string using environment variables.
fn expand_env_vars(input: &str) -> String {
    let mut result = String::with_capacity(input.len());
    let mut chars = input.chars().peekable();

    while let Some(c) = chars.next() {
        if c == '$' && chars.peek() == Some(&'{') {
            chars.next(); // consume '{'
            let mut var_name = String::new();
            while let Some(&c) = chars.peek() {
                if c == '}' {
                    chars.next();
                    break;
                }
                var_name.push(c);
                chars.next();
            }
            if let Ok(val) = std::env::var(&var_name) {
                result.push_str(&val);
            } else {
                // Keep the original if env var not found
                result.push_str(&format!("${{{}}}", var_name));
            }
        } else {
            result.push(c);
        }
    }

    result
}

#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("missing required env var: {0}")]
    Missing(&'static str),
    #[error("failed to parse config: {0}")]
    Parse(String),
    #[error("invalid address: {0}")]
    ParseAddress(String),
    #[error("I/O error: {0}")]
    Io(String),
}
