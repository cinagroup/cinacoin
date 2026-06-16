# Smart Contract Security Audit Request

**Project:** CinaCoin Cross-Chain Contracts  
**Date:** 2026-06-16  
**Requested Auditors:** Trail of Bits, OpenZeppelin  
**Priority:** High — Pre-production security review

---

## 1. Scope

### Contracts to Audit

| Contract | File | Lines | Criticality |
|----------|------|-------|-------------|
| MultiSig | `packages/cross-chain-contracts/contracts/MultiSig.sol` | ~300 | **Critical** |
| HTLC | `packages/cross-chain-contracts/contracts/HTLC.sol` | ~260 | **Critical** |
| BridgeRouter | `packages/cross-chain-contracts/contracts/BridgeRouter.sol` | ~220 | **Critical** |
| TokenPaymaster | `packages/paymaster/contracts/TokenPaymaster.sol` | ~350 | **High** |
| VerifyingPaymaster | `packages/paymaster/contracts/VerifyingPaymaster.sol` | ~280 | **High** |
| UpgradeablePaymaster | `packages/paymaster/contracts/UpgradeablePaymaster.sol` | ~340 | **High** |
| OnChainUXPaymaster | `packages/paymaster/contracts/OnChainUXPaymaster.sol` | ~290 | **Medium** |

**Total:** ~2,040 lines of Solidity

---

## 2. Recent Security Fixes (Post-Internal Audit)

The following issues were identified and fixed during our internal Phase 0 security audit:

### MultiSig.sol
- **FIXED:** `addSigner`, `removeSigner`, `updateThreshold`, `updateTimeDelay` now require `onlySelf` modifier
- **Rationale:** These governance functions previously required only a single signer. Now they must go through the `propose → approve → execute` flow.

### HTLC.sol
- **FIXED:** `emergencyWithdraw()` now only extracts excess ETH (`balance - totalLockedETH`)
- **Rationale:** Previously allowed owner to withdraw all contract funds including locked user funds.
- **Implementation:** Added `totalLockedETH` state variable, incremented on `create()`, decremented on `claim()`/`refund()`.

### BridgeRouter.sol
- **FIXED:** `signatureThreshold` minimum enforced at 2 (via `MIN_THRESHOLD` constant)
- **Rationale:** Default threshold of 1 allowed single relayer compromise to drain bridge.
- **Implementation:** Constructor now requires relayers array + threshold >= 2. `setSignatureThreshold()` enforces minimum. `_removeRelayer()` prevents threshold from dropping below 2.

### TokenPaymaster.sol
- **FIXED:** Daily gas limit check uses configurable `maxGasEstimate` (default 300,000) instead of hardcoded 21,000
- **Rationale:** Hardcoded 21,000 was too low for Account Abstraction transactions (typically 100k-200k gas), allowing daily limit bypass via underestimation.
- **Implementation:** Added `setMaxGasEstimate()` owner function with bounds check (21k ≤ x ≤ 1M).

---

## 3. Audit Focus Areas

### 3.1 Access Control
- Verify all `onlySelf`, `onlyOwner`, `onlyRelayer` modifiers work correctly
- Check for privilege escalation vectors
- Validate multi-sig threshold enforcement

### 3.2 Reentrancy
- Check all external calls follow checks-effects-interactions pattern
- Verify `ReentrancyGuard` is applied to all state-changing functions
- Check for cross-function reentrancy

### 3.3 Integer Overflow/Underflow
- Verify SafeMath or Solidity 0.8+ overflow checks
- Check for division-by-zero edge cases
- Validate gas calculation arithmetic

### 3.4 Oracle Manipulation
- Review price oracle integration (if any)
- Check for stale price acceptance
- Validate TWAP or multi-source oracle usage

### 3.5 Cross-Chain Security
- Validate signature verification in `BridgeRouter`
- Check for replay attack vectors across chains
- Verify nonce management for cross-chain messages

### 3.6 Gas Optimization
- Identify gas-intensive patterns
- Suggest storage layout optimizations
- Check for unnecessary SLOAD/SSTORE operations

### 3.7 Upgrade Safety
- Verify proxy patterns (if any) follow EIP-1967
- Check for storage collision risks
- Validate initializer function protections

---

## 4. Deployment Environment

| Parameter | Value |
|-----------|-------|
| Solidity Version | 0.8.20+ |
| Target Chains | Ethereum, Polygon, Arbitrum, Optimism, Base |
| EntryPoint Version | v0.7 |
| Dependencies | OpenZeppelin 5.x, ERC-4337 |

---

## 5. Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Kickoff | 1 day | Scope confirmation, access granted |
| Initial Audit | 2-3 weeks | Preliminary findings report |
| Remediation | 1-2 weeks | Fixes applied by CinaCoin team |
| Re-audit | 1 week | Verification of fixes |
| Final Report | 1 week | Final audit report with certificate |

**Total estimated time:** 5-7 weeks

---

## 6. Contact

**Security Lead:** [To be assigned]  
**Engineering Lead:** [To be assigned]  
**Emergency Contact:** security@cinacoin.com

---

## 7. Next Steps

1. [ ] Select audit firm (Trail of Bits vs OpenZeppelin)
2. [ ] Sign NDA and engagement letter
3. [ ] Grant read access to repository
4. [ ] Schedule kickoff meeting
5. [ ] Provide testnet deployment addresses
6. [ ] Share internal audit report (this document)

---

## 8. Internal Audit Checklist (Pre-External)

- [x] FRP credentials removed from git
- [x] OAuth tokens encrypted at rest (AES-256-GCM)
- [x] WebSocket broadcast requires admin auth
- [x] Registration no longer bypasses 2FA
- [x] MultiSig governance requires proposal flow
- [x] HTLC emergencyWithdraw restricted to excess funds
- [x] BridgeRouter minimum threshold = 2
- [x] TokenPaymaster dynamic gas estimation
- [x] CI/CD security gates re-enabled (cargo audit, vitest coverage)
- [x] Redis password required (no default)
- [x] API Gateway error handler doesn't leak internal details
- [x] PBKDF2 enhanced to 600k effective iterations (OWASP compliant)

**All Phase 0-3 internal fixes completed. Ready for external audit.**
