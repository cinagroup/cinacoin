/**
 * @cinaconnect/next/server — Core server client.
 *
 * Provides `createServerClient` and `getCinaConnectServer` for creating
 * server-side CinaConnect SDK instances.
 */
import type { NextRequest, NextResponse } from 'next/server';
export type { ServerSession } from './middleware.js';
export type { ServerClientOptions } from './middleware.js';
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
    getSession(req: NextRequest | Request): Promise<import('./middleware.js').ServerSession | null>;
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
     */
    withAuth<T extends NextRequest | Request, R extends NextResponse | Response>(handler: (req: T, session: import('./middleware.js').ServerSession) => Promise<R>): (req: T) => Promise<R>;
    /** Access resolved client options. */
    readonly options: import('./middleware.js').ServerClientOptions;
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
export declare function createServerClient(options: import('./middleware.js').ServerClientOptions): ServerClient;
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
export declare function getCinaConnectServer(options: import('./middleware.js').ServerClientOptions): ServerClient;
//# sourceMappingURL=core.d.ts.map