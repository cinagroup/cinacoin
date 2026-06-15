/**
 * @cinacoin/nuxt — Nitro server route integration
 *
 * Provides Nitro plugin support for server-side API routes,
 * enabling server-side wallet operations, SIWE verification,
 * and authenticated API endpoints in Nuxt 3.
 *
 * Features:
 * - Nitro server route handlers for wallet operations
 * - Server-side SIWE verification
 * - Authenticated API route helpers
 * - Session management via server cookies
 * - RPC proxy for server-side chain calls
 *
 * @example
 * ```ts
 * // server/api/cinacoin/verify.post.ts
 * import { defineCinacoinHandler, verifySiweMessage } from '@cinacoin/nuxt/nitro';
 *
 * export default defineCinacoinHandler(async (event, session) => {
 *   const body = await readBody(event);
 *   const address = await verifySiweMessage(body.message, body.signature, {
 *     projectId: '...',
 *   });
 *   return { address };
 * });
 * ```
 */

import type { H3Event, EventHandlerRequest } from 'h3';
import {
  defineEventHandler,
  readBody,
  getHeader,
  setCookie,
  getCookie,
  sendError,
  createError,
  readRawBody,
  getRequestURL,
  type EventHandler,
} from 'h3';
import { logger } from '@cinacoin/logger';

// ============================================================================
// Types
// ============================================================================

/**
 * Nitro plugin configuration for Cinacoin server routes.
 */
export interface NitroCinacoinConfig {
  /** Cinacoin project ID. */
  projectId: string;

  /** Secret for signing session tokens (JWT). */
  secret?: string;

  /** Session cookie name. @default 'cinacoin-session' */
  cookieName?: string;

  /** Session cookie max age in seconds. @default 86400 (24h) */
  cookieMaxAge?: number;

  /** Session cookie domain. */
  cookieDomain?: string;

  /** Session cookie path. @default '/' */
  cookiePath?: string;

  /** Whether cookie requires HTTPS. @default true in production */
  cookieSecure?: boolean;

  /** SIWE domain for verification. */
  siweDomain?: string;

  /** SIWE nonce TTL in seconds. @default 300 (5min) */
  nonceTTL?: number;

  /** RPC endpoint URL for server-side chain calls. */
  rpcUrl?: string;

  /** Enable debug logging. @default false */
  debug?: boolean;
}

/**
 * Server-side session data stored in JWT.
 */
export interface NitroSession {
  /** Wallet address. */
  address: string;
  /** Chain ID. */
  chainId: number;
  /** Session nonce. */
  nonce: string;
  /** Session creation timestamp (Unix seconds). */
  createdAt: number;
  /** Session expiration timestamp (Unix seconds). */
  expiresAt: number;
}

/**
 * Handler function with session context.
 */
export type NitroCinacoinHandler<T = unknown> = (
  event: H3Event<EventHandlerRequest>,
  session: NitroSession,
) => Promise<T> | T;

/**
 * SIWE verification request body.
 */
export interface SiweVerifyRequest {
  /** SIWE message string (EIP-4361 format). */
  message: string;
  /** Hex-encoded signature. */
  signature: string;
  /** Optional chain ID override. */
  chainId?: number;
}

/**
 * Server-side nonce store entry.
 */
interface NonceEntry {
  nonce: string;
  createdAt: number;
  expiresAt: number;
}

// ============================================================================
// Nonce Store (in-memory, suitable for single-instance deployments)
// ============================================================================

/** In-memory nonce store. For multi-instance, use Redis or similar. */
const nonceStore = new Map<string, NonceEntry>();

/**
 * Store a nonce for verification.
 */
export function storeNonce(nonce: string, ttlSeconds: number = 300): void {
  const now = Math.floor(Date.now() / 1000);
  nonceStore.set(nonce, {
    nonce,
    createdAt: now,
    expiresAt: now + ttlSeconds,
  });

  // Clean expired nonces periodically
  if (nonceStore.size > 1000) {
    for (const [key, entry] of nonceStore) {
      if (entry.expiresAt < now) {
        nonceStore.delete(key);
      }
    }
  }
}

/**
 * Verify and consume a nonce (one-time use).
 *
 * @returns true if nonce is valid and not expired
 */
export function verifyNonce(nonce: string): boolean {
  const entry = nonceStore.get(nonce);
  if (!entry) return false;

  const now = Math.floor(Date.now() / 1000);
  nonceStore.delete(nonce); // One-time use

  return entry.expiresAt > now;
}

// ============================================================================
// Session Token Management
// ============================================================================

/**
 * Create a signed JWT session token.
 */
export async function createSessionToken(
  session: Omit<NitroSession, 'createdAt' | 'expiresAt'>,
  config: NitroCinacoinConfig,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const maxAge = config.cookieMaxAge ?? 86400;

  const payload = {
    address: session.address,
    chainId: session.chainId,
    nonce: session.nonce,
    createdAt: now,
    expiresAt: now + maxAge,
  };

  if (config.secret) {
    // Production: sign with jose
    const { SignJWT } = await import('jose');
    const encoder = new TextEncoder();
    const key = encoder.encode(config.secret);

    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(maxAge)
      .setIssuedAt()
      .sign(key);
  }

  // Dev mode: base64-encoded JSON (no signature)
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Decode and verify a session token.
 */
export async function decodeSessionToken(
  token: string,
  config: NitroCinacoinConfig,
): Promise<NitroSession | null> {
  try {
    let payload: NitroSession | null = null;

    if (config.secret) {
      const { jwtVerify } = await import('jose');
      const encoder = new TextEncoder();
      const key = encoder.encode(config.secret);

      const { payload: verified } = await jwtVerify(token, key, {
        algorithms: ['HS256'],
      });

      payload = verified as unknown as NitroSession;
    } else {
      payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    }

    if (!payload?.address || !payload?.expiresAt) return null;

    // Check expiration
    if (payload.expiresAt < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// ============================================================================
// Session Cookie Management
// ============================================================================

/**
 * Set session cookie on the response.
 */
export function setSessionCookie(
  event: H3Event<EventHandlerRequest>,
  token: string,
  config: NitroCinacoinConfig,
): void {
  const cookieName = config.cookieName ?? 'cinacoin-session';
  const maxAge = config.cookieMaxAge ?? 86400;
  const isProduction = process.env.NODE_ENV === 'production';

  setCookie(event, cookieName, token, {
    httpOnly: true,
    secure: config.cookieSecure ?? isProduction,
    sameSite: 'lax',
    maxAge,
    path: config.cookiePath ?? '/',
    domain: config.cookieDomain,
  });
}

/**
 * Get session from request cookie.
 */
export async function getSessionFromCookie(
  event: H3Event<EventHandlerRequest>,
  config: NitroCinacoinConfig,
): Promise<NitroSession | null> {
  const cookieName = config.cookieName ?? 'cinacoin-session';
  const token = getCookie(event, cookieName);

  if (!token) return null;
  return decodeSessionToken(token, config);
}

/**
 * Clear session cookie.
 */
export function clearSessionCookie(
  event: H3Event<EventHandlerRequest>,
  config: NitroCinacoinConfig,
): void {
  const cookieName = config.cookieName ?? 'cinacoin-session';
  setCookie(event, cookieName, '', { maxAge: 0, path: config.cookiePath ?? '/' });
}

// ============================================================================
// Nitro Route Handlers
// ============================================================================

/**
 * Create a Nitro handler for SIWE session creation.
 *
 * Verifies a SIWE message and creates a session cookie.
 *
 * Usage in server/api/cinacoin/login.post.ts:
 * ```ts
 * import { createSiweLoginHandler } from '@cinacoin/nuxt/nitro';
 *
 * export default createSiweLoginHandler({
 *   projectId: process.env.NUXT_PUBLIC_CINACOIN_PROJECT_ID,
 *   secret: process.env.CINACOIN_SECRET,
 * });
 * ```
 */
export function createSiweLoginHandler(config: NitroCinacoinConfig): EventHandler {
  return defineEventHandler(async (event) => {
    try {
      const body = await readBody<SiweVerifyRequest>(event);

      if (!body?.message || !body?.signature) {
        return sendError(
          event,
          createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'Missing message or signature',
          }),
        );
      }

      // Verify SIWE message using viem
      const { recoverAddress, hashMessage } = await import('viem');

      const msgHash = hashMessage(body.message);
      const recoveredAddress = await recoverAddress({
        hash: msgHash,
        signature: body.signature as `0x${string}`,
      });

      // Parse nonce from SIWE message
      const nonceMatch = body.message.match(/Nonce:\s*(\S+)/);
      if (!nonceMatch) {
        return sendError(
          event,
          createError({
            statusCode: 400,
            statusMessage: 'Bad Request',
            message: 'SIWE message missing nonce',
          }),
        );
      }

      const nonce = nonceMatch[1];

      // Verify nonce is valid (if nonce store is being used)
      if (nonceStore.size > 0 && !verifyNonce(nonce)) {
        return sendError(
          event,
          createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
            message: 'Invalid or expired nonce',
          }),
        );
      }

      // Parse chain ID from SIWE message
      const chainIdMatch = body.message.match(/Chain ID:\s*(\d+)/);
      const chainId = body.chainId ?? (chainIdMatch ? parseInt(chainIdMatch[1], 10) : 1);

      // Create session
      const session: Omit<NitroSession, 'createdAt' | 'expiresAt'> = {
        address: recoveredAddress,
        chainId,
        nonce,
      };

      const token = await createSessionToken(session, config);
      setSessionCookie(event, token, config);

      if (config.debug) {
        logger.debug('[NitroCinacoin] Session created for:', recoveredAddress);
      }

      return {
        success: true,
        address: recoveredAddress,
        chainId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      logger.error('[NitroCinacoin] Login failed:', message);

      return sendError(
        event,
        createError({
          statusCode: 401,
          statusMessage: 'Unauthorized',
          message,
        }),
      );
    }
  });
}

/**
 * Create a Nitro handler for session logout.
 *
 * Usage in server/api/cinacoin/logout.post.ts:
 * ```ts
 * import { createLogoutHandler } from '@cinacoin/nuxt/nitro';
 *
 * export default createLogoutHandler({
 *   projectId: process.env.NUXT_PUBLIC_CINACOIN_PROJECT_ID,
 * });
 * ```
 */
export function createLogoutHandler(config: NitroCinacoinConfig): EventHandler {
  return defineEventHandler(async (event) => {
    clearSessionCookie(event, config);
    return { success: true };
  });
}

/**
 * Create a Nitro handler for getting current session.
 *
 * Usage in server/api/cinacoin/session.get.ts:
 * ```ts
 * import { createSessionHandler } from '@cinacoin/nuxt/nitro';
 *
 * export default createSessionHandler({
 *   projectId: process.env.NUXT_PUBLIC_CINACOIN_PROJECT_ID,
 *   secret: process.env.CINACOIN_SECRET,
 * });
 * ```
 */
export function createSessionHandler(config: NitroCinacoinConfig): EventHandler {
  return defineEventHandler(async (event) => {
    const session = await getSessionFromCookie(event, config);

    if (!session) {
      return { authenticated: false };
    }

    return {
      authenticated: true,
      address: session.address,
      chainId: session.chainId,
      expiresAt: session.expiresAt,
    };
  });
}

/**
 * Create a Nitro handler for generating SIWE nonces.
 *
 * Usage in server/api/cinacoin/nonce.get.ts:
 * ```ts
 * import { createNonceHandler } from '@cinacoin/nuxt/nitro';
 *
 * export default createNonceHandler({
 *   projectId: process.env.NUXT_PUBLIC_CINACOIN_PROJECT_ID,
 * });
 * ```
 */
export function createNonceHandler(config: NitroCinacoinConfig): EventHandler {
  return defineEventHandler(async () => {
    // Generate a random nonce
    const { randomBytes } = await import('crypto');
    const nonce = randomBytes(16).toString('hex');
    const ttl = config.nonceTTL ?? 300;

    // Store nonce for verification
    storeNonce(nonce, ttl);

    return { nonce };
  });
}

/**
 * Create a Nitro handler for server-side RPC calls.
 *
 * Proxies JSON-RPC calls to the configured RPC endpoint.
 *
 * Usage in server/api/cinacoin/rpc.post.ts:
 * ```ts
 * import { createRpcHandler } from '@cinacoin/nuxt/nitro';
 *
 * export default createRpcHandler({
 *   projectId: process.env.NUXT_PUBLIC_CINACOIN_PROJECT_ID,
 *   rpcUrl: process.env.CINACOIN_RPC_URL,
 *   secret: process.env.CINACOIN_SECRET,
 * });
 * ```
 */
export function createRpcHandler(config: NitroCinacoinConfig): EventHandler {
  return defineEventHandler(async (event) => {
    // Require authentication
    const session = await getSessionFromCookie(event, config);
    if (!session) {
      return sendError(
        event,
        createError({
          statusCode: 401,
          statusMessage: 'Unauthorized',
          message: 'Authentication required for RPC calls',
        }),
      );
    }

    if (!config.rpcUrl) {
      return sendError(
        event,
        createError({
          statusCode: 500,
          statusMessage: 'Internal Server Error',
          message: 'RPC URL not configured',
        }),
      );
    }

    try {
      const body = await readBody(event);

      const response = await fetch(config.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'RPC call failed';
      logger.error('[NitroCinacoin] RPC error:', message);

      return sendError(
        event,
        createError({
          statusCode: 502,
          statusMessage: 'Bad Gateway',
          message,
        }),
      );
    }
  });
}

// ============================================================================
// Nitro Plugin (auto-registers server routes)
// ============================================================================

/**
 * Cinacoin Nitro plugin configuration.
 *
 * Add to nuxt.config.ts:
 * ```ts
 * export default defineNuxtConfig({
 *   nitro: {
 *     plugins: ['~/server/plugins/cinacoin.ts'],
 *   },
 * });
 * ```
 */
export interface NitroPluginConfig {
  /** Cinacoin Nitro configuration. */
  config: NitroCinacoinConfig;

  /** Custom API prefix. @default '/api/cinacoin' */
  apiPrefix?: string;

  /** Whether to register default routes. @default true */
  registerRoutes?: boolean;
}

/**
 * Default server routes registered by the Nitro plugin.
 *
 * POST /api/cinacoin/login    — SIWE verification + session creation
 * POST /api/cinacoin/logout   — Session destruction
 * GET  /api/cinacoin/session  — Get current session
 * GET  /api/cinacoin/nonce    — Generate SIWE nonce
 * POST /api/cinacoin/rpc      — Server-side RPC proxy
 */
export const DEFAULT_ROUTES = {
  login: '/api/cinacoin/login',
  logout: '/api/cinacoin/logout',
  session: '/api/cinacoin/session',
  nonce: '/api/cinacoin/nonce',
  rpc: '/api/cinacoin/rpc',
} as const;

/**
 * Get Nitro config from environment variables.
 */
export function getNitroConfigFromEnv(): NitroCinacoinConfig {
  return {
    projectId: process.env.NUXT_PUBLIC_CINACOIN_PROJECT_ID ?? '',
    secret: process.env.CINACOIN_SECRET,
    rpcUrl: process.env.CINACOIN_RPC_URL,
    siweDomain: process.env.CINACOIN_SIWE_DOMAIN,
    debug: process.env.CINACOIN_DEBUG === 'true',
  };
}

// ============================================================================
// Re-exports from server/index.ts for convenience
// ============================================================================

export {
  parseSiweMessage,
  verifySiweMessage,
  getNuxtSession,
  checkAuth,
  cinaConnectAuth,
  defineCinacoinHandler,
  withCinacoinAuth,
} from './index';

export type {
  NuxtServerSession,
  NuxtAuthOptions,
  AuthResult,
} from './index';
