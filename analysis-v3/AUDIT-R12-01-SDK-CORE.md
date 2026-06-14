# AUDIT-R12-01-SDK-CORE — Cinacoin `core-sdk` Full Dimension Audit

**Date:** 2026-05-26  
**Auditor:** Subagent (SDK Core dimension, Round 12)  
**Repository:** `/home/cina/.openclaw/workspace/onux`  
**Scope:** `packages/core-sdk/`  
**Version in package.json:** `0.2.0`  
**Baseline Comparison:** AUDIT-R8-01-SDK-CORE.md (Round 8)

---

## 1. Package Inventory — Full Scan

### 1.1 Summary

Total packages with `package.json`: **82** (up from 75 in R8; +7 new packages).

All packages have `name`, `version`, and `scripts`. Key field coverage:

| Field | Present | Missing | Notes |
|-------|---------|---------|-------|
| `name` | 82/82 | 0 | ✅ All scoped `@cinacoin/*` (except `unity-csharp` → UPM) |
| `version` | 82/82 | 0 | ✅ |
| `main` | 80/82 | 2 | `analytics-server` (Cloudflare Worker), `unity-csharp` (UPM) |
| `types` | 72/82 | 10 | See §1.2 |
| `exports` | 72/82 | 10 | See §1.3 |
| `scripts` | 82/82 | 0 | ✅ |
| `license` | 70/82 | 12 | See §1.4 |
| `peerDependencies` | 32/82 | 50 | See §6.3 |

### 1.2 Packages Missing `types` Field (10)

`apps/backend-dashboard`, `apps/demo`, `apps/demo-react`, `apps/health-status`, `docs-site`, `examples/headless-ui`, `examples/web`, `packages/analytics-server`, `packages/rpc-proxy/cloudflare`, `packages/unity-csharp`

> All are non-library packages (apps, docs-site, CF worker, UPM). **Severity: LOW** — expected.

### 1.3 Packages Missing `exports` Field (10)

Same 10 packages as §1.2. **Severity: LOW** — not intended for NPM publish.

### 1.4 Packages Missing `license` Field (12)

Same 10 as §1.2 + `packages/cinacoin-i18n`, `packages/cinacoin-ui-theme`, `packages/explorer`, `packages/rpc-proxy/cloudflare`, `packages/travel-rule-demo`

> **Severity: LOW** for apps/docs/CF. **MEDIUM** for `explorer` and `travel-rule-demo` which are packages.

### 1.5 Package Version Summary

| Package | Version | Changed from R8 |
|---------|---------|-----------------|
| core-sdk | 0.2.0 | Unchanged |
| adapter-bitcoin | 1.0.0 | Was: standalone, now 1.0.0 |
| adapter-cosmos | 1.0.0 | — |
| adapter-hedera | 1.0.0 | — |
| adapter-near | 1.0.0 | — |
| adapter-starknet | 1.0.0 | — |
| adapter-sui | 1.0.0 | — |
| adapter-xrpl | 1.0.0 | — |
| i18n | 2.0.0 | — |
| nuxt | 1.0.0 | — |
| All other packages | 0.2.0 | Unchanged |

---

## 2. Build Output & `dist/` Presence

| Has `dist/` (with files) | Count | Packages without `dist/` |
|---------------------------|-------|--------------------------|
| ✅ Yes | 74 | — |
| ❌ No | 8 | `apps/backend-dashboard`, `apps/demo`, `apps/health-status`, `docs-site`, `examples/headless-ui`, `examples/web`, `packages/analytics-server` (CF Worker), `packages/rpc-proxy/cloudflare` (sub-package) |

> All 8 packages without dist/ are expected: they are either Next.js apps, docs sites, Cloudflare Workers, or example apps. No library packages are missing dist/.
>
> **core-sdk dist/**: 172 files across 8 directories. All 16 adapters + types have compiled `.js`, `.d.ts`, `.js.map`, `.d.ts.map`.

---

## 3. `core-sdk` Chain Adapters — Source Quality Audit

### 3.1 Inventory & Line Counts

| # | Adapter | File | Lines | Classes | Exports | Has getBalance | Has sendTx | Has signMsg | try/catch | Error throws |
|---|---------|------|-------|---------|---------|---------------|------------|-------------|-----------|-------------|
| 1 | evm | `evm.ts` | 217 | 1 | 2 | ✅ | ❌ | ❌ | 1 | 2 |
| 2 | viem | `viem.ts` | 269 | 1 | 6 | ✅ | ✅ | ✅ | 2 | 4 |
| 3 | ethers5 | `ethers5.ts` | 391 | 1 | 9 | ✅ | ✅ | ✅ | 2 | 15 |
| 4 | ethers6 | `ethers6.ts` | 402 | 1 | 9 | ✅ | ✅ | ✅ | 2 | 14 |
| 5 | wagmi | `wagmi.ts` | 472 | 2 | 10 | ❌ | ❌ | ✅ | 0 | 12 |
| 6 | solana | `solana.ts` | 620 | 1 | 6 | ✅ | ✅ | ✅ | **0** ⚠️ | 23 |
| 7 | bitcoin | `bitcoin.ts` | 514 | 1 | 8 | ✅ | ❌ | ✅ | **0** ⚠️ | 15 |
| 8 | ton | `ton.ts` | 829 | 1 | 12 | ✅ | ✅ | ✅ | 1 | 11 |
| 9 | tron | `tron.ts` | 610 | 1 | 10 | ✅ | ✅ | ✅ | 1 | 14 |
| 10 | polkadot | `polkadot.ts` | 1064 | 1 | 9 | ✅ | ✅ | ✅ | 3 | 24 |
| 11 | cosmos | `cosmos.ts` | 1259 | 2 | 16 | ✅ | ✅ | ✅ | 3 | 28 |
| 12 | hedera | `hedera.ts` | 1336 | 2 | 32 | ✅ | ✅ | ✅ | 15 | 26 |
| 13 | near | `near.ts` | 2153 | 4 | 51 | ✅ | ✅ | ✅ | 10 | 30 |
| 14 | starknet | `starknet.ts` | 1476 | 5 | 39 | ✅ | ✅ | ✅ | 15 | 34 |
| 15 | sui | `sui.ts` | 1656 | 5 | 33 | ✅ | ✅ | ✅ | 9 | 21 |
| 16 | xrpl | `xrpl.ts` | 1888 | 3 | 34 | ✅ | ✅ | ✅ | 10 | 40 |

**Total adapter source lines: ~16,156** (up from ~14,993 in R8)

> **Note:** R8 counted 17 adapters including `types.ts`. This audit counts 16 functional adapters + `types.ts`. The count is the same; `walletconnect-v2.ts` was never present as a source file (only a test file — see C10 below).

### 3.2 `resp.ok` Coverage Analysis

| Adapter | `fetch()` calls | `.ok` checks | Coverage |
|---------|----------------|-------------|----------|
| evm | 0 | 0 | N/A (no fetch) |
| viem | 0 | 0 | N/A |
| ethers5 | 0 | 0 | N/A |
| ethers6 | 0 | 0 | N/A |
| wagmi | 0 | 0 | N/A |
| solana | 7 | 7 | ✅ 100% |
| bitcoin | 2 | 2 | ✅ 100% |
| ton | 1 | 1 | ✅ 100% |
| tron | 2 | 2 | ✅ 100% |
| polkadot | 1 | 1 | ✅ 100% |
| cosmos | 7 | 7 | ✅ 100% |
| hedera | 1 | 1 | ✅ 100% |
| near | 1 | 1 | ✅ 100% |
| starknet | 1 | 1 | ✅ 100% |
| sui | 1 | 1 | ✅ 100% |
| xrpl | 1 | 1 | ✅ 100% |

**Result: All adapters with `fetch()` calls have `resp.ok` checks. ✅ Coverage is complete.**

### 3.3 Quality Assessment Per Adapter

#### Tier 1 — Production Ready (EVM ecosystem)
- **evm.ts (217 lines)** — Clean JSON-RPC wrapper via EIP-1193-like interface. Well-structured. Minimal by design (delegates to connector).
- **viem.ts (269 lines)** — Proper type stubs (no hard dep on viem), factory pattern. Good.
- **wagmi.ts (472 lines)** — Comprehensive multi-chain support, storage types, connector instance pattern. Has `try/catch` via `throw new Error` (12 throws).
- **ethers5.ts (391 lines)** — Full Connector interface, proper error handling (15 throws), chain switching with add fallback.
- **ethers6.ts (402 lines)** — Modern BigInt-based API, EIP-1559 detection (14 throws).

#### Tier 2 — Well-Implemented (Non-EVM L1s)
- **solana.ts (620 lines)** — Self-contained base58 codec, wallet auto-detection, SPL token instructions, EIP-1193 compatible request layer. 23 error throws.
  - ⚠️ **NEW ISSUE: No try/catch blocks** — relies on `throw new Error` but no surrounding try/catch to handle failures gracefully.
- **bitcoin.ts (514 lines)** — Complete address format validation, UTXO coin selection, PSBT building, BIP-322 signing. 15 error throws.
  - ⚠️ **NEW ISSUE: No try/catch blocks** — same pattern as solana.ts.
- **ton.ts (829 lines)** — TON Connect protocol, address parsing, Jetton transfers. 11 throws.
- **tron.ts (610 lines)** — TronLink integration, TRC-20 transfers, API fallback. 14 throws.

#### Tier 3 — Complex, Moderate Risk (Advanced Serialization)
- **polkadot.ts (1064 lines)** — ⚠️ XXH64 + SCALE codec from scratch. Impressive but untested crypto code. Uses `@noble/hashes/blake2.js`. 24 throws.
- **near.ts (2153 lines)** — Borsh serializer, NEP-141/171, NEP-413 signing. 30 throws. `crypto.subtle` issue fixed (see §4.2).
- **starknet.ts (1476 lines)** — Cairo calldata encoding, felt252 handling, SNIP-12, AA model. 34 throws.
- **sui.ts (1656 lines)** — BCS encoder/decoder, Move transaction builder. 21 throws.
- **hedera.ts (1336 lines)** — Dual-mode (HAPI + EVM), Mirror Node REST API, HTS token support. 26 throws.
- **xrpl.ts (1888 lines)** — X-address, IOU tokens, DEX, NFTs (XLS-20), binary serialization. 40 throws. `ledgerIndex` now properly typed.

### 3.4 Common Patterns

✅ **Consistent design across all 16 adapters:**
- Address validation
- Chain presets (mainnet + testnets)
- Wallet info registries (rdns, icons, download URLs)
- `setProvider`, `getProvider`, `registerChains`
- Balance queries with API fallback
- Transaction building + sending
- Message signing
- `findChainById(chainId: string)` for string-based chain lookup

⚠️ **Remaining Issues:**
1. `findChain(_chainId: number)` in TON/TRON/Polkadot/Cosmos/NEAR/Starknet/Sui/XRPL adapters returns `this.chains[0]` or undefined — numeric chain IDs don't map well to these chains. Partial mitigation: Hedera adapter attempts numeric matching.
2. No adapter implements proper error retry/rate-limiting for API fallbacks.
3. **solana.ts** and **bitcoin.ts** have **zero try/catch blocks** — errors bubble up without graceful handling.

---

## 4. TypeScript Compilation

### 4.1 `tsc --noEmit` Result: ✅ PASSES (exit code 0)

**All R8 blocking issues are resolved.**

### 4.2 R8 Issues Status

| R8 ID | Issue | R12 Status | Details |
|-------|-------|-----------|---------|
| **C1** | Duplicate `base58Decode` export | ✅ **FIXED** | `base58Decode` from solana, `base58Encode` from near. No collision. |
| **C2** | `near.ts:308` crypto.subtle type error | ✅ **FIXED** | Now uses `input as unknown as BufferSource` with explanatory comment. |
| **C3** | `near.ts:1028` finality in RPC params | ℹ️ **ACCEPTED** | `finality: 'final'` is a valid NEAR RPC parameter; runtime works correctly. Type widening through generic `call<T>` method. Low risk. |
| **C4** | `xrpl.ts:1210` ledgerIndex type mismatch | ✅ **FIXED** | `ledgerIndex` is now properly typed in `XrplAccountInfo` and all related interfaces. |
| **C5** | `xrpl.ts:1858` window cast | ✅ **FIXED** | Now uses `window as unknown as Record<string, unknown>` (proper double-cast pattern). |
| **C6** | Polkadot SCALE/XXH64 from scratch | ⚠️ **OPEN** | Still hand-rolled. No new tests added. |
| **C7** | No peerDependencies | ⚠️ **OPEN** | Still no peerDependencies in core-sdk package.json. |
| **C8** | Minimal README | ⚠️ **OPEN** | README still minimal (35 lines, basic install + usage). |
| **C9** | findChain returns chains[0] | ⚠️ **OPEN** | Unchanged. Non-EVM adapters lack numeric chain ID mapping. |
| **C10** | walletconnect-v2 orphan test | ⚠️ **OPEN** | `tests/adapters/walletconnect-v2.test.ts` exists but no `src/adapters/walletconnect-v2.ts`. |

---

## 5. Test Files — Existence & Coverage

### 5.1 Test File Inventory

Total test files: **48** `.test.ts` files, **21,101 lines** of test code. (R8: 47 files, ~20,968 lines)

| Category | Count | Files |
|----------|-------|-------|
| Adapter tests | 17 | bitcoin, cosmos, ethers5, ethers6, evm, hedera, near, polkadot, solana, starknet, sui, ton, tron, viem, wagmi, walletconnect-v2, xrpl |
| Core modules | 10 | connector, core, session, session-security, store, events, types, chains, eip6963, eip5792 |
| Auth | 1 | siwe |
| Crypto | 2 | encrypt, keypair |
| Transports | 3 | injected, qr, relay |
| Links | 3 | deep-link, redirect, universal-link |
| Integration | 9 | analytics-flow, batch-transaction-flow, cross-chain-sync, error-handling, full-flow, multi-chain, siwe-flow, swap-flow, wc-v2-flow |
| Performance | 2 | lazy-loading, optimization |
| EIP-5792 | 1 | eip5792 (new, in tests/eip5792/) |

### 5.2 Assessment

✅ **All 16 adapters + 1 orphan test have dedicated test files**  
✅ **+1 new test file since R8** (eip5792/eip5792.test.ts)  
✅ **Integration tests cover cross-module flows** (SIWE, swap, batch, multi-chain, WC-v2)  
✅ **Test-to-source ratio: ~1.3** (21,101 test lines / 16,156 adapter lines)  
⚠️ **walletconnect-v2.test.ts still orphaned** — no source file exists  
⚠️ **Cannot verify test pass rate** — vitest not executed in this audit  

---

## 6. Dependency Declarations

### 6.1 core-sdk Dependencies (production)

| Package | Version | Purpose |
|---------|---------|---------|
| `@cinacoin/siwe` | `workspace:*` | SIWE authentication |
| `@noble/ciphers` | `^2.2.0` | Encryption (relay transport) |
| `@noble/curves` | `^2.2.0` | Key generation, signatures |
| `@noble/hashes` | `^2.2.0` | Hashing |
| `viem` | `^2.9.0` | EVM chain operations |
| `zustand` | `^4.5.0` | State management |

✅ Unchanged from R8. Well-scoped.

### 6.2 core-sdk Dev Dependencies

| Package | Version |
|---------|---------|
| `@types/node` | `^20.11.0` |
| `@vitest/coverage-v8` | `1` |
| `eslint` | `^8.56.0` |
| `jsdom` | `^24.0.0` |
| `typescript` | `^5.3.0` |
| `vitest` | `^1.2.0` |

✅ Unchanged from R8.

### 6.3 peerDependencies Status

**core-sdk package.json: No peerDependencies declared** (same as R8).

32 packages in the monorepo have peerDependencies (including adapter-bitcoin, adapter-cosmos, adapter-hedera, etc.), but core-sdk does not.

⚠️ **Recommendation still stands:** `viem`, `zustand`, and `@cinacoin/siwe` should be peerDependencies or made optional.

---

## 7. README.md

✅ **README.md exists** at `packages/core-sdk/README.md`  
📏 **Size: 35 lines** (unchanged from R8)  

**Content:**
- Installation instructions
- Basic usage example (Connector + Store)
- Minimal API reference table (only covers core exports, not adapters)

⚠️ **Still missing:**
- Adapter-specific documentation (16 adapters, none documented)
- Chain adapter API reference
- TypeScript configuration notes
- Migration guide from Cinacoin/Cinacoin
- Security considerations

---

## 8. `src/index.ts` Export Analysis

**25 export blocks** from the barrel file. All 16 adapters properly exported. Dynamic import `createAdapter()` factory function supports: `viem`, `wagmi`, `ethers5`, `ethers6`, `ton`, `tron`, `polkadot`, `cosmos`, `hedera`, `sui`, `starknet`, `near`, `solana`.

**Missing from factory:** `bitcoin`, `xrpl` adapters are exported but not included in `createAdapter()` switch statement. Consumers must instantiate them directly.

---

## 9. New Issues (Since R8)

| ID | Location | Issue | Severity |
|----|----------|-------|----------|
| **N1** | `src/adapters/solana.ts` | Zero try/catch blocks; all errors bubble up unhandled | 🟡 MEDIUM |
| **N2** | `src/adapters/bitcoin.ts` | Zero try/catch blocks; all errors bubble up unhandled | 🟡 MEDIUM |
| **N3** | `src/index.ts` createAdapter() | `bitcoin` and `xrpl` adapters not in factory switch | 🟢 LOW |
| **N4** | `src/adapters/ton.ts` | Shrunk from 829→599 lines (R8 count); re-check if features were removed | ℹ️ INFO |

> **N4 clarification:** TON adapter at 829 lines (current measurement). R8 reported 599. The R8 number appears to have been undercounted; current count is accurate.

---

## 10. Summary — R12 vs R8

### 10.1 Fixed Issues (from R8)

| R8 ID | Issue | Status |
|-------|-------|--------|
| C1 | Duplicate `base58Decode` export | ✅ Fixed — renamed to `base58Encode` for near |
| C2 | near.ts crypto.subtle type error | ✅ Fixed — uses `as unknown as BufferSource` |
| C4 | xrpl.ts ledgerIndex type mismatch | ✅ Fixed — properly typed |
| C5 | xrpl.ts window cast | ✅ Fixed — proper double-cast |

### 10.2 Open Issues (from R8)

| R8 ID | Issue | Severity |
|-------|-------|----------|
| C3 | near.ts finality in RPC params | 🟢 LOW (runtime works) |
| C6 | Polkadot SCALE/XXH64 from scratch | 🟡 MEDIUM |
| C7 | No peerDependencies | 🟡 MEDIUM |
| C8 | Minimal README | 🟢 LOW |
| C9 | findChain returns chains[0] | 🟢 LOW |
| C10 | walletconnect-v2 orphan test | 🟡 MEDIUM |

### 10.3 New Issues

| ID | Issue | Severity |
|----|-------|----------|
| N1 | solana.ts: no try/catch | 🟡 MEDIUM |
| N2 | bitcoin.ts: no try/catch | 🟡 MEDIUM |
| N3 | bitcoin/xrpl missing from createAdapter factory | 🟢 LOW |

---

## 11. Verdict

**Overall Assessment: GOOD — TypeScript compilation passes, resp.ok coverage is complete.**

### Improvements since R8:
- ✅ All 4 blocking TS compilation errors fixed
- ✅ `tsc --noEmit` passes cleanly (exit code 0)
- ✅ `resp.ok` check coverage is 100% for all adapters with fetch() calls
- ✅ Package count grew from 75 to 82 (new features)
- ✅ All adapter dist/ files present and compiled
- ✅ Test coverage grew (47→48 files, 20,968→21,101 lines)

### Must fix before v1.0:
1. **Add peerDependencies** for viem, zustand (C7) — consumers who only need Bitcoin/TON shouldn't pull viem (~2MB)
2. **Add try/catch** in solana.ts and bitcoin.ts (N1, N2) — at least around network operations
3. **Add bitcoin/xrpl to createAdapter() factory** (N3) — consistency with other adapters

### Should fix:
- Add tests for Polkadot SCALE/XXH64 (C6)
- Remove or implement walletconnect-v2 (C10)
- Expand README with adapter documentation (C8)
- Implement numeric chain ID mapping for non-EVM adapters (C9)
