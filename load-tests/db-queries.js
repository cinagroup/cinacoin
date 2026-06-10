/**
 * k6 Load Test - Database Query Performance
 *
 * Tests database query performance under load.
 * Run: k6 run load-tests/db-queries.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const queryErrors = new Rate('query_errors');
const queryLatency = new Trend('query_latency');
const cacheHits = new Rate('cache_hits');
const dbQueries = new Counter('db_queries');

export const options = {
  scenarios: {
    // Read-heavy workload
    read_heavy: {
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1s',
      duration: '3m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
    // Write-heavy workload
    write_heavy: {
      executor: 'constant-arrival-rate',
      rate: 20,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 20,
      maxVUs: 100,
    },
  },
  thresholds: {
    query_errors: ['rate<0.01'],
    query_latency: ['p(95)<200', 'p(99)<500'],
    cache_hits: ['rate>0.7'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8787';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'Bearer test-token';

// Test addresses
const testAddresses = [
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
  '0x1234567890123456789012345678901234567890',
  '0xabcdef0123456789abcdef0123456789abcdef01',
  '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
];

export default function () {
  const address = testAddresses[Math.floor(Math.random() * testAddresses.length)];
  const chainId = [1, 137, 42161, 10, 8453][Math.floor(Math.random() * 5)];

  group('Read Queries', () => {
    // Balance query
    group('Balance Query', () => {
      const res = http.get(
        `${BASE_URL}/api/v1/balance/${address}?chainId=${chainId}`,
        {
          headers: { Authorization: AUTH_TOKEN },
          tags: { name: 'GET /balance' },
        }
      );

      const isCached = res.headers['X-Cache'] === 'HIT';
      cacheHits.add(isCached ? 1 : 0);
      dbQueries.add(1);

      check(res, {
        'balance query succeeds': (r) => r.status === 200,
        'balance query < 200ms': (r) => r.timings.duration < 200,
        'balance has data': (r) => {
          try { return r.json().balance !== undefined; } catch { return false; }
        },
      }) || queryErrors.add(1);

      queryLatency.add(res.timings.duration);
    });

    sleep(0.2);

    // Transaction history
    group('Transaction History', () => {
      const res = http.get(
        `${BASE_URL}/api/v1/transactions/${address}?chainId=${chainId}&limit=20`,
        {
          headers: { Authorization: AUTH_TOKEN },
          tags: { name: 'GET /transactions' },
        }
      );

      const isCached = res.headers['X-Cache'] === 'HIT';
      cacheHits.add(isCached ? 1 : 0);
      dbQueries.add(1);

      check(res, {
        'tx history succeeds': (r) => r.status === 200,
        'tx history < 300ms': (r) => r.timings.duration < 300,
        'tx history has data': (r) => {
          try { return Array.isArray(r.json().transactions); } catch { return false; }
        },
      }) || queryErrors.add(1);

      queryLatency.add(res.timings.duration);
    });

    sleep(0.2);

    // Token list
    group('Token List', () => {
      const res = http.get(
        `${BASE_URL}/api/v1/tokens?chainId=${chainId}`,
        {
          headers: { Authorization: AUTH_TOKEN },
          tags: { name: 'GET /tokens' },
        }
      );

      const isCached = res.headers['X-Cache'] === 'HIT';
      cacheHits.add(isCached ? 1 : 0);
      dbQueries.add(1);

      check(res, {
        'token list succeeds': (r) => r.status === 200,
        'token list < 150ms': (r) => r.timings.duration < 150,
      }) || queryErrors.add(1);

      queryLatency.add(res.timings.duration);
    });

    sleep(0.3);

    // Chain info
    group('Chain Info', () => {
      const res = http.get(
        `${BASE_URL}/api/v1/chains/${chainId}`,
        {
          headers: { Authorization: AUTH_TOKEN },
          tags: { name: 'GET /chains/:id' },
        }
      );

      const isCached = res.headers['X-Cache'] === 'HIT';
      cacheHits.add(isCached ? 1 : 0);
      dbQueries.add(1);

      check(res, {
        'chain info succeeds': (r) => r.status === 200,
        'chain info < 100ms': (r) => r.timings.duration < 100,
      }) || queryErrors.add(1);

      queryLatency.add(res.timings.duration);
    });
  });

  group('Write Queries', () => {
    // Record transaction
    group('Record Transaction', () => {
      const payload = JSON.stringify({
        hash: `0x${Math.random().toString(16).slice(2)}`,
        from: address,
        to: testAddresses[Math.floor(Math.random() * testAddresses.length)],
        value: '1000000000000000000',
        chainId: chainId,
        timestamp: Date.now(),
      });

      const res = http.post(`${BASE_URL}/api/v1/transactions`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: AUTH_TOKEN,
        },
        tags: { name: 'POST /transactions' },
      });

      dbQueries.add(1);

      check(res, {
        'record tx succeeds': (r) => r.status === 201 || r.status === 200,
        'record tx < 500ms': (r) => r.timings.duration < 500,
      }) || queryErrors.add(1);

      queryLatency.add(res.timings.duration);
    });

    sleep(0.5);

    // Update balance cache
    group('Update Balance Cache', () => {
      const res = http.post(
        `${BASE_URL}/api/v1/cache/balance/${address}`,
        JSON.stringify({ chainId }),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: AUTH_TOKEN,
          },
          tags: { name: 'POST /cache/balance' },
        }
      );

      dbQueries.add(1);

      check(res, {
        'cache update succeeds': (r) => r.status === 200 || r.status === 202,
      }) || queryErrors.add(1);

      queryLatency.add(res.timings.duration);
    });
  });

  sleep(1);
}
