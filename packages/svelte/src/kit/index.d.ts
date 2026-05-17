/**
 * SvelteKit integration for CinaConnect.
 *
 * Provides SSR-safe utilities for server-side session verification,
 * load function helpers, and SSR-safe store initialization.
 *
 * Import from `@cinaconnect/svelte/kit`:
 *
 * ```ts
 * import { getCinaConnectServer, ssrSafeStore } from '@cinaconnect/svelte/kit';
 * ```
 *
 * @packageDocumentation
 */
import { type Writable } from 'svelte/store';
import type { Handle, Load } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
/**
 * Session data returned from server-side verification.
 */
export interface CinaConnectSession {
    /** Whether the user has an active wallet session. */
    isAuthenticated: boolean;
    /** Connected account address, or null. */
    address: string | null;
    /** Connected chain ID, or null. */
    chainId: number | null;
    /** Session expiration timestamp (ms), or null. */
    expiresAt: number | null;
    /** Raw session payload (implementation-specific). */
    raw?: Record<string, unknown>;
}
/**
 * CinaConnect server-side API.
 *
 * Use this in `+layout.server.ts` or `+page.server.ts` to verify
 * wallet sessions server-side.
 */
export interface CinaConnectServer {
    /**
     * Get the current session from the request.
     *
     * Reads the CinaConnect session cookie or authorization header
     * and verifies it against the relay server.
     *
     * @param event - SvelteKit RequestEvent.
     * @returns Promise resolving with session data.
     */
    getSession(event: RequestEvent): Promise<CinaConnectSession>;
    /**
     * Verify a session token.
     *
     * @param token - Session token to verify.
     * @returns Promise resolving with session data.
     */
    verifySession(token: string): Promise<CinaConnectSession>;
    /**
     * Create a server-side handle middleware.
     *
     * Attaches session data to `event.locals.cinaConnect`.
     *
     * @param options - Middleware configuration.
     * @returns SvelteKit Handle function.
     */
    createHandle(options?: CinaConnectHandleOptions): Handle;
}
/**
 * Options for the CinaConnect SvelteKit handle middleware.
 */
export interface CinaConnectHandleOptions {
    /** Cookie name for the session token. Defaults to `cinaconnect_session`. */
    cookieName?: string;
    /** Header name for the session token. Defaults to `X-CinaConnect-Session`. */
    headerName?: string;
    /** Relay URL for session verification. */
    relayUrl?: string;
    /** Whether to redirect unauthenticated requests. */
    requireAuth?: boolean;
    /** Path to redirect to if authentication is required but missing. */
    loginPath?: string;
    /** Paths to exclude from authentication requirement. */
    publicPaths?: string[];
}
/**
 * Get or create the CinaConnect server API instance.
 *
 * Call this in server-side code (load functions, hooks, actions).
 *
 * @example
 * ```ts
 * // +layout.server.ts
 * import { getCinaConnectServer } from '@cinaconnect/svelte/kit';
 *
 * export const load = async ({ cookies }) => {
 *   const server = getCinaConnectServer();
 *   const session = await server.getSession(/* event *\/);
 *   return { session };
 * };
 * ```
 *
 * @returns CinaConnectServer instance.
 */
export declare function getCinaConnectServer(): CinaConnectServer;
/**
 * Check if code is running in a browser environment.
 *
 * @returns `true` if in browser, `false` if in Node.js/SSR.
 */
export declare function isBrowser(): boolean;
/**
 * SSR-safe store value initializer.
 *
 * Returns the provided value during SSR and in the browser.
 * Useful for initializing stores that would otherwise fail during
 * server-side rendering (e.g., accessing `localStorage`).
 *
 * @param value - The value to use.
 * @param fallback - Optional fallback for SSR (defaults to `value`).
 * @returns The value (or fallback during SSR).
 *
 * @example
 * ```ts
 * import { ssrSafeStore } from '@cinaconnect/svelte/kit';
 *
 * const savedChain = ssrSafeStore(
 *   () => localStorage.getItem('chainId'),
 *   null,
 * );
 * ```
 */
export declare function ssrSafeStore<T>(getValue: () => T, fallback?: T): T;
/**
 * Create an SSR-safe writable store.
 *
 * During SSR, the store is initialized with the fallback value.
 * On hydration, it reads from the provided getter (e.g., localStorage).
 *
 * @param getValue - Function to get the initial value (browser only).
 * @param fallback - Fallback value for SSR.
 * @returns A Svelte writable store.
 */
export declare function createSsrSafeWritable<T>(getValue: () => T, fallback: T): Writable<T>;
/**
 * Helper to create a load function that injects session data.
 *
 * @param options - Configuration options.
 * @returns SvelteKit Load function.
 *
 * @example
 * ```ts
 * import { createCinaConnectLoad } from '@cinaconnect/svelte/kit';
 *
 * export const load = createCinaConnectLoad({
 *   transform: (session) => ({ userAddress: session.address }),
 * });
 * ```
 */
export declare function createCinaConnectLoad(options?: {
    transform?: (session: CinaConnectSession) => Record<string, unknown>;
    parent?: Load;
}): Load;
declare module '@sveltejs/kit' {
    interface Locals {
        /** CinaConnect session data (attached by handle middleware). */
        cinaConnect?: CinaConnectSession;
    }
}
//# sourceMappingURL=index.d.ts.map