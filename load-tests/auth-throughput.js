/**
 * k6 Load Test - Authentication Throughput
 *
 * Tests authentication endpoint performance under load.
 * Run: k6 run load-tests/auth-throughput.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// Custom metrics
const authErrors = new Rate('auth_errors');
const authLatency = new Trend('auth_latency');
const tokenRefreshes = new Rate('token_refreshes');

export const options = {
  scenarios: {
    // Login burst
    login_burst: {
      executor: 'per-vu-iterations',
      vus: 100,
      iterations: 10,
      maxDuration: '2m',
    },
    // Sustained auth
    sustained_auth: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
  },
  thresholds: {
    auth_errors: ['rate<0.01'],
    auth_latency: ['p(95)<300', 'p(99)<800'],
    http_req_duration: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8787';

// Test credentials (in real scenario, load from CSV)
const credentials = new SharedArray('credentials', function () {
  // Generate test users
  return Array.from({ length: 100 }, (_, i) => ({
    email: `user${i}@test.com`,
    password: 'test-password-123',
  }));
});

export default function () {
  const creds = credentials[Math.floor(Math.random() * credentials.length)];

  group('Authentication Flow', () => {
    // Step 1: Login
    let accessToken, refreshToken;
    
    group('Login', () => {
      const loginPayload = JSON.stringify({
        email: creds.email,
        password: creds.password,
      });

      const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'POST /auth/login' },
      });

      check(loginRes, {
        'login status is 200': (r) => r.status === 200,
        'login has access token': (r) => {
          try {
            const body = r.json();
            accessToken = body.accessToken;
            return !!accessToken;
          } catch { return false; }
        },
        'login has refresh token': (r) => {
          try {
            const body = r.json();
            refreshToken = body.refreshToken;
            return !!refreshToken;
          } catch { return false; }
        },
        'login latency < 500ms': (r) => r.timings.duration < 500,
      }) || authErrors.add(1);

      authLatency.add(loginRes.timings.duration);
    });

    sleep(0.5);

    // Step 2: Use access token
    group('Authenticated Request', () => {
      if (!accessToken) return;

      const res = http.get(`${BASE_URL}/api/v1/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        tags: { name: 'GET /api/v1/me' },
      });

      check(res, {
        'authenticated request succeeds': (r) => r.status === 200,
        'returns user data': (r) => {
          try { return r.json().email === creds.email; } catch { return false; }
        },
      }) || authErrors.add(1);

      authLatency.add(res.timings.duration);
    });

    sleep(1);

    // Step 3: Refresh token
    group('Token Refresh', () => {
      if (!refreshToken) return;

      const refreshPayload = JSON.stringify({ refreshToken });

      const refreshRes = http.post(`${BASE_URL}/auth/refresh`, refreshPayload, {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'POST /auth/refresh' },
      });

      check(refreshRes, {
        'refresh status is 200': (r) => r.status === 200,
        'refresh returns new token': (r) => {
          try { return !!r.json().accessToken; } catch { return false; }
        },
      }) || tokenRefreshes.add(1);

      authLatency.add(refreshRes.timings.duration);
    });

    sleep(0.5);

    // Step 4: Logout
    group('Logout', () => {
      if (!refreshToken) return;

      const logoutRes = http.post(`${BASE_URL}/auth/logout`, JSON.stringify({
        refreshToken,
      }), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        tags: { name: 'POST /auth/logout' },
      });

      check(logoutRes, {
        'logout status is 200': (r) => r.status === 200,
      }) || authErrors.add(1);
    });
  });

  sleep(1);
}

// Handle failed login attempts
export function handleFailedLogin(res) {
  if (res.status === 429) {
    // Rate limited - back off
    sleep(5);
  }
}
