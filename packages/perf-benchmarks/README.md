# @cinacoin/perf-benchmarks

Performance benchmark suite for Cinacoin SDK. Measures P50/P95/P99 latency for critical operations with regression guard.

## Benchmarks

| Benchmark | Metric | Target |
|-----------|--------|--------|
| SDK Init | P50 | < 100ms |
| Cinacoin Connect | Total | < 1s |
| Chain Switch | P50 | < 50ms |
| Transaction Build | P50 | < 200ms |

## Running

```bash
# Run all benchmarks
pnpm bench

# Run individual benchmarks
pnpm bench:init
pnpm bench:wc
pnpm bench:chain
pnpm bench:tx

# CI mode (fails if regression > 20%)
pnpm bench:ci
```

## Output

Results are written to `results/` directory:
- `results/latest.json` — latest run results
- `results/baseline.json` — saved baseline for regression checks
- `results/report.md` — human-readable Markdown report
