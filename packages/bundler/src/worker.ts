/**
 * Cloudflare Workers entry point for Bundler
 * Standalone implementation without Node.js dependencies
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  encodeAbiParameters,
  type Address,
  type Chain,
  type Hash,
  type Hex,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// ── Types ───────────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params?: unknown[];
  id: number | string;
}

interface JsonRpcResponse {
  jsonrpc: string;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
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
  publicClient: PublicClient;
  walletClient: WalletClient;
}

let workerState: WorkerState | null = null;

function initializeWorker(env: Env): WorkerState {
  if (workerState) {
    return workerState;
  }

  const entryPoint = (env.ENTRY_POINT as Address) || ENTRY_POINT_V06;
  const rpcUrl = SEPOLIA_CHAIN.rpcUrls.default.http[0];

  // Create viem clients for chain interaction
  const publicClient = createPublicClient({
    chain: SEPOLIA_CHAIN,
    transport: http(rpcUrl),
  });

  let walletClient: WalletClient;
  try {
    const account = privateKeyToAccount(env.BUNDLER_PRIVATE_KEY as Hex);
    walletClient = createWalletClient({
      account,
      chain: SEPOLIA_CHAIN,
      transport: http(rpcUrl),
    });
  } catch {
    // If no private key configured, create a dummy wallet client
    // Operations requiring signing will fail gracefully
    walletClient = createWalletClient({
      chain: SEPOLIA_CHAIN,
      transport: http(rpcUrl),
    });
  }

  workerState = {
    chain: SEPOLIA_CHAIN,
    rpcUrl,
    entryPoint,
    startTime: Date.now(),
    publicClient,
    walletClient,
  };

  return workerState;
}

// ── UserOperation Helpers ────────────────────────────────────────────

interface RawUserOperation {
  sender: Address;
  nonce: Hex;
  initCode: Hex;
  callData: Hex;
  callGasLimit: Hex;
  verificationGasLimit: Hex;
  preVerificationGas: Hex;
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
  paymasterAndData: Hex;
  signature: Hex;
}

/**
 * Compute the keccak256 hash of a serialized UserOperation.
 * Matches ERC-4337 specification for userOpHash.
 */
function computeUserOpHash(op: RawUserOperation, entryPoint: Address, chainId: number): Hash {
  const encoded = encodeAbiParameters(
    [
      { type: 'address' },
      { type: 'uint256' },
      { type: 'bytes32' }, // keccak256 of initCode
      { type: 'bytes32' }, // keccak256 of callData
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'bytes32' }, // keccak256 of paymasterAndData
    ],
    [
      op.sender,
      BigInt(op.nonce),
      keccak256(op.initCode as Hex),
      keccak256(op.callData as Hex),
      BigInt(op.callGasLimit),
      BigInt(op.verificationGasLimit),
      BigInt(op.preVerificationGas),
      BigInt(op.maxFeePerGas),
      BigInt(op.maxPriorityFeePerGas),
      keccak256(op.paymasterAndData as Hex),
    ],
  );
  return keccak256(encoded);
}

/**
 * Validate UserOperation structure and required fields.
 */
function validateUserOp(op: unknown): { valid: true; data: RawUserOperation } | { valid: false; error: string } {
  if (!op || typeof op !== 'object') {
    return { valid: false, error: 'Invalid UserOperation: not an object' };
  }

  const required = ['sender', 'nonce', 'initCode', 'callData', 'callGasLimit', 
    'verificationGasLimit', 'preVerificationGas', 'maxFeePerGas', 
    'maxPriorityFeePerGas', 'paymasterAndData', 'signature'];
  
  for (const field of required) {
    if (!(field in op)) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  const typed = op as RawUserOperation;

  // Validate hex strings
  const hexFields: (keyof RawUserOperation)[] = ['sender', 'nonce', 'initCode', 'callData', 
    'callGasLimit', 'verificationGasLimit', 'preVerificationGas', 'maxFeePerGas',
    'maxPriorityFeePerGas', 'paymasterAndData', 'signature'];
  
  for (const field of hexFields) {
    const val = typed[field];
    if (typeof val !== 'string' || !val.startsWith('0x')) {
      return { valid: false, error: `Field ${field} must be a hex string` };
    }
  }

  // Validate gas values are parseable
  try {
    BigInt(typed.callGasLimit);
    BigInt(typed.verificationGasLimit);
    BigInt(typed.preVerificationGas);
    BigInt(typed.maxFeePerGas);
    BigInt(typed.maxPriorityFeePerGas);
    BigInt(typed.nonce);
  } catch {
    return { valid: false, error: 'Invalid gas or nonce value' };
  }

  return { valid: true, data: typed };
}

/**
 * Store UserOperation in KV for mempool tracking.
 */
async function storeUserOp(
  kv: KVNamespace,
  userOpHash: Hash,
  op: RawUserOperation,
): Promise<void> {
  const record = {
    userOp: op,
    submittedAt: Date.now(),
    status: 'pending',
  };
  await kv.put(`userop:${userOpHash}`, JSON.stringify(record), { expirationTtl: 86400 }); // 24h TTL
}

/**
 * Get UserOperation from KV.
 */
async function getUserOp(
  kv: KVNamespace,
  userOpHash: Hash,
): Promise<{ userOp: RawUserOperation; submittedAt: number; status: string; bundleTxHash?: Hash } | null> {
  const data = await kv.get(`userop:${userOpHash}`);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Update UserOp status in KV (e.g., after bundle submission).
 */
async function updateUserOpStatus(
  kv: KVNamespace,
  userOpHash: Hash,
  status: string,
  bundleTxHash?: Hash,
): Promise<void> {
  const existing = await getUserOp(kv, userOpHash);
  if (existing) {
    const record = {
      ...existing,
      status,
      bundleTxHash,
      updatedAt: Date.now(),
    };
    await kv.put(`userop:${userOpHash}`, JSON.stringify(record), { expirationTtl: 86400 });
  }
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

      case 'eth_sendUserOperation': {
        // Validate parameters
        const params = body.params as [unknown, Address?] | undefined;
        if (!params || params.length < 1) {
          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32602, message: 'Invalid params: missing UserOperation' },
            id: body.id,
          }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const [opRaw, entryPointParam] = params;

        // Validate entry point if provided
        if (entryPointParam && entryPointParam.toLowerCase() !== state.entryPoint.toLowerCase()) {
          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32602, message: 'Unsupported entry point' },
            id: body.id,
          }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Validate UserOperation structure
        const validation = validateUserOp(opRaw);
        if (!validation.valid) {
          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32602, message: `AA24: ${validation.error}` },
            id: body.id,
          }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const userOp = validation.data;

        // Compute real UserOp hash
        const userOpHash = computeUserOpHash(userOp, state.entryPoint, state.chain.id);

        // Store in KV mempool
        try {
          await storeUserOp(env.BUNDLER_CACHE, userOpHash, userOp);
        } catch (err) {
          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32603, message: 'Internal error: failed to store UserOperation' },
            id: body.id,
          }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Return real hash
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          result: userOpHash,
          id: body.id,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'eth_getUserOperationReceipt': {
        const params = body.params as [Hash?] | undefined;
        if (!params || params.length < 1 || !params[0]) {
          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32602, message: 'Invalid params: missing userOpHash' },
            id: body.id,
          }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const userOpHash = params[0];

        // First check KV for stored UserOp with bundle tx hash
        let storedOp: Awaited<ReturnType<typeof getUserOp>> = null;
        try {
          storedOp = await getUserOp(env.BUNDLER_CACHE, userOpHash);
        } catch {
          // KV read failed, continue to chain lookup
        }

        // If we have a bundle tx hash, fetch the real receipt
        if (storedOp?.bundleTxHash) {
          try {
            const receipt = await state.publicClient.getTransactionReceipt({ 
              hash: storedOp.bundleTxHash 
            });
            
            if (receipt) {
              return new Response(JSON.stringify({
                jsonrpc: '2.0',
                result: {
                  userOpHash,
                  sender: storedOp.userOp.sender,
                  nonce: storedOp.userOp.nonce,
                  actualGasUsed: '0x' + receipt.gasUsed.toString(16),
                  actualGasCost: '0x' + (receipt.gasUsed * (receipt.effectiveGasPrice ?? 0n)).toString(16),
                  success: receipt.status === 'success',
                  receipt: {
                    transactionHash: receipt.transactionHash,
                    blockNumber: '0x' + receipt.blockNumber.toString(16),
                    blockHash: receipt.blockHash,
                    gasUsed: '0x' + receipt.gasUsed.toString(16),
                    logs: receipt.logs,
                    status: receipt.status,
                  },
                },
                id: body.id,
              }), {
                headers: { 'Content-Type': 'application/json' },
              });
            }
          } catch {
            // Receipt not yet available on chain
          }
        }

        // Try to find via EntryPoint UserOperationEvent logs
        try {
          const logs = await state.publicClient.getLogs({
            address: state.entryPoint,
            event: {
              type: 'event',
              name: 'UserOperationEvent',
              inputs: [
                { type: 'bytes32', indexed: true, name: 'userOpHash' },
                { type: 'address', indexed: true, name: 'sender' },
                { type: 'address', indexed: true, name: 'paymaster' },
                { type: 'uint256', indexed: false, name: 'nonce' },
                { type: 'bool', indexed: false, name: 'success' },
                { type: 'uint256', indexed: false, name: 'actualGasCost' },
                { type: 'uint256', indexed: false, name: 'actualGasUsed' },
              ],
            },
            args: { userOpHash },
            fromBlock: 'earliest',
          });

          if (logs && logs.length > 0) {
            const log = logs[0];
            const txHash = log.transactionHash;
            
            // Fetch full receipt for the bundle transaction
            const txReceipt = await state.publicClient.getTransactionReceipt({ hash: txHash });
            
            return new Response(JSON.stringify({
              jsonrpc: '2.0',
              result: {
                userOpHash,
                sender: storedOp?.userOp.sender ?? (log.args as { sender?: Address }).sender,
                nonce: storedOp?.userOp.nonce ?? '0x0',
                actualGasUsed: '0x' + ((log.args as { actualGasUsed?: bigint }).actualGasUsed ?? 0n).toString(16),
                actualGasCost: '0x' + ((log.args as { actualGasCost?: bigint }).actualGasCost ?? 0n).toString(16),
                success: (log.args as { success?: boolean }).success ?? false,
                receipt: {
                  transactionHash: txReceipt.transactionHash,
                  blockNumber: '0x' + txReceipt.blockNumber.toString(16),
                  blockHash: txReceipt.blockHash,
                  gasUsed: '0x' + txReceipt.gasUsed.toString(16),
                  logs: txReceipt.logs,
                  status: txReceipt.status,
                },
              },
              id: body.id,
            }), {
              headers: { 'Content-Type': 'application/json' },
            });
          }
        } catch {
          // Event lookup failed, return null
        }

        // Not found on chain or in mempool
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          result: null,
          id: body.id,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

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
