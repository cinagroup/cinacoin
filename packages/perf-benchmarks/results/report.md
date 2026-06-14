# Performance Benchmark Results

Generated: 2026-06-03T16:21:09.220Z
Commit: 4cd1799
Node: v22.22.1
Platform: linux x64

## Baseline Comparison

⚠️ **1 regression(s) detected!**

| Suite | Group | Metric | Baseline | Current | Δ | Δ% |
|-------|-------|--------|---------:|--------:|--:|---:|
| core-sdk | P50 VS REOWN TARGET | 100.0ms | 34.7ms | -65279.2μs | -65.3% ✅ |
| react-provider | P50 VS REOWN TARGET | 150.0ms | 50.5ms | -99453.2μs | -66.3% ✅ |
| vue-composable | P50 VS REOWN TARGET | 150.0ms | 54.7ms | -95342.5μs | -63.6% ✅ |
| core-sdk-warm | P50 VS REOWN TARGET | 50.0ms | 8.8ms | -41207.3μs | -82.4% ✅ |
| pairing | P50 VS REOWN TARGET | 400.0ms | 30.4ms | -369636.3μs | -92.4% ✅ |
| session-proposal | P50 VS REOWN TARGET | 300.0ms | 36.6ms | -263416.7μs | -87.8% ✅ |
| session-approval | P50 VS REOWN TARGET | 300.0ms | 69.0ms | -231000.4μs | -77.0% ✅ |
| total-connect | P50 VS REOWN TARGET | 1.00s | 151.8ms | -848212.4μs | -84.8% ✅ |
| switch | P50 VS REOWN TARGET | 50.0ms | 13.2ms | -36764.9μs | -73.5% ✅ |
| rapid-switch | P50 VS REOWN TARGET | 80.0ms | 155.8ms | +75.8ms | +94.7% 🔴 |
| rpc-response | P50 VS REOWN TARGET | 200.0ms | 17.6ms | -182412.7μs | -91.2% ✅ |
| build | P50 VS REOWN TARGET | 50.0ms | 8.7ms | -41268.5μs | -82.5% ✅ |
| gas-estimate | P50 VS REOWN TARGET | 100.0ms | 81.5ms | -18528.5μs | -18.5% ✅ |
| sign | P50 VS REOWN TARGET | 50.0ms | 12.3ms | -37713.8μs | -75.4% ✅ |

## SDK Init

> Measures SDK initialization time across core-sdk, React provider, and Vue composable variants

Total suite time: **17.82s**

| Group | Count | Avg | Min | P50 | P95 | P99 | Max |
|-------|------:|----:|----:|----:|----:|----:|----:|
| core-sdk | 100 | 35.5ms | 21.1ms | 34.7ms | 47.9ms | 57.1ms | 58.2ms |
| core-sdk-warm | 100 | 9.5ms | 5.7ms | 8.8ms | 13.7ms | 16.4ms | 27.6ms |
| react-provider | 100 | 53.2ms | 37.3ms | 50.5ms | 70.0ms | 90.2ms | 125.5ms |
| react-provider-warm | 100 | 11.7ms | 8.7ms | 11.7ms | 13.9ms | 14.8ms | 19.4ms |
| vue-composable | 100 | 56.4ms | 40.3ms | 54.7ms | 71.5ms | 73.7ms | 106.5ms |
| vue-composable-warm | 100 | 11.8ms | 8.2ms | 11.3ms | 16.9ms | 19.4ms | 21.1ms |

## Cinacoin

> Measures Cinacoin v2 pairing, session proposal, and approval latency (target: <1s total)

Total suite time: **47.28s**

| Group | Count | Avg | Min | P50 | P95 | P99 | Max |
|-------|------:|----:|----:|----:|----:|----:|----:|
| pairing | 50 | 31.1ms | 19.9ms | 30.4ms | 39.9ms | 50.6ms | 53.1ms |
| pairing-good-network | 50 | 22.8ms | 15.9ms | 21.7ms | 27.6ms | 58.6ms | 77.6ms |
| pairing-poor-network | 50 | 60.2ms | 39.8ms | 57.6ms | 79.1ms | 104.6ms | 126.1ms |
| session-approval | 50 | 76.4ms | 43.1ms | 69.0ms | 137.4ms | 179.9ms | 213.9ms |
| session-approval-good-network | 50 | 44.8ms | 34.2ms | 41.9ms | 61.3ms | 69.6ms | 75.7ms |
| session-approval-poor-network | 50 | 95.6ms | 72.4ms | 86.3ms | 156.9ms | 184.4ms | 206.1ms |
| session-proposal | 50 | 38.2ms | 27.6ms | 36.6ms | 52.5ms | 54.6ms | 56.1ms |
| session-proposal-good-network | 50 | 32.3ms | 24.0ms | 30.9ms | 41.1ms | 62.6ms | 79.6ms |
| session-proposal-poor-network | 50 | 63.3ms | 42.3ms | 57.7ms | 90.0ms | 107.7ms | 118.3ms |
| total-connect | 50 | 159.1ms | 95.6ms | 151.8ms | 232.2ms | 249.4ms | 260.1ms |
| total-connect-good-network | 50 | 96.8ms | 78.1ms | 92.1ms | 123.1ms | 127.3ms | 127.3ms |
| total-connect-poor-network | 50 | 224.6ms | 152.0ms | 222.4ms | 294.3ms | 305.0ms | 307.6ms |

## Chain Switch

> Measures chain switching latency across 22 EVM chains with warm/cold comparison

Total suite time: **11.78s**

| Group | Count | Avg | Min | P50 | P95 | P99 | Max |
|-------|------:|----:|----:|----:|----:|----:|----:|
| cold-switch | 50 | 67.2ms | 43.0ms | 63.9ms | 95.5ms | 122.7ms | 142.3ms |
| rapid-switch | 20 | 159.3ms | 119.7ms | 155.8ms | 194.6ms | 210.5ms | 214.5ms |
| rpc-response | 220 | 20.6ms | 6.3ms | 17.6ms | 45.8ms | 54.2ms | 60.0ms |
| switch | 50 | 13.8ms | 9.9ms | 13.2ms | 17.7ms | 19.9ms | 21.7ms |

## Transaction Build

> Measures transaction build, gas estimation, and signing latency

Total suite time: **27.06s**

| Group | Count | Avg | Min | P50 | P95 | P99 | Max |
|-------|------:|----:|----:|----:|----:|----:|----:|
| build | 150 | 10.3ms | 3.3ms | 8.7ms | 18.4ms | 44.3ms | 69.5ms |
| gas-estimate | 150 | 87.6ms | 42.6ms | 81.5ms | 147.0ms | 160.7ms | 193.7ms |
| pipeline | 90 | 114.9ms | 62.5ms | 107.3ms | 172.9ms | 215.8ms | 245.1ms |
| sign | 150 | 13.5ms | 8.7ms | 12.3ms | 18.4ms | 45.0ms | 54.7ms |
