//! OnChainUX ERC-4337 Bundler
//!
//! Production-grade bundler for ERC-4337 UserOperations. Accepts UserOps via JSON-RPC,
//! validates them, pools them in a priority mempool, and bundles them into EntryPoint
//! `handleOps` transactions.
//!
//! # Quick Start
//!
//! ```bash
//! export ENTRY_POINT_ADDRESS=0x0000000071727De22E5E9d8BAf0edAc6f37da032
//! export BUNDLER_BENEFICIARY=0x...
//! export RPC_URL=https://ethereum-rpc.publicnode.com
//! export SIGNER_PRIVATE_KEY=0x...
//! cargo run
//! ```

mod bundler;
mod config;
mod gas_oracle;
mod mempool;
mod rpc;
mod types;
mod validation;

use config::BundlerConfig;
use rpc::BundlerRpcServer;
use tracing::{info, Level};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "onchainux_bundler=info,tower_http=info".into()),
        )
        .init();

    let config = BundlerConfig::from_env()?;
    info!(
        entry_point = %config.entry_point_address,
        beneficiary = %config.beneficiary,
        chain_id = config.chain_id,
        rpc_url = %config.rpc_url,
        "Starting OnChainUX Bundler"
    );

    // Initialise gas oracle
    let gas_oracle = gas_oracle::GasOracle::new(&config.rpc_url).await?;

    // Initialise mempool (Redis-backed or in-memory)
    let mempool = mempool::UserOpPool::new(&config.redis_url).await?;

    // Instantiate the bundler core
    let bundler = bundler::Bundler::new(
        config.clone(),
        mempool,
        gas_oracle,
    ).await?;

    // Start the bundling loop — periodically attempt to bundle pending UserOps
    let bundler_clone = bundler.clone();
    let bundle_interval = config.bundle_interval_ms;
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_millis(bundle_interval));
        loop {
            interval.tick().await;
            if let Err(e) = bundler_clone.maybe_bundle().await {
                tracing::error!(error = %e, "Bundle attempt failed");
            }
        }
    });

    // Start JSON-RPC / HTTP server
    rpc::serve(config.listen_addr, bundler).await?;

    Ok(())
}
