/**
 * SIWXSession — Session lifecycle management for cross-chain authentication.
 *
 * Handles creation, validation, expiry tracking, and revocation of SIWX sessions.
 * Each session binds a wallet address to a domain with an expiration deadline.
 *
 * @packageDocumentation
 */

import type { SIWXParams, SIWXResult, ChainType } from './types.js';
import { generateTimestamp } from '@cinacoin/siwe';
import { randomBytes } from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Status of a SIWX session. */
export type SessionStatus = 'active' | 'expired' | 'revoked' | 'pending';

/** A managed SIWX session. */
export interface SIWXSession {
  /** Unique session ID (UUID v4). */
  id: string;

  /** Chain type used for authentication. */
  chainType: ChainType;

  /** Wallet address that authenticated. */
  address: string;

  /** Domain that requested authentication. */
  domain: string;

  /** Chain identifier (CAIP-2 format). */
  chainId: number | string;

  /** SIWX message that was signed. */
  message: string;

  /** Signature produced by the wallet. */
  signature: string;

  /** ISO 8601 timestamp when the session was created. */
  createdAt: string;

  /** ISO 8601 timestamp when the session expires. */
  expiresAt: string;

  /** ISO 8601 timestamp for not-before (optional). */
  notBefore?: string;

  /** Current session status. */
  status: SessionStatus;

  /** Arbitrary metadata. */
  metadata?: Record<string, string>;
}

/** Parameters for creating a new session. */
export interface CreateSessionParams {
  /** Chain type. */
  chainType: ChainType;

  /** Wallet address. */
  address: string;

  /** Domain. */
  domain: string;

  /** Chain ID. */
  chainId: number | string;

  /** SIWX message. */
  message: string;

  /** Signature. */
  signature: string;

  /** Session lifetime in seconds (default: 3600 = 1 hour). */
  lifetimeSeconds?: number;

  /** Not-before delay in seconds (optional). */
  notBeforeDelaySeconds?: number;

  /** Arbitrary metadata. */
  metadata?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// SIWXSessionManager
// ---------------------------------------------------------------------------

/**
 * Manages the lifecycle of SIWX sessions.
 *
 * Provides create, validate, revoke, and cleanup operations.
 * Sessions can be stored in memory or persisted via a custom backend.
 *
 * @example
 * ```ts
 * import { SIWXSessionManager } from '@cinacoin/siwx';
 *
 * const manager = new SIWXSessionManager();
 *
 * const session = await manager.create({
 *   chainType: 'evm',
 *   address: '0xabc...',
 *   domain: 'example.com',
 *   chainId: 1,
 *   message: '...',
 *   signature: '0x...',
 *   lifetimeSeconds: 7200,
 * });
 *
 * const isValid = manager.isValid(session.id);
 * await manager.revoke(session.id);
 * ```
 */
export class SIWXSessionManager {
  private sessions: Map<string, SIWXSession> = new Map();

  /** Default session lifetime in seconds (1 hour). */
  static readonly DEFAULT_LIFETIME_SECONDS = 3600;

  // -----------------------------------------------------------------------
  // CRUD
  // -----------------------------------------------------------------------

  /**
   * Create a new SIWX session.
   *
   * @param params - Session creation parameters.
   * @returns The created SIWXSession.
   */
  async create(params: CreateSessionParams): Promise<SIWXSession> {
    const id = this._generateId();
    const now = new Date();

    const lifetime = params.lifetimeSeconds ?? SIWXSessionManager.DEFAULT_LIFETIME_SECONDS;
    const expiresAt = new Date(now.getTime() + lifetime * 1000);

    let notBefore: string | undefined;
    if (params.notBeforeDelaySeconds && params.notBeforeDelaySeconds > 0) {
      notBefore = new Date(now.getTime() + params.notBeforeDelaySeconds * 1000).toISOString();
    }

    const session: SIWXSession = {
      id,
      chainType: params.chainType,
      address: params.address,
      domain: params.domain,
      chainId: params.chainId,
      message: params.message,
      signature: params.signature,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      notBefore,
      status: 'active',
      metadata: params.metadata,
    };

    this.sessions.set(id, session);
    return session;
  }

  /**
   * Get a session by ID.
   *
   * @param id - Session ID.
   * @returns The session, or `undefined` if not found.
   */
  get(id: string): SIWXSession | undefined {
    return this.sessions.get(id);
  }

  /**
   * Find all active sessions for a given address.
   *
   * @param address - Wallet address.
   * @returns Array of active sessions.
   */
  findByAddress(address: string): SIWXSession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.address.toLowerCase() === address.toLowerCase() && s.status === 'active',
    );
  }

  /**
   * Find all sessions for a given domain.
   *
   * @param domain - Domain name.
   * @returns Array of sessions.
   */
  findByDomain(domain: string): SIWXSession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.domain === domain,
    );
  }

  /**
   * Revoke a session by ID.
   *
   * @param id - Session ID.
   * @returns `true` if the session was found and revoked.
   */
  revoke(id: string): boolean {
    const session = this.sessions.get(id);
    if (!session) return false;
    session.status = 'revoked';
    return true;
  }

  /**
   * Revoke all sessions for a given address.
   *
   * @param address - Wallet address.
   * @returns Number of sessions revoked.
   */
  revokeAllForAddress(address: string): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.address.toLowerCase() === address.toLowerCase() && session.status === 'active') {
        session.status = 'revoked';
        count++;
      }
    }
    return count;
  }

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  /**
   * Check if a session is currently valid (active and not expired).
   *
   * @param id - Session ID.
   * @returns `true` if the session is valid.
   */
  isValid(id: string): boolean {
    const session = this.sessions.get(id);
    if (!session) return false;
    return this._isSessionValid(session);
  }

  /**
   * Validate a session and return detailed status.
   *
   * @param id - Session ID.
   * @returns Object with validity and optional reason.
   */
  validate(id: string): { valid: boolean; reason?: string; session?: SIWXSession } {
    const session = this.sessions.get(id);
    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    if (session.status === 'revoked') {
      return { valid: false, reason: 'Session has been revoked', session };
    }

    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    if (now >= expiresAt) {
      session.status = 'expired';
      return { valid: false, reason: 'Session has expired', session };
    }

    if (session.notBefore) {
      const notBefore = new Date(session.notBefore);
      if (now < notBefore) {
        return { valid: false, reason: 'Session is not yet valid (not-before)', session };
      }
    }

    return { valid: true, session };
  }

  // -----------------------------------------------------------------------
  // Cleanup
  // -----------------------------------------------------------------------

  /**
   * Expire all sessions past their expiration time.
   *
   * @returns Number of sessions expired.
   */
  expireAll(): number {
    let count = 0;
    const now = new Date();
    for (const session of this.sessions.values()) {
      if (session.status === 'active' && now >= new Date(session.expiresAt)) {
        session.status = 'expired';
        count++;
      }
    }
    return count;
  }

  /**
   * Purge all expired and revoked sessions from memory.
   *
   * @returns Number of sessions purged.
   */
  purge(): number {
    let count = 0;
    for (const [id, session] of this.sessions.entries()) {
      if (session.status === 'expired' || session.status === 'revoked') {
        this.sessions.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Get total session count (optionally filtered by status).
   *
   * @param status - Optional status filter.
   * @returns Number of sessions.
   */
  count(status?: SessionStatus): number {
    if (!status) return this.sessions.size;
    return Array.from(this.sessions.values()).filter((s) => s.status === status).length;
  }

  /**
   * Get all sessions (optionally filtered by status).
   */
  getAll(status?: SessionStatus): SIWXSession[] {
    if (!status) return Array.from(this.sessions.values());
    return Array.from(this.sessions.values()).filter((s) => s.status === status);
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private _isSessionValid(session: SIWXSession): boolean {
    if (session.status !== 'active') return false;

    const now = new Date();
    if (now >= new Date(session.expiresAt)) {
      session.status = 'expired';
      return false;
    }

    if (session.notBefore && now < new Date(session.notBefore)) {
      return false;
    }

    return true;
  }

  private _generateId(): string {
    const bytes = randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
    const hex = bytes.toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

/**
 * Default singleton SIWXSessionManager instance.
 */
export const defaultSessionManager = new SIWXSessionManager();
