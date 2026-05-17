/**
 * Session state machine for managing wallet connection lifecycle.
 */

import type { ConnectParams, ConnectionResult } from './types.js';
import type { Connector } from './connector.js';
import type { EventHandler } from './types.js';
import { EventEmitter } from './events.js';

/** Session state discriminator. */
export type SessionState =
  | { status: 'disconnected' }
  | { status: 'connecting'; connectorId: string }
  | { status: 'connected'; accounts: string[]; chainId: number; sessionId: string; connectorId: string }
  | { status: 'error'; error: Error };

/** Session storage key for persistence. */
const SESSION_STORAGE_KEY = 'cinaconnect_session';

/**
 * SessionManager controls the connection lifecycle.
 *
 * State transitions:
 *   disconnected → connecting → connected → disconnected
 *   connecting → error → disconnected
 *   connected → error → disconnected
 */
export class SessionManager extends EventEmitter {
  private state: SessionState = { status: 'disconnected' };
  private _connector: Connector | null = null;

  /** Current session state. */
  getState(): SessionState {
    return this.state;
  }

  /**
   * Subscribe to state changes.
   * @param cb - Callback invoked on each state change.
   * @returns Unsubscribe function.
   */
  subscribe(cb: (state: SessionState) => void): () => void {
    const handler: EventHandler = (s: unknown) => cb(s as SessionState);
    this.on('stateChange', handler);
    return () => this.off('stateChange', handler);
  }

  /**
   * Restore a persisted session from localStorage.
   * @returns The restored session state.
   */
  async restore(): Promise<SessionState> {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) {
        return this.state;
      }

      const persisted = JSON.parse(raw);
      if (persisted?.status === 'connected') {
        this.state = {
          status: 'connected',
          accounts: persisted.accounts,
          chainId: persisted.chainId,
          sessionId: persisted.sessionId,
          connectorId: persisted.connectorId,
        };
        this.emit('stateChange', this.state);
      }
    } catch {
      // Corrupted storage — ignore
    }

    return this.state;
  }

  /**
   * Initiate a connection with the given connector.
   * @param connector - Connector instance to use.
   * @param params - Optional connection parameters.
   */
  async initiate(connector: Connector, params?: ConnectParams): Promise<void> {
    if (this.state.status === 'connecting') {
      throw new Error('Connection already in progress');
    }

    this._connector = connector;
    this.transition({ status: 'connecting', connectorId: connector.id });

    try {
      const result = await connector.connect(params);
      await this.confirm(result.sessionId, result.accounts, result.chainId);
    } catch (error) {
      this.transition({
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      });
      // Briefly hold error state, then transition to disconnected
      setTimeout(() => {
        if (this.state.status === 'error') {
          this.transition({ status: 'disconnected' });
        }
      }, 5000);
    }
  }

  /**
   * Confirm a connection after user approval.
   * @param sessionId - Session identifier.
   * @param accounts - Approved account addresses.
   * @param chainId - Approved chain ID.
   */
  async confirm(
    sessionId: string,
    accounts: string[],
    chainId: number,
  ): Promise<void> {
    if (!this._connector) {
      throw new Error('No connector set — call initiate() first');
    }

    this.transition({
      status: 'connected',
      accounts,
      chainId,
      sessionId,
      connectorId: this._connector.id,
    });

    // Persist session
    this.persist();
  }

  /**
   * Terminate the current session.
   */
  async terminate(): Promise<void> {
    if (this._connector) {
      try {
        await this._connector.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      this._connector = null;
    }

    // Clear persisted session
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.transition({ status: 'disconnected' });
  }

  /**
   * Clean up expired sessions.
   */
  async cleanup(): Promise<void> {
    // Check if current session is still valid
    if (this.state.status === 'connected') {
      // In production, validate with the relay
      // For now, we assume sessions are valid until explicitly terminated
    }
  }

  /** Transition to a new state and emit the change. */
  private transition(newState: SessionState): void {
    this.state = newState;
    this.emit('stateChange', newState);
  }

  /** Persist current connected state to localStorage. */
  private persist(): void {
    if (this.state.status === 'connected') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.state));
    }
  }
}
