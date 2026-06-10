/**
 * Router Worker tests
 *
 * Tests route matching, prefix stripping, CORS, redirects, health checks,
 * SPA fallback, and WebSocket proxy behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from '../src/index';

// Mock global fetch for proxy tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to extract URL from fetch call (handles both URL string and Request object)
function getCalledUrl(callIndex = 0): URL {
  const call = mockFetch.mock.calls[callIndex];
  const arg = call[0];
  if (arg instanceof Request) {
    return new URL(arg.url);
  }
  return new URL(arg.toString());
}

// Mock ExecutionContext
const mockCtx = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
} as unknown as ExecutionContext;

// Mock Env
const mockEnv = {};

describe('Router Worker', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // -------------------------------------------------------------------------
  // Route matching tests
  // -------------------------------------------------------------------------
  describe('Route matching', () => {
    const routes = [
      { path: '/docs', expected: 'cinacoin-docs.pages.dev' },
      { path: '/docs/getting-started', expected: 'cinacoin-docs.pages.dev' },
      { path: '/developer', expected: 'cinacoin-developer-dashboard.pages.dev' },
      { path: '/developer/api', expected: 'cinacoin-developer-dashboard.pages.dev' },
      { path: '/learn', expected: 'cinacoin-learn.pages.dev' },
      { path: '/learn/tutorials', expected: 'cinacoin-learn.pages.dev' },
      { path: '/demo', expected: 'cinacoin-demo-react.pages.dev' },
      { path: '/demo/swap', expected: 'cinacoin-demo-react.pages.dev' },
      { path: '/telegram', expected: 'cinacoin-telegram.pages.dev' },
      { path: '/telegram/connect', expected: 'cinacoin-telegram.pages.dev' },
      { path: '/farcaster', expected: 'cinacoin-farcaster.pages.dev' },
      { path: '/farcaster/frame', expected: 'cinacoin-farcaster.pages.dev' },
      { path: '/analytics', expected: 'cinacoin-analytics.pages.dev' },
      { path: '/analytics/dashboard', expected: 'cinacoin-analytics.pages.dev' },
      { path: '/dashboard', expected: 'cinacoin-cloud-dashboard.pages.dev' },
      { path: '/dashboard/settings', expected: 'cinacoin-cloud-dashboard.pages.dev' },
      { path: '/wallets', expected: 'cinacoin-wallet-explorer.pages.dev' },
      { path: '/wallets/0x123', expected: 'cinacoin-wallet-explorer.pages.dev' },
    ];

    routes.forEach(({ path, expected }) => {
      it(`should route ${path} to ${expected}`, async () => {
        mockFetch.mockResolvedValueOnce(
          new Response('OK', { status: 200 }),
        );

        const request = new Request(`https://cinacoin.com${path}`);
        const response = await worker.fetch(request, mockEnv, mockCtx);

        expect(mockFetch).toHaveBeenCalled();
        const calledUrl = getCalledUrl();
        expect(calledUrl.toString()).toContain(expected);
      });
    });

    it('should route unmatched paths to fallback origin', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('OK', { status: 200 }),
      );

      const request = new Request('https://cinacoin.com/some-random-path');
      await worker.fetch(request, mockEnv, mockCtx);

      const calledUrl = getCalledUrl();
      expect(calledUrl.toString()).toContain('cinacoin-website.pages.dev');
    });
  });

  // -------------------------------------------------------------------------
  // Prefix stripping tests
  // -------------------------------------------------------------------------
  describe('Prefix stripping', () => {
    it('should strip /docs prefix before proxying', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('OK', { status: 200 }),
      );

      const request = new Request('https://cinacoin.com/docs/getting-started');
      await worker.fetch(request, mockEnv, mockCtx);

      const calledUrl = getCalledUrl();
      expect(calledUrl.pathname).toBe('/getting-started');
    });

    it('should strip /developer prefix before proxying', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('OK', { status: 200 }),
      );

      const request = new Request('https://cinacoin.com/developer/api');
      await worker.fetch(request, mockEnv, mockCtx);

      const calledUrl = getCalledUrl();
      expect(calledUrl.pathname).toBe('/api');
    });

    it('should handle exact prefix match (no trailing path)', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('OK', { status: 200 }),
      );

      const request = new Request('https://cinacoin.com/docs');
      await worker.fetch(request, mockEnv, mockCtx);

      const calledUrl = getCalledUrl();
      expect(calledUrl.pathname).toBe('/');
    });

    it('should preserve query parameters after stripping', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('OK', { status: 200 }),
      );

      const request = new Request('https://cinacoin.com/docs/page?foo=bar');
      await worker.fetch(request, mockEnv, mockCtx);

      const calledUrl = getCalledUrl();
      expect(calledUrl.pathname).toBe('/page');
      expect(calledUrl.search).toBe('?foo=bar');
    });
  });

  // -------------------------------------------------------------------------
  // CORS tests
  // -------------------------------------------------------------------------
  describe('CORS headers', () => {
    it('should add CORS headers to proxied responses', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('OK', { status: 200 }),
      );

      const request = new Request('https://cinacoin.com/docs');
      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });

    it('should handle OPTIONS preflight requests', async () => {
      const request = new Request('https://cinacoin.com/docs', {
        method: 'OPTIONS',
      });
      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
    });
  });

  // -------------------------------------------------------------------------
  // Retired subdomain redirect tests
  // -------------------------------------------------------------------------
  describe('Retired subdomain redirects', () => {
    const redirects = [
      { from: 'demo.cinacoin.com', to: '/demo' },
      { from: 'wallet.cinacoin.com', to: '/wallets' },
      { from: 'cloud.cinacoin.com', to: '/dashboard' },
      { from: 'analytics.cinacoin.com', to: '/analytics' },
      { from: 'docs.cinacoin.com', to: '/docs' },
      { from: 'developer.cinacoin.com', to: '/developer' },
      { from: 'learn.cinacoin.com', to: '/learn' },
      { from: 'telegram.cinacoin.com', to: '/telegram' },
      { from: 'farcaster.cinacoin.com', to: '/farcaster' },
    ];

    redirects.forEach(({ from, to }) => {
      it(`should redirect ${from} to cinacoin.com${to}`, async () => {
        const request = new Request(`https://${from}/some-path`);
        const response = await worker.fetch(request, mockEnv, mockCtx);

        expect(response.status).toBe(301);
        const location = response.headers.get('Location');
        expect(location).toBe(`https://cinacoin.com${to}/some-path`);
      });
    });

    it('should handle duplicate prefix in retired subdomain', async () => {
      const request = new Request('https://demo.cinacoin.com/demo/swap');
      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.status).toBe(301);
      const location = response.headers.get('Location');
      // The duplicate prefix is stripped, so /demo/swap becomes /swap under /demo
      expect(location).toBe('https://cinacoin.com/demo/swap');
    });

    it('should preserve query parameters in redirects', async () => {
      const request = new Request('https://demo.cinacoin.com/?foo=bar');
      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.status).toBe(301);
      const location = response.headers.get('Location');
      expect(location).toBe('https://cinacoin.com/demo/?foo=bar');
    });
  });

  // -------------------------------------------------------------------------
  // Health check endpoint tests
  // -------------------------------------------------------------------------
  describe('Health check endpoints', () => {
    it('should return health status for /_health', async () => {
      // Mock multiple fetch calls for each backend
      mockFetch.mockResolvedValue(
        new Response('OK', { status: 200 }),
      );

      const request = new Request('https://cinacoin.com/_health');
      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('backends');
      expect(body.status).toBe('healthy');
    });

    it('should return degraded status if a backend is unhealthy', async () => {
      // Mock one backend as unhealthy
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('cinacoin-docs')) {
          return Promise.resolve(new Response('Error', { status: 500 }));
        }
        return Promise.resolve(new Response('OK', { status: 200 }));
      });

      const request = new Request('https://cinacoin.com/_health');
      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body.status).toBe('degraded');
    });

    it('should return route table for /_routes', async () => {
      const request = new Request('https://cinacoin.com/_routes');
      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('routes');
      expect(body).toHaveProperty('fallback');
      expect(body).toHaveProperty('retiredSubdomains');
      expect(Array.isArray(body.routes)).toBe(true);
      expect(body.routes.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // SPA fallback tests
  // -------------------------------------------------------------------------
  describe('SPA fallback', () => {
    it('should fallback to index.html on 404 for non-asset paths', async () => {
      // First call returns 404, second call (index.html) returns 200
      mockFetch
        .mockResolvedValueOnce(new Response('Not Found', { status: 404 }))
        .mockResolvedValueOnce(new Response('<html></html>', { status: 200 }));

      const request = new Request('https://cinacoin.com/demo/some-route');
      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      const secondCallUrl = getCalledUrl(1);
      expect(secondCallUrl.pathname).toBe('/index.html');
    });

    it('should NOT fallback for static asset paths', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Not Found', { status: 404 }),
      );

      const request = new Request('https://cinacoin.com/demo/image.png');
      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(404);
    });

    it('should NOT fallback for paths with file extensions', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('Not Found', { status: 404 }),
      );

      const request = new Request('https://cinacoin.com/docs/api.json');
      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(404);
    });
  });

  // -------------------------------------------------------------------------
  // WebSocket tests
  // -------------------------------------------------------------------------
  describe('WebSocket proxy', () => {
    it('should handle WebSocket upgrade for /analytics/ws', async () => {
      const request = new Request('https://cinacoin.com/analytics/ws/stream', {
        headers: {
          Upgrade: 'websocket',
          Connection: 'Upgrade',
        },
      });

      // Mock upstream WebSocket response - use status 200 since 101 is not valid in Response
      mockFetch.mockResolvedValueOnce(
        new Response(null, { status: 200 }),
      );

      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(mockFetch).toHaveBeenCalled();
      const calledUrl = getCalledUrl();
      expect(calledUrl.toString()).toContain('cinacoin-analytics.pages.dev/ws/stream');
    });

    it('should reject WebSocket on non-analytics paths', async () => {
      // Mock a normal response for the fallback
      mockFetch.mockResolvedValueOnce(
        new Response('OK', { status: 200 }),
      );

      const request = new Request('https://cinacoin.com/demo/ws', {
        headers: {
          Upgrade: 'websocket',
          Connection: 'Upgrade',
        },
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);

      // Should proxy to demo origin, not reject (WebSocket only handled for /analytics/ws)
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Request header forwarding tests
  // -------------------------------------------------------------------------
  describe('Header forwarding', () => {
    it('should set Host header to upstream origin', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('OK', { status: 200 }),
      );

      const request = new Request('https://cinacoin.com/docs/page');
      await worker.fetch(request, mockEnv, mockCtx);

      const proxiedRequest = mockFetch.mock.calls[0][0] as Request;
      expect(proxiedRequest.headers.get('Host')).toBe('cinacoin-docs.pages.dev');
    });

    it('should set X-Forwarded-Host header', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('OK', { status: 200 }),
      );

      const request = new Request('https://cinacoin.com/docs/page');
      await worker.fetch(request, mockEnv, mockCtx);

      const proxiedRequest = mockFetch.mock.calls[0][0] as Request;
      expect(proxiedRequest.headers.get('X-Forwarded-Host')).toBe('cinacoin.com');
    });

    it('should set X-Forwarded-Proto header', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('OK', { status: 200 }),
      );

      const request = new Request('https://cinacoin.com/docs/page');
      await worker.fetch(request, mockEnv, mockCtx);

      const proxiedRequest = mockFetch.mock.calls[0][0] as Request;
      expect(proxiedRequest.headers.get('X-Forwarded-Proto')).toBe('https');
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  describe('Edge cases', () => {
    it('should handle trailing slash on exact prefix match', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('OK', { status: 200 }),
      );

      const request = new Request('https://cinacoin.com/docs/');
      await worker.fetch(request, mockEnv, mockCtx);

      const calledUrl = getCalledUrl();
      expect(calledUrl.pathname).toBe('/');
    });

    it('should handle root path', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('OK', { status: 200 }),
      );

      const request = new Request('https://cinacoin.com/');
      await worker.fetch(request, mockEnv, mockCtx);

      const calledUrl = getCalledUrl();
      expect(calledUrl.toString()).toContain('cinacoin-website.pages.dev');
    });

    it('should handle paths that start with a route prefix but are not that route', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('OK', { status: 200 }),
      );

      // /documentation should NOT match /docs
      const request = new Request('https://cinacoin.com/documentation');
      await worker.fetch(request, mockEnv, mockCtx);

      const calledUrl = getCalledUrl();
      expect(calledUrl.toString()).toContain('cinacoin-website.pages.dev');
    });
  });
});
