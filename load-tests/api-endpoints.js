/**
 * k6 Load Test - API Endpoints
 *
 * Tests API endpoint performance under load.
 * Run: k6 run load-tests/api-endpoints.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');

// Test configuration
export const options = {
  scenarios: {
    // Ramp-up test
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    // Spike test
    spike: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 200,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '30s', target: 50 },
        { duration: '10s', target: 200 },
        { duration: '30s', target: 200 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.05'],
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8787';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'Bearer test-token';

// Endpoints to test
const endpoints = [
  { method: 'GET', path: '/health', name: 'health_check' },
  { method: 'GET', path: '/api/v1/chains', name: 'list_chains' },
  { method: 'GET', path: '/api/v1/tokens', name: 'list_tokens' },
  { method: 'POST', path: '/api/v1/estimate', name: 'estimate_gas' },
  { method: 'POST', path: '/api/v1/sign', name: 'sign_message' },
  { method: 'GET', path: '/api/v1/balance/0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb', name: 'get_balance' },
  { method: 'GET', path: '/api/v1/transactions/0x123', name: 'get_transaction' },
];

export default function () {
  group('API Endpoints', () => {
    // Health check
    group('Health Check', () => {
      const res = http.get(`${BASE_URL}/health`);
      check(res, {
        'health status is 200': (r) => r.status === 200,
        'health response time < 100ms': (r) => r.timings.duration < 100,
      }) || errorRate.add(1);
      apiLatency.add(res.timings.duration);
    });

    sleep(0.5);

    // List chains
    group('List Chains', () => {
      const res = http.get(`${BASE_URL}/api/v1/chains`, {
        headers: { Authorization: AUTH_TOKEN },
      });
      check(res, {
        'chains status is 200': (r) => r.status === 200,
        'chains response has data': (r) => r.json('data') !== undefined,
      }) || errorRate.add(1);
      apiLatency.add(res.timings.duration);
    });

    sleep(0.5);

    // Estimate gas
    group('Estimate Gas', () => {
      const payload = JSON.stringify({
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000',
        chainId: 1,
      });

      const res = http.post(`${BASE_URL}/api/v1/estimate`, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: AUTH_TOKEN,
        },
      });
      check(res, {
        'estimate status is 200': (r) => r.status === 200,
        'estimate has gas': (r) => r.json('gas') !== undefined,
      }) || errorRate.add(1);
      apiLatency.add(res.timings.duration);
    });

    sleep(0.5);

    // Get balance
    group('Get Balance', () => {
      const res = http.get(
        `${BASE_URL}/api/v1/balance/0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb?chainId=1`,
        { headers: { Authorization: AUTH_TOKEN } }
      );
      check(res, {
        'balance status is 200': (r) => r.status === 200,
        'balance has value': (r) => r.json('balance') !== undefined,
      }) || errorRate.add(1);
      apiLatency.add(res.timings.duration);
    });

    sleep(1);
  });
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
    'load-tests/results/api-endpoints.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, opts) {
  return JSON.stringify(data.metrics, null, 2);
}
