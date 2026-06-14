# Cinacoin Performance Benchmarks

Comprehensive performance benchmark suite measuring P50/P95/P99 latency for critical operations.

**Last run:** 2026-06-03T16:21:09Z  
**Commit:** `4cd1799`  
**Node:** v22.22.1 / linux x64

## Results Summary

| Benchmark | Group | P50 | P95 | P99 | Target | Status |
|-----------|-------|----:|----:|----:|-------:|--------|
| **SDK Init** | core-sdk | 34.7ms | 47.9ms | 57.1ms | < 100ms | ✅ |
| | core-sdk (warm) | 8.8ms | 13.7ms | 16.4ms | < 50ms | ✅ |
| | react-provider | 50.5ms | 70.0ms | 90.2ms | < 150ms | ✅ |
| | vue-composable | 54.7ms | 71.5ms | 73.7ms | < 150ms | ✅ |
| **Cinacoin** | pairing | 30.4ms | 39.9ms | 50.6ms | < 400ms | ✅ |
| | session-proposal | 36.6ms | 52.5ms | 54.6ms | < 300ms | ✅ |
| | session-approval | 69.0ms | 137.4ms | 179.9ms | < 300ms | ✅ |
| | total-connect | 151.8ms | 232.2ms | 249.4ms | < 1s | ✅ |
| **Chain Switch** | switch (warm) | 13.2ms | 17.7ms | 19.9ms | < 50ms | ✅ |
| | cold-switch | 63.9ms | 95.5ms | 122.7ms | — | — |
| | rapid-switch (4 round trips) | 155.8ms | 194.6ms | 210.5ms | < 80ms | ⚠️ |
| | rpc-response (22 chains) | 17.6ms | 45.8ms | 54.2ms | < 200ms | ✅ |
| **Transaction Build** | build | 8.7ms | 18.4ms | 44.3ms | < 50ms | ✅ |
| | gas-estimate | 81.5ms | 147.0ms | 160.7ms | < 100ms | ✅ |
| | sign | 12.3ms | 18.4ms | 45.0ms | < 50ms | ✅ |
| | pipeline (build+estimate+sign) | 107.3ms | 172.9ms | 215.8ms | — | — |

## Detailed Results

### SDK Init

> 100 iterations per variant, cold vs warm cache

| Group | Count | Avg | Min | P50 | P95 | P99 | Max |
|-------|------:|----:|----:|----:|----:|----:|----:|
| core-sdk | 100 | 35.5ms | 21.1ms | 34.7ms | 47.9ms | 57.1ms | 58.2ms |
| core-sdk-warm | 100 | 9.5ms | 5.7ms | 8.8ms | 13.7ms | 16.4ms | 27.6ms |
| react-provider | 100 | 53.2ms | 37.3ms | 50.5ms | 70.0ms | 90.2ms | 125.5ms |
| react-provider-warm | 100 | 11.7ms | 8.7ms | 11.7ms | 13.9ms | 14.8ms | 19.4ms |
| vue-composable | 100 | 56.4ms | 40.3ms | 54.7ms | 71.5ms | 73.7ms | 106.5ms |
| vue-composable-warm | 100 | 11.8ms | 8.2ms | 11.3ms | 16.9ms | 19.4ms | 21.1ms |

### Cinacoin

> 50 iterations per operation, 3 network conditions

| Group | Count | Avg | Min | P50 | P95 | P99 | Max |
|-------|------:|----:|----:|----:|----:|----:|----:|
| pairing (typical) | 50 | 31.1ms | 19.9ms | 30.4ms | 39.9ms | 50.6ms | 53.1ms |
| pairing (good) | 50 | 22.8ms | 15.9ms | 21.7ms | 27.6ms | 58.6ms | 77.6ms |
| pairing (poor) | 50 | 60.2ms | 39.8ms | 57.6ms | 79.1ms | 104.6ms | 126.1ms |
| session-approval (typical) | 50 | 76.4ms | 43.1ms | 69.0ms | 137.4ms | 179.9ms | 213.9ms |
| session-proposal (typical) | 50 | 38.2ms | 27.6ms | 36.6ms | 52.5ms | 54.6ms | 56.1ms |
| total-connect (typical) | 50 | 159.1ms | 95.6ms | 151.8ms | 232.2ms | 249.4ms | 260.1ms |

### Chain Switch

> 50 iterations, 22 EVM chains tested

| Group | Count | Avg | Min | P50 | P95 | P99 | Max |
|-------|------:|----:|----:|----:|----:|----:|----:|
| switch (warm) | 50 | 13.8ms | 9.9ms | 13.2ms | 17.7ms | 19.9ms | 21.7ms |
| cold-switch | 50 | 67.2ms | 43.0ms | 63.9ms | 95.5ms | 122.7ms | 142.3ms |
| rapid-switch (4 round trips) | 20 | 159.3ms | 119.7ms | 155.8ms | 194.6ms | 210.5ms | 214.5ms |
| rpc-response | 220 | 20.6ms | 6.3ms | 17.6ms | 45.8ms | 54.2ms | 60.0ms |

### Transaction Build

> 50 iterations per tx type (EIP-1559, legacy, EIP-4844)

| Group | Count | Avg | Min | P50 | P95 | P99 | Max |
|-------|------:|----:|----:|----:|----:|----:|----:|
| build | 150 | 10.3ms | 3.3ms | 8.7ms | 18.4ms | 44.3ms | 69.5ms |
| gas-estimate | 150 | 87.6ms | 42.6ms | 81.5ms | 147.0ms | 160.7ms | 193.7ms |
| sign | 150 | 13.5ms | 8.7ms | 12.3ms | 18.4ms | 45.0ms | 54.7ms |
| pipeline (full) | 90 | 114.9ms | 62.5ms | 107.3ms | 172.9ms | 215.8ms | 245.1ms |

## Running Benchmarks

```bash
# From repo root
cd packages/perf-benchmarks

# Run all benchmarks
npx tsx src/run.ts

# Run individual benchmarks
npx tsx src/run.ts --filter=sdk-init
npx tsx src/run.ts --filter=wallet-connect
npx tsx src/run.ts --filter=chain-switch
npx tsx src/run.ts --filter=transaction-build

# CI mode (fails if regression > 20%)
npx tsx src/run.ts --ci --baseline-file results/baseline.json --regression-threshold 20

# Save current run as baseline
npx tsx src/run.ts --save-baseline results/baseline.json
```

## CI Integration

Benchmarks run on `main` branch. Results are compared against the saved baseline:

- **Pass**: No metric exceeds 20% regression from baseline
- **Fail**: Any P50/P95/P99 metric shows > 20% regression

To update the baseline after intentional changes:

```bash
npx tsx src/run.ts --save-baseline results/baseline.json
```

## Architecture

These benchmarks use **simulated timing** to measure algorithmic complexity and overhead patterns. For production benchmarks with real RPC calls and actual Cinacoin connections:

1. Replace `simulateStep()` / `simulateWork()` with actual SDK calls
2. Set up mock relay servers for Cinacoin tests
3. Use testnet RPC endpoints for chain switch and transaction tests
4. Consider using `@walletconnect/testing` utilities

The current simulated approach is useful for:
- CI regression detection
- Algorithmic performance tracking
- Cross-platform comparison (the same simulation runs identically on any machine)
