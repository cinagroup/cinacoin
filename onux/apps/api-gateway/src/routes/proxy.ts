import { Hono } from 'hono';
import type { Env, RequestContext } from '../lib/types';
import { authMiddleware } from '../middleware/auth';
import { BadGatewayError } from '../lib/errors';
import { createLogger } from '../lib/logger';

/**
 * Proxy routes
 * Forward requests to upstream microservices
 */
export function proxyRoutes() {
  const router = new Hono<{
    Bindings: Env;
    Variables: { context: RequestContext };
  }>();

  const logger = createLogger({ serviceName: 'api-gateway-proxy' });

  /**
   * Helper to proxy a request to an upstream service
   */
  async function proxyRequest(
    c: any,
    targetBaseUrl: string,
    pathPrefix: string
  ): Promise<Response> {
    const context = c.get('context') as RequestContext;
    const url = new URL(c.req.url);
    
    // Build target URL
    const targetPath = url.pathname.replace(pathPrefix, '');
    const targetUrl = `${targetBaseUrl}${targetPath}${url.search}`;

    // Forward headers
    const headers = new Headers(c.req.raw.headers);
    headers.set('X-Forwarded-For', context.clientIp);
    headers.set('X-Request-ID', context.requestId);
    headers.set('X-Project-ID', context.projectId || '');
    
    // Remove hop-by-hop headers
    headers.delete('host');
    headers.delete('connection');
    
    // Add upstream auth if configured
    if (c.env.UPSTREAM_API_KEY) {
      headers.set('X-Upstream-API-Key', c.env.UPSTREAM_API_KEY);
    }

    try {
      const response = await fetch(targetUrl, {
        method: c.req.method,
        headers,
        body: c.req.raw.body,
        redirect: 'manual',
      });

      // Log the proxied request
      logger.info(`Proxied ${c.req.method} ${url.pathname} → ${targetUrl}`, {
        requestId: context.requestId,
        status: response.status,
      });

      // Clone response and add our headers
      const newHeaders = new Headers(response.headers);
      newHeaders.set('X-Proxied-By', 'cinacoin-api-gateway');
      newHeaders.set('X-Request-ID', context.requestId);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (error) {
      logger.error(`Proxy error for ${c.req.method} ${url.pathname}`, error, {
        requestId: context.requestId,
        targetUrl,
      });
      throw new BadGatewayError('Upstream service unavailable');
    }
  }

  // Proxy to project-registry-api
  router.all('/registry/*', authMiddleware, async (c) => {
    const baseUrl = c.env.PROJECT_REGISTRY_URL || 'https://project-registry-api.cinacoin.com';
    return proxyRequest(c, baseUrl, '/api/registry');
  });

  // Proxy to wallet-explorer-api
  router.all('/wallets/*', authMiddleware, async (c) => {
    const baseUrl = c.env.WALLET_EXPLORER_URL || 'https://wallet-explorer-api.cinacoin.com';
    return proxyRequest(c, baseUrl, '/api/wallets');
  });

  // Proxy to user-service
  router.all('/users/*', authMiddleware, async (c) => {
    const baseUrl = c.env.USER_SERVICE_URL || 'https://user-service.cinacoin.com';
    return proxyRequest(c, baseUrl, '/api/users');
  });

  // Proxy to user-service (teams)
  router.all('/teams/*', authMiddleware, async (c) => {
    const baseUrl = c.env.USER_SERVICE_URL || 'https://user-service.cinacoin.com';
    return proxyRequest(c, baseUrl, '/api/teams');
  });

  return router;
}
