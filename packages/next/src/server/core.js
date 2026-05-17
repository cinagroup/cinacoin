/**
 * @cinaconnect/next/server — Core server client.
 *
 * Provides `createServerClient` and `getCinaConnectServer` for creating
 * server-side CinaConnect SDK instances.
 */
import { getSession, verifySiweMessage } from './middleware.js';
// ---------------------------------------------------------------------------
// Default chain
// ---------------------------------------------------------------------------
const defaultChain = {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
    },
    blockExplorerUrl: 'https://etherscan.io',
};
// ---------------------------------------------------------------------------
// createServerClient
// ---------------------------------------------------------------------------
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
export function createServerClient(options) {
    const resolvedOptions = {
        projectId: options.projectId,
        chains: options.chains ?? [defaultChain],
        cookieName: options.cookieName ?? 'cinaconnect-session',
        domain: options.domain ?? process.env.NEXT_PUBLIC_URL ?? 'localhost',
        secret: options.secret ?? '',
    };
    return {
        options: resolvedOptions,
        async getSession(req) {
            return getSession(req, {
                cookieName: resolvedOptions.cookieName,
                secret: resolvedOptions.secret,
            });
        },
        async verifySiweMessage(message, signature) {
            return verifySiweMessage(message, signature, resolvedOptions);
        },
        withAuth(handler) {
            return async (req) => {
                const session = await this.getSession(req);
                if (!session) {
                    return new Response(JSON.stringify({ error: 'Unauthorized', message: 'No valid session found.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
                }
                return handler(req, session);
            };
        },
    };
}
// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------
let _serverClient = null;
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
export function getCinaConnectServer(options) {
    if (!_serverClient) {
        _serverClient = createServerClient(options);
    }
    return _serverClient;
}
//# sourceMappingURL=core.js.map