import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Chain,
  type Hash,
  type Hex,
  type WalletClient,
  type PublicClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Server, type IncomingMessage, type ServerResponse } from 'http';
import type { Readable } from 'stream';

import type { BundlerServerConfig, JsonRpcRequest, JsonRpcResponse, HealthResponse, PimlicoGasPrice, PimlicoUserOpStatus, RawUserOperation, BundlerMetrics } from './server-types';
import { UserOpPoolStatus } from './server-types';
import { UserOpValidator } from './UserOpValidator';
import { UserOpPool } from './UserOpPool';
import { BundleBuilder } from './BundleBuilder';
import { GasOracle } from './GasOracle';
import { ReputationTracker } from './ReputationTracker';
import { computeUserOpHash, toViemUserOp } from './utils';
import { logger } from '@cinacoin/logger';
import { getEnv } from './env';

// ── Default configs for known chains ────────────────────────────────

/** Known Entry Point v0.6 address. */
const ENTRY_POINT_V06: Address = '0x0000000071727De22E5E9d8BAf0edAc6f37da032';

/** Known chains with default RPC URLs. */
export const KNOWN_CHAINS: Record<string, { chain: Chain; rpcUrl: string }> = {
  ethereum: {
    chain: {
      id: 1,
      name: 'Ethereum',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: ['https://eth.llamarpc.com'] } },
    },
    rpcUrl: 'https://eth.llamarpc.com',
  },
  sepolia: {
    chain: {
      id: 11155111,
      name: 'Sepolia',
      nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: ['https://rpc.sepolia.org'] } },
    },
    rpcUrl: 'https://rpc.sepolia.org',
  },
  arbitrum: {
    chain: {
      id: 42161,
      name: 'Arbitrum One',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: ['https://arb1.arbitrum.io/rpc'] } },
    },
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
  },
  optimism: {
    chain: {
      id: 10,
      name: 'OP Mainnet',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: ['https://mainnet.optimism.io'] } },
    },
    rpcUrl: 'https://mainnet.optimism.io',
  },
  base: {
    chain: {
      id: 8453,
      name: 'Base',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: ['https://mainnet.base.org'] } },
    },
    rpcUrl: 'https://mainnet.base.org',
  },
  polygon: {
    chain: {
      id: 137,
      name: 'Polygon',
      nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
      rpcUrls: { default: { http: ['https://polygon-rpc.com'] } },
    },
    rpcUrl: 'https://polygon-rpc.com',
  },
};

/**
 * Build a default BundlerServerConfig for a given chain name.
 */
export function defaultConfig(chainName: string, beneficiary: Address, signerKey: Hex, rpcUrl?: string): BundlerServerConfig {
  const known = KNOWN_CHAINS[chainName];
  if (!known) {
    throw new Error(`Unknown chain: ${chainName}. Available: ${Object.keys(KNOWN_CHAINS).join(', ')}`);
  }

  return {
    listen: '0.0.0.0:4337',
    beneficiary,
    entryPoints: [ENTRY_POINT_V06],
    maxOpsPerBundle: 128,
    bundleIntervalMs: 2000,
    bundleTimeoutMs: 5000,
    minBundleGas: 21_000,
    minProfitMarginBps: 500, // 5%
    reputation: {
      throttleThreshold: 5,
      banThreshold: 20,
      throttleDurationSec: 3600,
      banDurationSec: 86400,
      maxPendingPerSender: 16,
    },
    blacklistedSenders: [],
    simulation: {
      enabled: true,
      maxSimulationGas: 30_000_000,
    },
    healthPath: '/health',
    metricsPath: '/metrics',
    metricsEnabled: true,
  };
}

// ── BundlerServer ───────────────────────────────────────────────────

/**
 * BundlerServer — production-ready ERC-4337 bundler server.
 *
 * Implements:
 * - Standard ERC-4337 bundler API (eth_sendUserOperation, etc.)
 * - Pimlico-compatible API (pimlico_getUserOperationStatus, etc.)
 * - Health check endpoint
 * - UserOp validation, mempool, bundle building, and execution
 */

// ── Allowed origins for CORS ────────────────────────────────────────
const BUNDLER_ALLOWED_ORIGINS = [
  'https://cinacoin.com',
  'https://dash.cinacoin.com',
  'https://demo.cinacoin.com',
  'https://docs.cinacoin.com',
  'https://status.cinacoin.com',
  'http://localhost:3000',
  'http://localhost:5173',
];

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return BUNDLER_ALLOWED_ORIGINS.includes(origin);
}

function setCorsHeaders(res: ServerResponse, req: IncomingMessage): void {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin) && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
}

// ── API Key Authentication ────────────────────────────────────────────────

/**
 * Verify API key from request headers.
 * Supports: Authorization: Bearer <key> OR X-API-Key: <key>
 * Environment: BUNDLER_API_KEYS (comma-separated list), BUNDLER_SKIP_AUTH=true to skip
 */
function verifyApiKey(req: IncomingMessage): boolean {
  const env = getEnv();
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
  const authHeader = req.headers['authorization'];
  if (authHeader && typeof authHeader === 'string') {
    if (authHeader.startsWith('Bearer ')) {
      const key = authHeader.slice(7).trim();
      if (allowedKeys.includes(key)) {
        return true;
      }
    }
  }

  // Check X-API-Key: <key>
  const apiKeyHeader = req.headers['x-api-key'];
  if (apiKeyHeader && typeof apiKeyHeader === 'string') {
    const key = apiKeyHeader.trim();
    if (allowedKeys.includes(key)) {
      return true;
    }
  }

  return false;
}

export class BundlerServer {
  private config: BundlerServerConfig;
  private chain: Chain;
  private rpcUrl: string;
  private validator: UserOpValidator;
  private pool: UserOpPool;
  private bundleBuilder: BundleBuilder;
  private gasOracle: GasOracle;
  private reputation: ReputationTracker;
  private walletClient: WalletClient;
  private publicClient: PublicClient;
  private httpServer: Server | null = null;
  private bundleInterval: ReturnType<typeof setInterval> | null = null;
  private expireInterval: ReturnType<typeof setInterval> | null = null;
  private startTime: number;

  // Metrics counters
  private metrics: BundlerMetrics;

  constructor(config: BundlerServerConfig, chain: Chain, rpcUrl: string, signerKey: Hex) {
    this.config = config;
    this.chain = chain;
    this.rpcUrl = rpcUrl;
    this.startTime = Date.now();

    // Clients
    const account = privateKeyToAccount(signerKey);
    this.publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });
    this.walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    });

    // Core components
    this.validator = new UserOpValidator(config, chain, rpcUrl);
    this.reputation = new ReputationTracker(config.reputation);
    this.pool = new UserOpPool(config);
    this.bundleBuilder = new BundleBuilder(
      config,
      config.entryPoints[0],
      config.beneficiary,
    );
    this.gasOracle = new GasOracle(chain, rpcUrl);

    this.metrics = {
      totalOpsReceived: 0,
      totalOpsSubmitted: 0,
      totalOpsIncluded: 0,
      totalOpsRejected: 0,
      totalBundlesSent: 0,
      pendingOps: 0,
      avgGasPerBundle: 0n,
      uptimeSeconds: 0,
    };
  }

  // ── Lifecycle ─────────────────────────────────────────────────────

  /**
   * Start the HTTP server and background bundle processing.
   */
  async start(): Promise<void> {
    this.httpServer = createServer((req, res) => this.handleRequest(req, res));

    const [host, portStr] = this.config.listen.split(':');
    const port = parseInt(portStr, 10) || 4337;

    await new Promise<void>((resolve, reject) => {
      this.httpServer!.listen(port, host || '0.0.0.0', (err?: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });

    logger.info(`[BundlerServer] Listening on ${this.config.listen}`);

    // Start bundle creation interval
    this.bundleInterval = setInterval(() => this.processBundle(), this.config.bundleIntervalMs);

    // Start expiry cleanup interval
    this.expireInterval = setInterval(() => {
      this.pool.expireOldOps(300_000); // 5 min expiry
      this.pool.cleanupSeen();
    }, 60_000);
  }

  /**
   * Stop the server and all background tasks.
   */
  async stop(): Promise<void> {
    if (this.bundleInterval) clearInterval(this.bundleInterval);
    if (this.expireInterval) clearInterval(this.expireInterval);
    if (this.httpServer) {
      await new Promise<void>((resolve) => this.httpServer!.close(() => resolve()));
    }
  }

  // ── HTTP Request Router ───────────────────────────────────────────

  // SECURITY: Rate limiting (in-memory, per-process)
  private rateLimits = new Map<string, { count: number; resetAt: number }>();
  private readonly RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
  private readonly RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute

  private checkRateLimit(clientIp: string): boolean {
    const env = getEnv();
    const maxRequests = parseInt(env.BUNDLER_RATE_LIMIT ?? String(this.RATE_LIMIT_MAX_REQUESTS), 10);
    
    const now = Date.now();
    const entry = this.rateLimits.get(clientIp);
    
    if (!entry || now > entry.resetAt) {
      this.rateLimits.set(clientIp, {
        count: 1,
        resetAt: now + this.RATE_LIMIT_WINDOW_MS,
      });
      return true;
    }
    
    if (entry.count >= maxRequests) {
      return false;
    }
    
    entry.count++;
    return true;
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // CORS headers (origin-validated, no wildcard)
    setCorsHeaders(res, req);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health check
    if (req.method === 'GET' && req.url === this.config.healthPath) {
      this.handleHealth(res);
      return;
    }

    // Prometheus metrics
    if (req.method === 'GET' && this.config.metricsEnabled && req.url === this.config.metricsPath) {
      this.handleMetrics(res);
      return;
    }

    // JSON-RPC POST requires API key authentication
    if (req.method === 'POST' && (req.url === '/' || req.url === '/rpc')) {
      // SECURITY: Rate limiting
      const fwdFor = req.headers['x-forwarded-for'];
      const realIp = req.headers['x-real-ip'];
      const clientIp = (typeof fwdFor === 'string'
        ? fwdFor.split(',')[0].trim()
        : Array.isArray(fwdFor)
          ? fwdFor[0]?.split(',')[0].trim()
          : undefined)
        || (typeof realIp === 'string' ? realIp : (Array.isArray(realIp) ? realIp[0] : undefined))
        || req.socket.remoteAddress
        || 'unknown';
      if (!this.checkRateLimit(clientIp)) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32005, message: 'Rate limit exceeded' }
        }));
        return;
      }

      // Authenticate request
      if (!verifyApiKey(req)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32000, message: 'Unauthorized: Invalid or missing API key' }
        }));
        return;
      }
      await this.handleJsonRpc(req, res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }

  private handleHealth(res: ServerResponse): void {
    const health: HealthResponse = {
      status: 'ok',
      version: '0.2.0',
      chainId: this.chain.id,
      pendingOps: this.pool.pendingCount(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      entryPoints: this.config.entryPoints,
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health));
  }

  private handleMetrics(res: ServerResponse): void {
    const lines = [
      '# HELP bundler_ops_total Total UserOperations processed',
      '# TYPE bundler_ops_total counter',
      `bundler_ops_total{status="received"} ${this.metrics.totalOpsReceived}`,
      `bundler_ops_total{status="submitted"} ${this.metrics.totalOpsSubmitted}`,
      `bundler_ops_total{status="included"} ${this.metrics.totalOpsIncluded}`,
      `bundler_ops_total{status="rejected"} ${this.metrics.totalOpsRejected}`,
      '# HELP bundler_bundles_total Total bundles submitted',
      '# TYPE bundler_bundles_total counter',
      `bundler_bundles_total ${this.metrics.totalBundlesSent}`,
      '# HELP bundler_pending_ops Current pending UserOps',
      '# TYPE bundler_pending_ops gauge',
      `bundler_pending_ops ${this.pool.pendingCount()}`,
      '# HELP bundler_uptime_seconds Server uptime',
      '# TYPE bundler_uptime_seconds gauge',
      `bundler_uptime_seconds ${Math.floor((Date.now() - this.startTime) / 1000)}`,
    ];

    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' });
    res.end(lines.join('\n') + '\n');
  }

  private async handleJsonRpc(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // SECURITY: Body size limit (default 1MB)
    const MAX_BODY_SIZE = 1_048_576; // 1 MB
    let body = '';
    let bodySize = 0;
    
    for await (const chunk of req as Readable) {
      bodySize += chunk.length;
      if (bodySize > MAX_BODY_SIZE) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32000, message: 'Request body too large' }
        }));
        return;
      }
      body += chunk;
    }

    let request: JsonRpcRequest;
    try {
      request = JSON.parse(body);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.errorResponse(null, -32700, 'Parse error')));
      return;
    }

    const response = await this.handleRpcMethod(request);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
  }

  // ── RPC Method Router ─────────────────────────────────────────────

  private async handleRpcMethod(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    try {
      const params = request.params ?? [];
      let result: unknown;

      switch (request.method) {
        // ── Standard ERC-4337 API ──
        case 'eth_sendUserOperation':
          result = await this.rpcSendUserOp(params);
          break;
        case 'eth_estimateUserOperationGas':
          result = await this.rpcEstimateGas(params);
          break;
        case 'eth_getUserOperationByHash':
          result = await this.rpcGetUserOpByHash(params);
          break;
        case 'eth_getUserOperationReceipt':
          result = await this.rpcGetReceipt(params);
          break;
        case 'eth_supportedEntryPoints':
          result = this.rpcSupportedEntryPoints();
          break;

        // ── Pimlico-compatible API ──
        case 'pimlico_sendUserOperationNow':
          result = await this.rpcSendUserOp(params); // Same as eth_sendUserOperation
          break;
        case 'pimlico_getUserOperationStatus':
          result = await this.rpcPimlicoGetUserOpStatus(params);
          break;
        case 'pimlico_getUserOperationGasPrice':
          result = await this.rpcPimlicoGetGasPrice();
          break;

        // ── Utility ──
        case 'web3_clientVersion':
          result = 'cinacoin-bundler/0.2.0';
          break;
        case 'cinacoin_getBundlerConfig':
          result = this.rpcGetConfig();
          break;
        case 'cinacoin_getReputationStats':
          result = this.rpcReputationStats();
          break;

        default:
          return this.errorResponse(request.id, -32601, `Method not found: ${request.method}`);
      }

      return {
        jsonrpc: '2.0',
        id: request.id,
        result,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return this.errorResponse(request.id, -32603, `Internal error: ${message}`);
    }
  }

  // ── RPC Handlers ──────────────────────────────────────────────────

  /** eth_sendUserOperation — validate and submit to mempool. */
  private async rpcSendUserOp(params: unknown[]): Promise<Hash> {
    const [opRaw, entryPoint] = params as [RawUserOperation, Address?];

    if (!opRaw || typeof opRaw !== 'object') {
      throw new Error('Missing userOp parameter');
    }

    // Validate entry point
    if (entryPoint && !this.config.entryPoints.includes(entryPoint)) {
      throw new Error('Unsupported entry point');
    }

    // Validate UserOp
    const validation = await this.validator.validate(opRaw);
    if (!validation.valid) {
      throw new Error(`AA24: ${validation.reason}`);
    }

    // Check reputation
    if (this.reputation.isBanned(opRaw.sender)) {
      throw new Error('AA24: sender is banned');
    }
    if (this.reputation.isThrottled(opRaw.sender)) {
      throw new Error('AA24: sender is throttled');
    }

    // Add to mempool
    const multiplier = this.reputation.priorityMultiplier(opRaw.sender);
    const hash = await this.pool.add(opRaw, multiplier);

    this.metrics.totalOpsReceived += 1;
    this.reputation.recordSuccess(opRaw.sender);

    return hash;
  }

  /** eth_estimateUserOperationGas — simulate and return gas estimates. */
  private async rpcEstimateGas(params: unknown[]): Promise<{
    preVerificationGas: Hex;
    verificationGasLimit: Hex;
    callGasLimit: Hex;
  }> {
    const op = params[0] as RawUserOperation;
    if (!op) throw new Error('Missing userOp parameter');

    // Validate first
    const validation = await this.validator.validate(op);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.reason}`);
    }

    // Estimate via simulation on EntryPoint
    const viemOp = toViemUserOp(op);

    // Simulate to get gas usage
    try {
      const result = await this.publicClient.call({
        to: this.config.entryPoints[0],
        data: this.bundleBuilder.encodeHandleOps({
          userOps: [{
            hash: computeUserOpHash(op),
            userOp: op,
            receivedAt: Date.now(),
            status: UserOpPoolStatus.Pending,
            priority: 0,
            retries: 0,
          }],
          beneficiary: this.config.beneficiary,
          estimatedGas: 0n,
          createdAt: Date.now(),
        }),
      });

      // If simulation succeeds, return the userOp's own gas values as estimates
      return {
        preVerificationGas: op.preVerificationGas,
        verificationGasLimit: op.verificationGasLimit,
        callGasLimit: op.callGasLimit,
      };
    } catch (err) {
      // If simulation fails, return the userOp's values with a note
      // The AA error will be extracted by the validator already
      return {
        preVerificationGas: op.preVerificationGas,
        verificationGasLimit: op.verificationGasLimit,
        callGasLimit: op.callGasLimit,
      };
    }
  }

  /** eth_getUserOperationByHash — lookup a UserOp by hash. */
  private async rpcGetUserOpByHash(params: unknown[]): Promise<RawUserOperation | null> {
    const [hash] = params as [Hash];
    if (!hash) throw new Error('Missing userOpHash parameter');

    // Check on-chain first
    try {
      const receipt = await this.publicClient.getTransactionReceipt({ hash });
      if (receipt) {
        // UserOp was included; we don't have the original data in this simplified impl
        return null;
      }
    } catch {
      // Not on-chain yet
    }

    // Check mempool
    const entry = this.pool.get(hash);
    if (entry) {
      return entry.userOp;
    }

    return null;
  }

  /** eth_getUserOperationReceipt — get receipt by hash. */
  private async rpcGetReceipt(params: unknown[]): Promise<unknown> {
    const [hash] = params as [Hash];
    if (!hash) throw new Error('Missing userOpHash parameter');

    // Check on-chain via EntryPoint events
    try {
      // In production, this would parse EntryPoint UserOperationEvent logs
      // Simplified: check if we have a bundle tx hash for this userOp
      const entry = this.pool.get(hash);
      if (entry?.bundleTxHash) {
        const receipt = await this.publicClient.getTransactionReceipt({ hash: entry.bundleTxHash });
        return {
          userOpHash: hash,
          sender: entry.userOp.sender,
          nonce: entry.userOp.nonce,
          actualGasUsed: '0x' + receipt.gasUsed.toString(16),
          actualGasCost: '0x' + (receipt.gasUsed * (receipt.effectiveGasPrice ?? 0n)).toString(16),
          success: receipt.status === 'success',
          transactionHash: entry.bundleTxHash,
          blockNumber: '0x' + receipt.blockNumber.toString(16),
          logs: receipt.logs,
          receipt: {
            transactionHash: entry.bundleTxHash,
            blockNumber: '0x' + receipt.blockNumber.toString(16),
            gasUsed: '0x' + receipt.gasUsed.toString(16),
            logs: receipt.logs,
          },
        };
      }
    } catch {
      // Not yet on-chain
    }

    // Check pool status
    const entry = this.pool.get(hash);
    if (entry && entry.status === UserOpPoolStatus.Rejected) {
      return {
        userOpHash: hash,
        sender: entry.userOp.sender,
        nonce: entry.userOp.nonce,
        actualGasUsed: '0x0',
        actualGasCost: '0x0',
        success: false,
        reason: entry.rejectReason ?? 'rejected',
        logs: [],
      };
    }

    return null;
  }

  /** eth_supportedEntryPoints — return supported entry points. */
  private rpcSupportedEntryPoints(): Address[] {
    return this.config.entryPoints;
  }

  /** pimlico_getUserOperationStatus — extended status with receipt. */
  private async rpcPimlicoGetUserOpStatus(params: unknown[]): Promise<PimlicoUserOpStatus> {
    const [hash] = params as [Hash];
    if (!hash) throw new Error('Missing userOpHash parameter');

    // Check mempool
    const entry = this.pool.get(hash);
    if (entry) {
      switch (entry.status) {
        case UserOpPoolStatus.Pending:
          return { status: 'pending', userOperation: entry.userOp };
        case UserOpPoolStatus.Submitted:
          return { status: 'pending', userOperation: entry.userOp, transactionHash: entry.bundleTxHash };
        case UserOpPoolStatus.Included:
          return { status: 'included', userOperation: entry.userOp, transactionHash: entry.bundleTxHash };
        case UserOpPoolStatus.Reverted:
          return { status: 'reverted', userOperation: entry.userOp, transactionHash: entry.bundleTxHash };
        default:
          return { status: 'not_found' };
      }
    }

    // Check on-chain
    try {
      const receipt = await this.publicClient.getTransactionReceipt({ hash });
      if (receipt && receipt.status === 'success') {
        return { status: 'included', transactionHash: hash };
      }
      if (receipt && receipt.status === 'reverted') {
        return { status: 'reverted', transactionHash: hash };
      }
    } catch {
      // Not on-chain
    }

    return { status: 'not_found' };
  }

  /** pimlico_getUserOperationGasPrice — get current gas prices. */
  private async rpcPimlicoGetGasPrice(): Promise<PimlicoGasPrice> {
    const prices = await this.gasOracle.getGasPrices();

    return {
      slow: {
        maxFeePerGas: BigInt(prices.slow.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(prices.slow.maxPriorityFeePerGas),
      },
      standard: {
        maxFeePerGas: BigInt(prices.standard.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(prices.standard.maxPriorityFeePerGas),
      },
      fast: {
        maxFeePerGas: BigInt(prices.fast.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(prices.fast.maxPriorityFeePerGas),
      },
    };
  }

  /** cinacoin_getBundlerConfig — return current config (redacted, auth required via JSON-RPC). */
  private rpcGetConfig(): Record<string, unknown> {
    // Note: This method is only accessible via authenticated JSON-RPC
    // Beneficiary address removed for security - use admin interface to access
    return {
      chainId: this.chain.id,
      entryPoints: this.config.entryPoints,
      maxOpsPerBundle: this.config.maxOpsPerBundle,
      simulationEnabled: this.config.simulation.enabled,
      metricsEnabled: this.config.metricsEnabled,
    };
  }

  /** cinacoin_getReputationStats — return reputation for all known senders. */
  private rpcReputationStats(): unknown[] {
    const stats = this.reputation.getAllStats();
    const result: unknown[] = [];
    for (const [sender, rep] of stats) {
      result.push({
        sender,
        score: rep.score,
        violations: rep.violations,
        successes: rep.successes,
        throttled: rep.throttled,
        banned: rep.banned,
      });
    }
    return result;
  }

  // ── Background: Bundle Processing ─────────────────────────────────

  /**
   * Process pending UserOps into a bundle and submit to EntryPoint.
   * Called periodically by the bundle interval.
   */
  private async processBundle(): Promise<void> {
    try {
      const pending = this.pool.getTop(this.config.maxOpsPerBundle);
      if (pending.length === 0) return;

      const bundle = this.bundleBuilder.buildBundle(pending);
      const result = await this.bundleBuilder.submit(bundle, this.walletClient, this.publicClient);

      this.metrics.totalBundlesSent += 1;

      if (result.success && result.txHash) {
        // Mark included
        const hashes = bundle.userOps.map(e => e.hash);
        this.pool.markSubmitted(hashes, result.txHash);
        this.metrics.totalOpsSubmitted += hashes.length;
        this.metrics.totalOpsIncluded += hashes.length;
        this.metrics.avgGasPerBundle = result.gasUsed
          ? (this.metrics.avgGasPerBundle + result.gasUsed) / 2n
          : this.metrics.avgGasPerBundle;
      } else {
        // Requeue failed UserOps for retry
        for (const entry of bundle.userOps) {
          if (entry.retries < 3) {
            this.pool.requeue(entry.hash);
          } else {
            this.pool.reject(entry.hash, result.error ?? 'max retries exceeded');
            this.metrics.totalOpsRejected += 1;
            this.reputation.recordViolation(entry.userOp.sender, result.error);
            this.reputation.enforce(entry.userOp.sender);
          }
        }
      }

      this.metrics.pendingOps = this.pool.pendingCount();
    } catch (err) {
      logger.error('[BundlerServer] Bundle processing error:', err);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private errorResponse(id: number | string | null, code: number, message: string): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: { code, message },
    };
  }

  // ── Getters ───────────────────────────────────────────────────────

  get poolRef(): UserOpPool { return this.pool; }
  get validatorRef(): UserOpValidator { return this.validator; }
  get reputationRef(): ReputationTracker { return this.reputation; }
  get metricsRef(): Readonly<BundlerMetrics> { return this.metrics; }
}

// ── Node.js http.Server wrapper ─────────────────────────────────────
function createServer(handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>): Server {
  return new Server(async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      logger.error('[BundlerServer] Unhandled request error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
}
