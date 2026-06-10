# k6 Load Tests for Cinacoin

Performance and load testing suite using [k6](https://k6.io/).

## Prerequisites

```bash
# Install k6
brew install k6  # macOS
# or
sudo apt install k6  # Linux
# or download from https://k6.io/docs/getting-started/installation/
```

## Test Scripts

### 1. API Endpoints (`api-endpoints.js`)
Tests core API endpoint performance under load.

```bash
k6 run load-tests/api-endpoints.js
```

**Scenarios:**
- Ramp-up test: 0→100 VUs over 3 minutes
- Spike test: Up to 200 requests/sec

**Metrics:**
- Response time (p95 < 500ms, p99 < 1000ms)
- Error rate (< 1%)
- Throughput

### 2. WebSocket Connections (`websocket.js`)
Tests concurrent WebSocket connection handling.

```bash
k6 run load-tests/websocket.js
```

**Scenarios:**
- Sustained: 50 concurrent connections for 2 minutes
- Ramp: 0→200 connections over 3 minutes

**Metrics:**
- Connection success rate (> 99%)
- Message latency (p95 < 200ms)
- Connection errors (< 1%)

### 3. Authentication Throughput (`auth-throughput.js`)
Tests authentication endpoint performance.

```bash
k6 run load-tests/auth-throughput.js
```

**Scenarios:**
- Login burst: 100 VUs × 10 iterations
- Sustained auth: 50 requests/sec for 2 minutes

**Metrics:**
- Login latency (p95 < 300ms)
- Token refresh success rate
- Auth errors (< 1%)

### 4. Database Queries (`db-queries.js`)
Tests database query performance under load.

```bash
k6 run load-tests/db-queries.js
```

**Scenarios:**
- Read-heavy: 100 queries/sec for 3 minutes
- Write-heavy: 20 writes/sec for 2 minutes

**Metrics:**
- Query latency (p95 < 200ms)
- Cache hit rate (> 70%)
- Query errors (< 1%)

## Environment Variables

```bash
export BASE_URL=http://localhost:8787
export WS_URL=ws://localhost:8787/ws
export AUTH_TOKEN=Bearer your-test-token
```

## Running Tests

### Single test
```bash
k6 run load-tests/api-endpoints.js
```

### With environment variables
```bash
BASE_URL=https://api.cinacoin.io k6 run load-tests/api-endpoints.js
```

### With custom duration
```bash
k6 run --duration 5m load-tests/api-endpoints.js
```

### With custom VUs
```bash
k6 run --vus 200 --duration 3m load-tests/api-endpoints.js
```

### Output to multiple formats
```bash
k6 run --out json=results.json --out influxdb=http://localhost:8086/k6 load-tests/api-endpoints.js
```

## CI Integration

### GitHub Actions
```yaml
- name: Run Load Tests
  run: |
    k6 run --out json=results.json load-tests/api-endpoints.js
    
- name: Check Thresholds
  run: |
    # k6 automatically fails if thresholds are exceeded
```

### Custom thresholds
```bash
k6 run --thresholds 'http_req_duration:p(95)<300' load-tests/api-endpoints.js
```

## Interpreting Results

### Key Metrics

- **http_req_duration**: Total request time
- **http_req_failed**: Failed request rate
- **iterations**: Number of test iterations
- **vus**: Active virtual users
- **checks**: Assertion pass rate

### Thresholds

Tests automatically fail if thresholds are exceeded:
- Response time p95/p99
- Error rate
- Cache hit rate

### Reports

Results are saved to:
- `load-tests/results/*.json` - Raw JSON data
- `stdout` - Human-readable summary

## Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| API p95 latency | < 500ms | < 1000ms |
| API p99 latency | < 1000ms | < 2000ms |
| Error rate | < 1% | < 5% |
| WebSocket latency | < 200ms | < 500ms |
| Cache hit rate | > 70% | > 50% |
| Auth latency | < 300ms | < 800ms |

## Troubleshooting

### Connection refused
```bash
# Ensure services are running
npm run dev
# or
docker-compose up
```

### High error rate
- Check server logs
- Verify database connections
- Check rate limiting configuration

### Slow response times
- Check database query performance
- Verify cache is working
- Check network latency

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 HTTP API](https://k6.io/docs/javascript-api/k6-http/)
- [k6 WebSocket API](https://k6.io/docs/javascript-api/k6-ws/)
- [Performance testing best practices](https://k6.io/docs/testing-guidelines/)
