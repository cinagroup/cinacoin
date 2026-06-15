import { handleRpcRequest } from './rpc/handler';
import { MempoolDO } from './services/mempool';
import type { Env } from './types';

export { MempoolDO };

/**
 * SEC-06 FIX: Verify API key from request headers.
 * In production, BUNDLER_SKIP_AUTH is disabled and API keys are required.
 */
function verifyApiKey(request: Request, env: Env): boolean {
  // SEC-06: In production, never allow skipping authentication
  const nodeEnv = env.NODE_ENV || 'production';
  if (nodeEnv !== 'production') {
    // Only allow skip in non-production environments
    const skipAuth = request.headers.get('X-Bundler-Skip-Auth');
    if (skipAuth === 'true' && !env.BUNDLER_API_KEYS) {
      return true;
    }
  }

  const apiKeysEnv = env.BUNDLER_API_KEYS;
  if (!apiKeysEnv) {
    // No keys configured = reject all (fail secure)
    return false;
  }

  const allowedKeys = apiKeysEnv.split(',').map(k => k.trim()).filter(k => k.length > 0);
  if (allowedKeys.length === 0) {
    return false;
  }

  // Check Authorization: Bearer <key>
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const key = authHeader.slice(7).trim();
    if (allowedKeys.includes(key)) {
      return true;
    }
  }

  // Check X-API-Key: <key>
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    const key = apiKeyHeader.trim();
    if (allowedKeys.includes(key)) {
      return true;
    }
  }

  return false;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    // CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // SEC-06: Verify API key before processing request
    if (!verifyApiKey(request, env)) {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32000,
            message: 'Unauthorized: Invalid or missing API key',
          },
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    try {
      const body = await request.json();
      const result = await handleRpcRequest(body, env);

      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal error';
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32603, message },
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },
};
