/**
 * Session type definitions for wallet connection lifecycle.
 */

import type { ConnectParams, ConnectionResult } from '../types.js';
import type { Connector } from '../connector.js';

/** Session state discriminator. */
export type SessionState =
  | { status: 'disconnected' }
  | { status: 'connecting'; connectorId: string }
  | { status: 'connected'; accounts: string[]; chainId: number; sessionId: string; connectorId: string }
  | { status: 'error'; error: Error };

/** Session storage key for persistence. */
export const SESSION_STORAGE_KEY = 'cinacoin_session';

/**
 * Session expiry TTL in milliseconds (24 hours).
 * Persisted sessions older than this are considered expired.
 */
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/** Persisted session payload shape. */
export interface PersistedSession {
  status: string;
  accounts: string[];
  chainId: number;
  sessionId: string;
  connectorId: string;
  expiresAt: number;
  _integrity: string;
}

/** Re-export for convenience. */
export type { ConnectParams, ConnectionResult, Connector };
