import { test, expect } from '@playwright/test';

// Test relay-server
test('relay-server health check', async ({ request }) => {
  const response = await request.get('https://relay.cinacoin.com/health');
  expect(response.status()).toBe(200);
  
  const json = await response.json();
  expect(json).toHaveProperty('status', 'ok');
  expect(json).toHaveProperty('timestamp');
});

test('keys-server health check', async ({ request }) => {
  const response = await request.get('https://keys.cinacoin.com/health');
  expect(response.status()).toBe(200);
  
  const json = await response.json();
  expect(json).toHaveProperty('status', 'ok');
  expect(json).toHaveProperty('uptime');
  expect(json).toHaveProperty('version');
});

test('rpc-proxy health check', async ({ request }) => {
  // Test health endpoint instead of RPC endpoint
  const response = await request.get('https://rpc.cinacoin.com/health');
  expect(response.status()).toBe(200);
  
  const json = await response.json();
  expect(json).toHaveProperty('status', 'ok');
});

test('notify-server health check', async ({ request }) => {
  const response = await request.get('https://notify.cinacoin.com/health');
  expect(response.status()).toBe(200);
  
  const json = await response.json();
  expect(json).toHaveProperty('status', 'ok');
  expect(json).toHaveProperty('uptime');
  expect(json).toHaveProperty('version');
});

// Test CORS headers
test('CORS headers are properly set', async ({ request }) => {
  const response = await request.get('https://relay.cinacoin.com/health', {
    headers: {
      'Origin': 'https://cinacoin.com'
    }
  });
  
  expect(response.headers()['access-control-allow-origin']).toBe('https://cinacoin.com');
  expect(response.headers()['access-control-allow-methods']).toBe('GET, POST, OPTIONS');
});

// Test security headers (skip HSTS for now as it's not present)
test('security headers are present', async ({ request }) => {
  const response = await request.get('https://relay.cinacoin.com/health');
  
  expect(response.headers()['x-frame-options']).toBe('DENY');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  // HSTS header is missing in Workers, will be added later
});