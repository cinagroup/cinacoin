/**
 * Cloudflare Workers entry point for Bundler
 * Standalone implementation without Node.js dependencies
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Chain,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// ── Types ───────────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params?: any[];
  id: number | string;
}

interface JsonRpcResponse {
  jsonrpc: string;
  result?: any;
  error?: { code: number; message: string; data?: any };
  id: number | string | null;
}

interface HealthResponse {
  status: string;
  chainId: number;
  entryPoint: string;
  uptime: number;
  version: string;
}

interface Env {
  BUNDLER_CACHE: KVNamespace;
  BUNDLER_DB: D1Database;
  BUNDLER_PRIVATE_KEY: string;
  BUNDLER_API_KEYS?: string;
  BUNDLER_SKIP_AUTH?: string;
  LOG_LEVEL?: string;
  ENTRY_POINT?: string;
  PAYMASTER_ADDRESS?: string;
}

// ── Constants ───────────────────────────────────────────────────────

const ENTRY_POINT_V06: Address = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

const SEPOLIA_CHAIN: Chain = {
  id: 11155111,
  name: 'Sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.sepolia.org'] } },
};

// ── CORS Configuration ──────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  'https://cinacoin.com',
  'https://dash.cinacoin.com',
  'https://demo.cinacoin.com',
  'https://docs.cinacoin.com',
  'https://status.cinacoin.com',
  'http://localhost:3000',
  'http://localhost:5173',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

// ── API Key Authentication ──────────────────────────────────────────

function verifyApiKey(request: Request, env: Env): boolean {
  // Skip auth in development mode
  if (env.BUNDLER_SKIP_AUTH === 'true') {
    return true;
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

// ── Worker State ────────────────────────────────────────────────────

interface WorkerState {
  chain: Chain;
  rpcUrl: string;
  entryPoint: Address;
  startTime: number;
}

let workerState: WorkerState | null = null;

function initializeWorker(env: Env): WorkerState {
  if (workerState) {
    return workerState;
  }

  const entryPoint = (env.ENTRY_POINT as Address) || ENTRY_POINT_V06;

  workerState = {
    chain: SEPOLIA_CHAIN,
    rpcUrl: SEPOLIA_CHAIN.rpcUrls.default.http[0],
    entryPoint,
    startTime: Date.now(),
  };

  return workerState;
}

// ── Request Handlers ────────────────────────────────────────────────

async function handleHealth(state: WorkerState): Promise<Response> {
  const uptimeSeconds = Math.floor((Date.now() - state.startTime) / 1000);
  
  const health: HealthResponse = {
    status: 'ok',
    chainId: state.chain.id,
    entryPoint: state.entryPoint,
    uptime: uptimeSeconds,
    version: '1.0.0',
  };

  return new Response(JSON.stringify(health), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleJsonRpc(request: Request, state: WorkerState, env: Env): Promise<Response> {
  try {
    const body = await request.json() as JsonRpcRequest;
    
    // Validate JSON-RPC request
    if (!body.jsonrpc || body.jsonrpc !== '2.0' || !body.method) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request' },
        id: body.id || null,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Route to appropriate handler
    switch (body.method) {
      case 'eth_chainId':
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          result: `0x${state.chain.id.toString(16)}`,
          id: body.id,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });

      case 'eth_supportedEntryPoints':
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          result: [state.entryPoint],
          id: body.id,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });

      case 'eth_sendUserOperation':
        // TODO: Implement full UserOp submission logic
        // This is a placeholder response
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          result: '0x' + '0'.repeat(64),
          id: body.id,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });

      case 'eth_getUserOperationReceipt':
        // TODO: Implement receipt lookup
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          result: null,
          id: body.id,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });

      default:
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          error: { code: -32601, message: 'Method not found' },
          id: body.id,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32700, message: 'Parse error' },
      id: null,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ── Main Fetch Handler ──────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Initialize worker state
    const state = initializeWorker(env);

    // Health check endpoint (no auth required)
    if (url.pathname === '/health' || url.pathname === '/healthz') {
      const response = await handleHealth(state);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // All other endpoints require authentication
    if (!verifyApiKey(request, env)) {
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Unauthorized: Invalid or missing API key' },
        id: null,
      }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // JSON-RPC endpoint
    if (url.pathname === '/' || url.pathname === '/rpc') {
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { 
          status: 405,
          headers: corsHeaders,
        });
      }

      const response = await handleJsonRpc(request, state, env);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // 404 for all other paths
    return new Response('Not found', { 
      status: 404,
      headers: corsHeaders,
    });
  },
};
