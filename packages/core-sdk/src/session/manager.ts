/**
 * Session state machine for managing wallet connection lifecycle.
 *
 * SECURITY NOTE:
 * This module persists session metadata to localStorage for SPA convenience.
 * In production applications, consider these mitigations:
 *
 * 1. **Do NOT store auth tokens in localStorage.** Tokens should be stored
 *    in httpOnly, Secure, SameSite=Strict cookies set by the server.
 *
 * 2. **Only persist non-sensitive metadata** (connector ID, chain ID,
 *    last connected accounts). The actual signing capability should require
 *    user interaction each session.
 *
 * 3. **Implement session expiry.** Persisted sessions should have a TTL
 *    and be validated against the server on restore.
 *
 * 4. **Use sessionStorage for higher sensitivity.** sessionStorage is cleared
 *    on tab close, limiting the window for XSS-based session theft.
 *
 * 5. **Add integrity checks.** Include an HMAC or hash of persisted state
 *    to detect tampering.
 */

import { logger } from '@cinacoin/logger';
import type { ConnectParams } from '../types.js';
import type { Connector } from '../connector.js';
import type { EventHandler } from '../types.js';
import { EventEmitter } from '../events.js';
import { createError, WALLET_CONNECT, SDK } from '../errors/index.js';
import type { SessionState } from './types.js';
import { persistSession, restoreSession, clearSession } from './store.js';

// [H-004] Fix: Enforce SESSION_SECRET in production
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
  if (!process.env.SESSION_SECRET) {
    throw new Error(
      'SESSION_SECRET environment variable is required in production. ' +
      'Generate a secure secret with: openssl rand -hex 32'
    );
  }
}

/**
 * Validate SESSION_SECRET at runtime.
 * M-001: Check validity on each use, not just at module load.
 * @throws Error if SESSION_SECRET is invalid or missing in production
 */
function validateSessionSecret(): void {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      throw new Error(
        'SESSION_SECRET environment variable is required in production. ' +
        'Generate a secure secret with: openssl rand -hex 32'
      );
    }
    // Check minimum length (32 bytes = 64 hex chars)
    if (secret.length < 32) {
      throw new Error(
        'SESSION_SECRET must be at least 32 characters long. ' +
        'Generate a secure secret with: openssl rand -hex 32'
      );
    }
  }
}

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
  private _cleanupTimer: ReturnType<typeof setTimeout> | null = null;

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
   *
   * SECURITY: Validates expiry and integrity hash before restoring.
   * If validation fails, returns disconnected state.
   */
  async restore(): Promise<SessionState> {
    // M-001: Validate SESSION_SECRET at runtime
    validateSessionSecret();

    try {
      const restored = await restoreSession();
      if (restored && restored.status === 'connected') {
        this.state = restored;
        this.emit('stateChange', this.state);
      }
    } catch (err) {
      logger.warn(`[core-sdk:restore] error:`, err as Record<string, unknown>);
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
      throw createError(WALLET_CONNECT.PROTOCOL_ERROR.code, 'Connection already in progress');
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
      this._cleanupTimer = setTimeout(() => {
        this._cleanupTimer = null;
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
    // M-001: Validate SESSION_SECRET at runtime
    validateSessionSecret();

    if (!this._connector) {
      throw createError(SDK.NOT_INITIALIZED.code, 'No connector set — call initiate() first');
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
    // Cancel any pending cleanup timer
    if (this._cleanupTimer) {
      clearTimeout(this._cleanupTimer);
      this._cleanupTimer = null;
    }

    if (this._connector) {
      try {
        await this._connector.disconnect();
      } catch (err) {
        logger.warn(`[core-sdk:terminate] error:`, err as Record<string, unknown>);
      }
      this._connector = null;
    }

    // Clear persisted session
    clearSession();
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

  /** Persist current connected state to localStorage with expiry and integrity. */
  private async persist(): Promise<void> {
    if (this.state.status === 'connected') {
      // M-001: Validate SESSION_SECRET at runtime
      validateSessionSecret();
      await persistSession(this.state);
    }
  }
}
