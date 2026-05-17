/**
 * React hooks for CinaConnect SIWX Cloud Authentication.
 *
 * Provides `useCloudAuth()` and `useCloudSession()` hooks for managing cloud
 * session state in React applications. Handles auto-refresh, event listeners,
 * and session lifecycle.
 *
 * @packageDocumentation
 */
import type { CloudAuth, CloudAuthConfig, CloudAuthEvent, CloudSession, VerifyResult } from './cloud-auth.js';
/**
 * React hook for full cloud authentication lifecycle management.
 *
 * Initializes a CloudAuth instance, tracks session state, and exposes
 * actions for session CRUD. Automatically handles initialization on mount
 * and cleanup on unmount.
 *
 * @param config - CloudAuth configuration (same as CloudAuth constructor).
 * @returns Auth state and actions.
 *
 * @example
 * ```tsx
 * import { useCloudAuth } from '@cinaconnect/siwx';
 *
 * function AuthPanel() {
 *   const {
 *     session,
 *     isLoading,
 *     error,
 *     createSession,
 *     verifySession,
 *     revokeSession,
 *   } = useCloudAuth({
 *     projectId: 'your-project-id',
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorBanner message={error.message} />;
 *
 *   if (session) {
 *     return (
 *       <div>
 *         <p>Connected: {session.address}</p>
 *         <button onClick={() => revokeSession()}>Disconnect</button>
 *       </div>
 *     );
 *   }
 *
 *   return <ConnectButton onSignIn={handleSignIn} />;
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
};
/**
 * React hook for reading the current cloud session data with auto-refresh.
 *
 * Unlike `useCloudAuth()`, this hook is read-only and focuses on session
 * data observation. It auto-refreshes the token before expiry and provides
 * a `refresh()` method for manual token refresh.
 *
 * @param auth - A pre-initialized CloudAuth instance.
 * @returns Session data, status, and manual refresh method.
 *
 * @example
 * ```tsx
 * import { useCloudSession } from '@cinaconnect/siwx';
 *
 * function SessionInfo({ auth }: { auth: CloudAuth }) {
 *   const { data, status, refresh } = useCloudSession(auth);
 *
 *   return (
 *     <div>
 *       <p>Status: {status}</p>
 *       {data && (
 *         <>
 *           <p>Address: {data.address}</p>
 *           <p>Chain: {data.chainId}</p>
 *           <p>Expires: {new Date(data.expiresAt).toLocaleString()}</p>
 *           <button onClick={() => refresh()}>Refresh Token</button>
 *         </>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useCloudSession(auth: CloudAuth): {
    /** The current session data, or `null` if no session. */
    data: CloudSession | null;
    /** Session status: 'idle' | 'active' | 'expired' | 'refreshing'. */
    status: 'idle' | 'active' | 'expired' | 'refreshing';
    /** Manually trigger a token refresh. */
    refresh: () => Promise<void>;
};
/**
 * React hook that subscribes to CloudAuth events and invokes a callback.
 *
 * Useful for side effects like analytics logging, toast notifications,
 * or navigation when authentication state changes.
 *
 * @param auth - A pre-initialized CloudAuth instance.
 * @param onEvent - Callback invoked for every CloudAuth event.
 *
 * @example
 * ```tsx
 * import { useCloudAuthEvents } from '@cinaconnect/siwx';
 *
 * function EventLogger({ auth }: { auth: CloudAuth }) {
 *   useCloudAuthEvents(auth, (event) => {
 *     if (event.type === 'login') {
 *       analytics.track('wallet_connected', { address: event.session.address });
 *     }
 *     if (event.type === 'sessionExpired') {
 *       toast.warning('Your session expired. Please sign in again.');
 *     }
 *   });
 *
 *   return null;
 * }
 * ```
 */
export declare function useCloudAuthEvents(auth: CloudAuth, onEvent: (event: CloudAuthEvent) => void): void;
//# sourceMappingURL=cloud-hooks.d.ts.map