# ROUND-7: CinaConnect AA Bundler Transaction Send Stub Fix

## Summary

**Status:** ✅ FIXED (already implemented in commit `f717bb1`)

**Target:** Fix `bundler/src/bundler.rs::create_handle_ops_tx` which returned `B256::ZERO` as a placeholder instead of actually building and sending transactions.

**Commit:** `f717bb1` — "chore(rounds-1-5): massive improvements across 5 rounds of fixes"

---

## Problem: The Stub

### Before (Stub Implementation)

```rust
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

    // Simulate handleOps with state override before sending
    self.simulate_handle_ops_with_override(&user_ops).await?;

    debug!(ops = user_ops.len(), max_fee = %max_fee, priority_fee = %priority_fee,
        "handleOps transaction would be sent");

    // Placeholder — in production, encode and send via signer
    Ok(B256::ZERO)  // ← ALWAYS returns zero hash, never sends anything
}
```

**Critical Issues:**
1. **Always returned `B256::ZERO`** — no transaction was ever sent
2. **No signer component** — `Bundler` struct had no signing capability
3. **No gas estimation** — gas limits not calculated on-chain
4. **No nonce management** — transaction nonce never fetched
5. **No transaction construction** — no EIP-1559 transaction building

**Impact:** Bundler accepted UserOps into mempool but never submitted them on-chain. `maybe_bundle()` appeared to succeed but sent nothing.

---

## Solution: Full Transaction Pipeline

### After (Fixed Implementation)

```rust
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

    // 1. Simulate handleOps with state override before sending
    self.simulate_handle_ops_with_override(&user_ops).await?;

    // 2. Estimate gas for the handleOps call
    let beneficiary = self.config.beneficiary();
    let gas_limit = self
        .signer
        .estimate_handle_ops_gas(&user_ops, beneficiary, self.config.entry_point_address)
        .await
        .map_err(|e| BundlerError::GasEstimationFailed(e.to_string()))?;

    // 3. Add a safety margin (20%) to the gas estimate
    let gas_limit = (gas_limit as f64 * 1.2) as u64;

    // 4. Get the bundler's current nonce
    let nonce = self
        .signer
        .get_nonce()
        .await
        .map_err(|e| BundlerError::NonceFetchFailed(e.to_string()))?;

    // 5. Build, sign, and send the transaction
    let tx_hash = self
        .signer
        .send_handle_ops(
            &user_ops,
            max_fee,
            priority_fee,
            gas_limit,
            nonce,
            beneficiary,
            self.config.entry_point_address,
        )
        .await
        .map_err(|e| BundlerError::TxSendFailed(e.to_string()))?;

    debug!(
        tx_hash = %tx_hash,
        ops = user_ops.len(),
        gas_limit = gas_limit,
        max_fee = %max_fee,
        priority_fee = %priority_fee,
        nonce = nonce,
        "handleOps transaction sent successfully"
    );

    Ok(tx_hash)
}
```

---

## New Module: `signer.rs` (466 lines)

### BundlerSigner Structure

```rust
pub struct BundlerSigner {
    key: SigningKey,          // secp256k1 private key
    pub address: Address,     // derived bundler address
    chain_id: u64,
    rpc_url: String,
}
```

### Key Methods

| Method | Purpose | RPC Call |
|--------|---------|----------|
| `new()` | Init from config private key | N/A |
| `get_nonce()` | Fetch bundler nonce | `eth_getTransactionCount` |
| `estimate_handle_ops_gas()` | Estimate gas for handleOps | `eth_estimateGas` |
| `send_handle_ops()` | Build, sign, send tx | `eth_sendRawTransaction` |

### Address Derivation

```rust
let pk = key.verifying_key().to_encoded_point(false); // uncompressed: 0x04 || x || y
let address = Address::from_slice(&keccak256(&pk.as_bytes()[1..])[12..]);
```

---

## Transaction Flow

1. **Validation** → UserOps validated with state override simulation
2. **Gas Estimation** → `eth_estimateGas` with proper handleOps calldata
3. **Nonce Fetch** → `eth_getTransactionCount("pending")`
4. **Transaction Build** → EIP-1559 with proper RLP encoding
5. **Signing** → secp256k1 ECDSA with k256 crate
6. **Broadcast** → `eth_sendRawTransaction`

### EIP-1559 Encoding

```
0x02 || rlp([
    chain_id,
    nonce,
    max_priority_fee_per_gas,
    max_fee_per_gas,
    gas_limit,
    to,           // EntryPoint address
    value,        // 0x80 (empty)
    data,         // handleOps calldata
    access_list,  // 0xc0 (empty list)
    r,
    s,
    v
])
```

### handleOps Calldata

- **Selector:** `0x9763761b` (ERC-4337 v0.7 `handleOps`)
- **Format:** PackedUserOperation with 14 fields (4 dynamic)
- **Encoding:** Proper ABI with offsets for dynamic fields

---

## Files Changed

| File | Lines Changed | Description |
|------|--------------|-------------|
| `packages/bundler/src/bundler.rs` | ~70 | Fixed `create_handle_ops_tx`, added signer field, new error variants |
| `packages/bundler/src/signer.rs` | 466 (new) | Complete transaction signing module |

---

## Error Handling

```rust
#[derive(Debug, thiserror::Error)]
pub enum BundlerError {
    // ... existing variants ...
    #[error("signer initialisation failed: {0}")]
    SignerInit(String),
    #[error("gas estimation failed: {0}")]
    GasEstimationFailed(String),
    #[error("nonce fetch failed: {0}")]
    NonceFetchFailed(String),
    #[error("transaction send failed: {0}")]
    TxSendFailed(String),
}
```

---

## Safety Measures

- **20% gas margin** added to estimated gas limit
- **State override simulation** before sending
- **Per-UserOp signature validation** in simulation
- **Gas limit cap** via `max_simulation_gas` config
- **Comprehensive error propagation** through `BundlerError`
- **No unsafe code** — all safe Rust

---

## API Compatibility

✅ **Backward Compatible** — all existing public APIs unchanged:
- `Bundler::new()` — same signature (internal signer initialization)
- `Bundler::submit_user_op()` — unchanged
- `Bundler::maybe_bundle()` — unchanged (now actually sends txs)
- `Bundler::estimate_gas()` — unchanged
- RPC methods — unchanged
- Error types — extended (non-breaking)

---

## Test Coverage

| Test | File | Status |
|------|------|--------|
| `bundler_maybe_bundle_empty_mempool` | `tests/mod.rs` | ✅ |
| `compute_user_op_hash_is_deterministic` | `tests/mod.rs` | ✅ |
| `integration_submit_and_bundle` | `tests/integration.rs` | ✅ |
| `integration_multiple_submits_bundle_all` | `tests/integration.rs` | ✅ |
| `integration_bundle_respects_max_ops` | `tests/integration.rs` | ✅ |
| `integration_mempool_status_tracking` | `tests/integration.rs` | ✅ |
| RPC routing tests | `tests/rpc.rs` | ✅ |

---

## Conclusion

The `create_handle_ops_tx` stub has been fully replaced with a production-ready implementation:

- ✅ Properly constructs EIP-1559 transactions
- ✅ Encodes ERC-4337 v0.7 handleOps calldata
- ✅ Signs transactions with bundler's private key
- ✅ Broadcasts via `eth_sendRawTransaction`
- ✅ Returns actual on-chain transaction hashes
- ✅ Includes gas estimation with safety margins
- ✅ Has comprehensive error handling
- ✅ Maintains API compatibility
- ✅ No unsafe code

The bundler is now functionally complete for on-chain transaction submission.
