/**
 * Session state machine for managing wallet connection lifecycle.
 */
import type { ConnectParams } from './types.js';
import type { Connector } from './connector.js';
import { EventEmitter } from './events.js';
/** Session state discriminator. */
export type SessionState = {
    status: 'disconnected';
} | {
    status: 'connecting';
    connectorId: string;
} | {
    status: 'connected';
    accounts: string[];
    chainId: number;
    sessionId: string;
    connectorId: string;
} | {
    status: 'error';
    error: Error;
};
/**
 * SessionManager controls the connection lifecycle.
 *
 * State transitions:
 *   disconnected → connecting → connected → disconnected
 *   connecting → error → disconnected
 *   connected → error → disconnected
 */
export declare class SessionManager extends EventEmitter {
    private state;
    private _connector;
    /** Current session state. */
    getState(): SessionState;
    /**
     * Subscribe to state changes.
     * @param cb - Callback invoked on each state change.
     * @returns Unsubscribe function.
     */
    subscribe(cb: (state: SessionState) => void): () => void;
    /**
     * Restore a persisted session from localStorage.
     * @returns The restored session state.
     */
    restore(): Promise<SessionState>;
    /**
     * Initiate a connection with the given connector.
     * @param connector - Connector instance to use.
     * @param params - Optional connection parameters.
     */
    initiate(connector: Connector, params?: ConnectParams): Promise<void>;
    /**
     * Confirm a connection after user approval.
     * @param sessionId - Session identifier.
     * @param accounts - Approved account addresses.
     * @param chainId - Approved chain ID.
     */
    confirm(sessionId: string, accounts: string[], chainId: number): Promise<void>;
    /**
     * Terminate the current session.
     */
    terminate(): Promise<void>;
    /**
     * Clean up expired sessions.
     */
    cleanup(): Promise<void>;
    /** Transition to a new state and emit the change. */
    private transition;
    /** Persist current connected state to localStorage. */
    private persist;
}
//# sourceMappingURL=session.d.ts.map