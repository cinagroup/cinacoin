/**
 * Session store utilities for persistence and integrity verification.
 */

import { SESSION_STORAGE_KEY, SESSION_TTL_MS } from './types.js';
import type { SessionState, PersistedSession } from './types.js';

/**
 * Compute SHA-256 integrity hash of session state.
 * Used to detect tampering with persisted session data.
 */
export async function computeIntegrity(state: object): Promise<string> {
  const data = JSON.stringify(state);
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Persist connected session state to localStorage with expiry and integrity hash.
 */
export async function persistSession(state: SessionState): Promise<void> {
  if (state.status !== 'connected') {
    return;
  }

  const integrityHash = await computeIntegrity(state);
  const payload: PersistedSession = {
    ...state,
    expiresAt: Date.now() + SESSION_TTL_MS,
    _integrity: integrityHash,
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
}

/**
 * Restore session from localStorage, validating expiry and integrity.
 * Returns null if no valid session exists.
 */
export async function restoreSession(): Promise<SessionState | null> {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const persisted: PersistedSession = JSON.parse(raw);

    // Check expiry
    if (persisted.expiresAt && Date.now() > persisted.expiresAt) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    // Verify integrity hash
    const { expiresAt, _integrity: integrityHash, ...stateForHash } = persisted;
    const expectedHash = await computeIntegrity(stateForHash);
    if (integrityHash && integrityHash !== expectedHash) {
      // Tampered data — clear and return null
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    if (persisted.status === 'connected') {
      return {
        status: 'connected',
        accounts: persisted.accounts,
        chainId: persisted.chainId,
        sessionId: persisted.sessionId,
        connectorId: persisted.connectorId,
      };
    }
  } catch (err) {
    // Corrupted storage — ignore
    console.warn('[session:restore] Failed to parse stored session:', err);
  }

  return null;
}

/**
 * Clear persisted session from localStorage.
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
