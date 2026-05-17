import type { NextRequest, NextResponse } from 'next/server';
import type { ChainConfig } from '@cinaconnect/react';
/**
 * Options for creating a server-side CinaConnect client.
 */
export interface ServerClientOptions {
    /** CinaConnect project ID. */
    projectId: string;
    /** Supported chains (optional — defaults to Ethereum mainnet). */
    chains?: ChainConfig[];
    /** Cookie name for the session token. @default 'cinaconnect-session' */
    cookieName?: string;
    /** SIWE domain for message verification. @default process.env.NEXT_PUBLIC_URL or hostname */
    domain?: string;
    /** Secret key for signing session cookies. */
    secret?: string;
}
/**
 * Session data extracted from an authenticated request.
 */
export interface ServerSession {
    /** Ethereum address of the connected wallet. */
    address: string;
    /** Chain ID the wallet is connected to. */
    chainId: number;
    /** SIWE message nonce (for replay protection). */
    nonce: string;
    /** Token expiration timestamp (Unix seconds). */
    expiresAt: number;
    /** Raw session token string. */
    token: string;
}
/**
 * Server-side CinaConnect client instance.
 */
export interface ServerClient {
    /**
     * Extract session data from a Next.js request.
     *
     * @param req - NextRequest or standard Web Request object.
     * @returns The session if valid, or `null` if no session is found.
     */
    getSession(req: NextRequest | Request): Promise<ServerSession | null>;
    /**
     * Verify a SIWE message signature server-side.
     *
     * @param message - The full SIWE message string.
     * @param signature - The hex-encoded signature (0x-prefixed).
     * @returns The recovered address if verification succeeds.
     * @throws Error if verification fails.
     */
    verifySiweMessage(message: string, signature: string): Promise<string>;
    /**
     * Create an authenticated Next.js API route handler.
     *
     * Wraps the handler and injects the session as the second argument.
     * If no valid session is found, returns 401 Unauthorized.
     *
     * @param handler - Your API route handler function.
     * @returns A wrapped handler that enforces authentication.
     */
    withAuth<T extends NextRequest | Request, R extends NextResponse | Response>(handler: (req: T, session: ServerSession) => Promise<R>): (req: T) => Promise<R>;
}
/**
 * Create a server-side CinaConnect client for use in API routes, middleware,
 * and server components.
 *
 * ```ts
 * const client = createServerClient({
 *   projectId: process.env.CINACONNECT_PROJECT_ID!,
 *   secret: process.env.CINACONNECT_SECRET,
 * });
 *
 * const session = await client.getSession(req);
 * ```
 *
 * @param options - Configuration options for the server client.
 * @returns A ServerClient instance with auth utilities.
 */
export declare function createServerClient(options: ServerClientOptions): ServerClient;
/**
 * Get (or lazily create) the singleton server-side CinaConnect client.
 *
 * Call this once during initialization. Subsequent calls return the same instance.
 *
 * ```ts
 * import { getCinaConnectServer } from '@cinaconnect/next/server';
 *
 * // In an API route:
 * export async function GET(req: Request) {
 *   const client = getCinaConnectServer({ projectId: 'your-id' });
 *   const session = await client.getSession(req);
 *   return Response.json({ address: session?.address });
 * }
 * ```
 *
 * @param options - Configuration options (used only on first call).
 * @returns The singleton ServerClient instance.
 */
export declare function getCinaConnectServer(options: ServerClientOptions): ServerClient;
/**
 * Internal options for getSession (narrower than full ServerClientOptions).
 */
interface GetSessionOptions {
    cookieName: string;
    secret?: string;
}
/**
 * Extract a CinaConnect session from a Next.js request's cookies.
 *
 * Reads the session cookie, decodes it, and validates the token.
 * Returns `null` if no valid session is found.
 *
 * ```ts
 * const session = await getSession(req);
 * if (session) {
 *   console.log('Connected address:', session.address);
 * }
 * ```
 *
 * @param req - NextRequest (edge/runtime) or standard Web Request.
 * @param options - Cookie name and secret for decoding.
 * @returns The session or null.
 */
export declare function getSession(req: NextRequest | Request, options?: GetSessionOptions): Promise<ServerSession | null>;
/**
 * Verify a SIWE (Sign-In with Ethereum) message server-side.
 *
 * Parses the SIWE message, recovers the signer address from the signature,
 * and validates the message fields (domain, chainId, nonce, expiration).
 *
 * ```ts
 * const recovered = await verifySiweMessage(message, signature, {
 *   projectId: '...',
 *   domain: 'myapp.com',
 * });
 * // recovered === '0x...' — the address that signed
 * ```
 *
 * @param message - The full SIWE message string (per EIP-4361).
 * @param signature - Hex-encoded signature (0x-prefixed, 65 bytes).
 * @param options - Server client options (used for domain validation).
 * @returns The recovered Ethereum address.
 * @throws Error if verification fails or the message is invalid.
 */
export declare function verifySiweMessage(message: string, signature: string, options: ServerClientOptions): Promise<string>;
/**
 * Wrap a Next.js API route handler with CinaConnect authentication.
 *
 * The handler receives the `req` and the validated `session` as arguments.
 * If authentication fails, returns a 401 response automatically.
 *
 * Works with both App Router (`app/api/.../route.ts`) and Pages Router
 * (`pages/api/...`).
 *
 * ```ts
 * // app/api/profile/route.ts
 * import { withCinaConnectAuth } from '@cinaconnect/next/server';
 *
 * export const GET = withCinaConnectAuth(async (req, session) => {
 *   return Response.json({ address: session.address });
 * });
 * ```
 *
 * @param handler - Your API route handler function.
 * @param options - Optional server client configuration.
 * @returns A wrapped handler that enforces authentication.
 */
export declare function withCinaConnectAuth<T extends NextRequest | Request, R extends NextResponse | Response>(handler: (req: T, session: ServerSession) => Promise<R>, options?: Partial<ServerClientOptions>): (req: T) => Promise<R>;
/**
 * Next.js middleware that requires authentication.
 *
 * Use in `middleware.ts` at the project root to protect routes.
 * Redirects unauthenticated requests to a login page.
 *
 * ```ts
 * // middleware.ts
 * import { NextResponse } from 'next/server';
 * import { requireAuth } from '@cinaconnect/next/server';
 *
 * export const middleware = requireAuth({
 *   loginUrl: '/login',
 *   publicPaths: ['/', '/api/health'],
 * });
 *
 * export const config = {
 *   matcher: ['/dashboard/:path*', '/api/:path*'],
 * };
 * ```
 *
 * @param options - Configuration for the auth middleware.
 * @returns A Next.js middleware function.
 */
export declare function requireAuth(options?: {
    /** Path to redirect unauthenticated users to. @default '/login' */
    loginUrl?: string;
    /** Paths that do not require authentication. */
    publicPaths?: string[];
    /** Cookie name for the session token. @default 'cinaconnect-session' */
    cookieName?: string;
}): (req: NextRequest) => Promise<NextResponse<unknown>>;
export {};
//# sourceMappingURL=middleware.d.ts.map