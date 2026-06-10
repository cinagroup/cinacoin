# Cinacoin Benchmarks

Performance benchmark suites for the Cinacoin SDK, adapters, and UI components.

## Suites

| File | Description |
|------|-------------|
| `sdk-perf.ts` | Core SDK operations — cold/warm init, sign, send, connect |
| `adapter-perf.ts` | Per-adapter metrics for 14 chain adapters (init, connect, sign, switch) |
| `ui-perf.ts` | UI component render times — ConnectButton, ChainSelector, TokenList, etc. |

## Running

```bash
# Run all benchmarks from the project root
npx tsx scripts/run-benchmarks.ts

# Run a specific suite
npx tsx scripts/run-benchmarks.ts --suite sdk
npx tsx scripts/run-benchmarks.ts --suite adapter
npx tsx scripts/run-benchmarks.ts --suite ui

# CI mode (compare against baseline, fail on regression)
npx tsx scripts/run-benchmarks.ts --ci --baseline-file benchmarks/baseline.json
```

## Output

Results are written to `benchmarks/results/`:
- `latest.json` — machine-readable results
- `report.md` — human-readable Markdown report

## Baseline & Regression Detection

Save a baseline:
```bash
npx tsx scripts/run-benchmarks.ts --save-baseline benchmarks/baseline.json
```

In CI, the runner compares P50/P95/P99 against the baseline and fails if any metric regresses beyond the threshold (default 20%).

## Architecture

Each benchmark file exports a default object with:
- `name` — suite name
- `description` — what it measures
- `run()` — async function returning `BenchmarkSample[]`

The runner (`scripts/run-benchmarks.ts`) loads suites, executes them, aggregates results (P50/P95/P99/Avg/Min/Max), and generates reports.

## Notes

- Benchmarks use simulated crypto/network work for deterministic CI runs
- Real-world latency varies by network conditions and wallet provider
- UI benchmarks are CPU-only stubs (no real DOM); use browser DevTools for paint/layout metrics
- Run locally on representative hardware for meaningful absolute numbers
