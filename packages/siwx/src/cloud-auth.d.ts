/**
 * CloudAuth — Reown Dashboard-compatible cloud authentication for CinaConnect SIWX.
 *
 * Provides session management, JWT token handling, and multi-device session sync
 * via the CinaConnect Dashboard API. Designed to integrate with the SIWX plugin system.
 *
 * @packageDocumentation
 */
import type { SIWXResult } from './types.js';
/** Cloud session representing an authenticated user session in the dashboard. */
export interface CloudSession {
    /** Unique session identifier. */
    id: string;
    /** SIWX project ID from CinaConnect Dashboard. */
    projectId: string;
    /** Wallet address that authenticated. */
    address: string;
    /** Chain identifier (CAIP-2 format). */
    chainId: string;
    /** ISO 8601 timestamp when the session was created. */
    createdAt: string;
    /** ISO 8601 timestamp when the session expires. */
    expiresAt: string;
    /** JWT access token. */
    accessToken: string;
    /** JWT refresh token. */
    refreshToken: string;
    /** Device identifier for multi-device sync. */
    deviceId: string;
    /** Arbitrary metadata attached to the session. */
    metadata?: Record<string, string>;
}
/** Status of a session verification. */
export interface VerifyResult {
    /** Whether the session is valid. */
    valid: boolean;
    /** The session object (if valid). */
    session?: CloudSession;
    /** Error message (if invalid). */
    error?: string;
}
/** Configuration for CloudAuth initialization. */
export interface CloudAuthConfig {
    /** CinaConnect Dashboard project ID. */
    projectId: string;
    /** Dashboard API base URL (default: `https://api.cinaconnect.com/v1`). */
    apiUrl?: string;
    /** Auto-refresh tokens before expiry (default: true). */
    autoRefresh?: boolean;
    /** How many seconds before expiry to trigger refresh (default: 300). */
    refreshThresholdSec?: number;
    /** Custom fetch implementation (for SSR / polyfills). */
    fetch?: typeof fetch;
}
/** Events emitted by CloudAuth. */
export type CloudAuthEvent = {
    type: 'login';
    session: CloudSession;
} | {
    type: 'logout';
    sessionId: string;
} | {
    type: 'sessionExpired';
    sessionId: string;
} | {
    type: 'sessionRefreshed';
    session: CloudSession;
} | {
    type: 'error';
    error: Error;
};
/** Handler for CloudAuth events. */
export type CloudAuthEventHandler = (event: CloudAuthEvent) => void;
/**
 * CloudAuth manages authenticated sessions via the CinaConnect Dashboard API.
 *
 * It handles JWT token lifecycle (issue, refresh, revoke), multi-device session
 * synchronization, and integrates with the SIWX plugin system for cross-chain
 * authentication.
 *
 * @example
 * ```ts
 * import { CloudAuth } from '@cinaconnect/siwx';
 *
 * const auth = new CloudAuth({ projectId: 'your-project-id' });
 * await auth.init();
 *
 * // After SIWX sign-in:
 * const session = await auth.createSession({
 *   address: '0x...',
 *   chainId: 'eip155:1',
 *   siwxResult: siwxResult,
 * });
 *
 * // Verify on subsequent requests:
 * const { valid } = await auth.verifySession();
 * ```
 */
export declare class CloudAuth {
    /** Project ID for the CinaConnect Dashboard. */
    readonly projectId: string;
    /** Dashboard API base URL. */
    readonly apiUrl: string;
    /** Whether auto-refresh is enabled. */
    readonly autoRefresh: boolean;
    /** Seconds before expiry to trigger a refresh. */
    readonly refreshThresholdSec: number;
    /** Active session (if any). */
    private _session;
    /** Registered event handlers. */
    private _handlers;
    /** Auto-refresh timer handle. */
    private _refreshTimer;
    /** Custom fetch implementation. */
    private _fetch;
    /** SIWX verifier references for integration. */
    private _verifiers;
    constructor(config: CloudAuthConfig);
    /**
     * Initialize the CloudAuth instance.
     *
     * Restores any persisted session from local storage and sets up auto-refresh
     * if enabled. Call this once during app startup.
     *
     * @returns The restored session, or `null` if no active session exists.
     */
    init(): Promise<CloudSession | null>;
    /**
     * Create a new cloud session after successful SIWX authentication.
     *
     * Sends the SIWX signature and message to the CinaConnect Dashboard API
     * for server-side verification and JWT issuance.
     *
     * @param params - Session creation parameters.
     * @param params.address - Wallet address that authenticated.
     * @param params.chainId - CAIP-2 chain identifier.
     * @param params.siwxResult - SIWX verification result from the SIWX plugin.
     * @param params.deviceId - Device identifier for multi-device sync (auto-generated if omitted).
     * @param params.metadata - Optional session metadata.
     * @returns The created CloudSession.
     * @throws Error if the Dashboard API returns an error.
     */
    createSession(params: {
        address: string;
        chainId: string;
        siwxResult: SIWXResult;
        deviceId?: string;
        metadata?: Record<string, string>;
    }): Promise<CloudSession>;
    /**
     * Verify the current session.
     *
     * Checks the JWT access token validity against the Dashboard API. If the
     * token is expired and auto-refresh is enabled, attempts to refresh first.
     *
     * @returns VerifyResult with validity status and optional session.
     */
    verifySession(): Promise<VerifyResult>;
    /**
     * Revoke the current session.
     *
     * Invalidates the session on the server and clears local state.
     *
     * @returns `true` if revocation succeeded.
     */
    revokeSession(): Promise<boolean>;
    /**
     * Sync sessions across devices for the same wallet address.
     *
     * Returns a list of active sessions for the authenticated address,
     * allowing the user to see and manage sessions on other devices.
     *
     * @param address - Wallet address to query sessions for.
     * @returns Array of active session summaries.
     */
    listSessions(address: string): Promise<Array<{
        id: string;
        chainId: string;
        deviceId: string;
        createdAt: string;
        expiresAt: string;
        isCurrentDevice: boolean;
    }>>;
    /**
     * Revoke a specific session by ID (useful for revoking other devices).
     *
     * @param sessionId - Session ID to revoke.
     */
    revokeSessionById(sessionId: string): Promise<void>;
    /**
     * Refresh the current session's access token using the refresh token.
     *
     * Called automatically before token expiry when auto-refresh is enabled.
     *
     * @returns The updated CloudSession with fresh tokens.
     */
    refreshToken(): Promise<CloudSession>;
    private _refreshToken;
    /** Schedule the next auto-refresh. */
    private _scheduleRefresh;
    private _cancelRefresh;
    /**
     * Subscribe to CloudAuth events.
     *
     * @param handler - Callback invoked for every event.
     * @returns Unsubscribe function.
     */
    onEvent(handler: CloudAuthEventHandler): () => void;
    private _emit;
    /**
     * Register a verifier for a specific chain namespace.
     *
     * Used to integrate CloudAuth with the SIWX verifier registry.
     *
     * @param namespace - Chain namespace (e.g., 'eip155', 'solana').
     * @param verifier - Verifier instance for the chain.
     */
    registerVerifier(namespace: string, verifier: unknown): void;
    /**
     * Get a registered verifier by namespace.
     *
     * @param namespace - Chain namespace.
     * @returns The verifier, or `undefined` if not registered.
     */
    getVerifier(namespace: string): unknown | undefined;
    /** The currently active session, or `null`. */
    get session(): CloudSession | null;
    /** Convenience: whether a session is active. */
    get isAuthenticated(): boolean;
    /** Convenience: the current access token (or `null`). */
    get accessToken(): string | null;
    private _saveSession;
    private _loadSession;
    private _clearSession;
    private _getStorage;
    private _request;
    /** Fallback fetch for environments without globalThis.fetch. */
    private _nativeFetch;
    /** Generate a unique device identifier. */
    private _generateDeviceId;
}
/**
 * React hook for cloud session management.
 *
 * Provides a reactive interface to CloudAuth lifecycle, session CRUD, and
 * event subscriptions. Use this in React components to manage authentication
 * state.
 *
 * @param config - CloudAuth configuration (passed to the CloudAuth constructor).
 * @returns Object containing session state, actions, loading status, and errors.
 *
 * @example
 * ```tsx
 * import { useCloudAuth } from '@cinaconnect/siwx';
 *
 * function AuthButton() {
 *   const { session, isLoading, error, createSession, revokeSession } = useCloudAuth({
 *     projectId: 'your-project-id',
 *   });
 *
 *   if (isLoading) return <p>Loading…</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *
 *   if (session) {
 *     return (
 *       <button onClick={() => revokeSession()}>
 *         Connected: {session.address}
 *       </button>
 *     );
 *   }
 *
 *   return <button onClick={() => signIn()}>Connect Wallet</button>;
 * }
 * ```
 */
export declare function useCloudAuth(config: CloudAuthConfig): {
    /** Current active session, or `null`. */
    session: CloudSession | null;
    /** Create a new session after SIWX sign-in. */
    createSession: (params: Parameters<CloudAuth['createSession']>[0]) => Promise<CloudSession>;
    /** Verify the current session. */
    verifySession: () => Promise<VerifyResult>;
    /** Revoke the current session. */
    revokeSession: () => Promise<boolean>;
    /** Whether initialization is in progress. */
    isLoading: boolean;
    /** Last error, if any. */
    error: Error | null;
    /** List sessions for the current address. */
    listSessions: (address: string) => ReturnType<CloudAuth['listSessions']>;
    /** Access token for API calls. */
    accessToken: string | null;
};
//# sourceMappingURL=cloud-auth.d.ts.map