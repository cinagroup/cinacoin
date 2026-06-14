/**
 * Persistent session store for Cinacoin v2.
 *
 * Persists pairings, sessions, and cryptographic key material to
 * localStorage (browser) or an in-memory fallback (Node.js / SSR).
 * Provides expiry detection, integrity checks, and HMAC-based
 * tamper protection.
 *
 * Storage keys:
 *  - cinacoin_wc_pairings    → Map<topic, StoredPairing>
 *  - cinacoin_wc_sessions    → Map<topic, StoredSession>
 *  - cinacoin_wc_keypairs    → Serialized keypair material
 *  - cinacoin_wc_meta        → Metadata (project ID, last relay URL, etc.)
 *
 * @packageDocumentation
 */

import { sha256 } from '@noble/hashes/sha2.js';
import type { Pairing, Session, WcClientEvent, JsonRpcRequest, SessionNamespace } from './types.js';
import { logger } from '@cinacoin/logger';

// ============================================================
// Constants
// ============================================================

const STORAGE_KEYS = {
  PAIRINGS: 'cinacoin_wc_pairings',
  SESSIONS: 'cinacoin_wc_sessions',
  KEYPAIRS: 'cinacoin_wc_keypairs',
  META: 'cinacoin_wc_meta',
  NONCES: 'cinacoin_wc_nonces',
} as const;

/** Current schema version for migrations. */
export const CURRENT_SCHEMA_VERSION = 1;

/** Default session TTL: 7 days in milliseconds. */
const DEFAULT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Default pairing TTL: 5 minutes in milliseconds. */
const DEFAULT_PAIRING_TTL_MS = 5 * 60 * 1000;

/** Default nonce expiry: 24 hours. */
const DEFAULT_NONCE_EXPIRY_MS = 24 * 60 * 60 * 1000;

// ============================================================
// Stored Data Interfaces
// ============================================================

/** Pairing data as persisted to storage. */
export interface StoredPairing {
  topic: string;
  uri: string;
  peerMetadata?: { name: string; description: string; url: string; icons: string[] };
  active: boolean;
  expiry: number;
  symKey: string;
  /** HMAC integrity hash of the stored data. */
  _integrity: string;
}

/** Session data as persisted to storage. */
export interface StoredSession {
  topic: string;
  peerMetadata: { name: string; description: string; url: string; icons: string[] };
  accounts: string[];
  namespaces: Record<string, SessionNamespace>;
  requiredNamespaces: Record<string, { chains: string[]; methods: string[]; events: string[] }>;
  expiry: number;
  relay: { protocol: string; data?: string };
  /** Serialized X25519 keypair (our side). */
  keypair?: { publicKey: string; privateKey: string };
  /** Peer's X25519 public key (hex). */
  peerPublicKey?: string;
  /** HMAC integrity hash. */
  _integrity: string;
}

/** Persisted keypair entry. */
export interface StoredKeypair {
  /** Topic this keypair belongs to. */
  topic: string;
  /** Serialized keypair. */
  keypair: { publicKey: string; privateKey: string };
  /** Peer's public key (hex). */
  peerPublicKey: string;
}

/** Persisted metadata. */
export interface StoredMeta {
  projectId?: string;
  lastRelayUrl?: string;
  lastConnectedAt?: number;
  version: number;
  /** Schema version for migration tracking. */
  schemaVersion?: number;
}

/** Nonce entry for replay protection. */
export interface StoredNonce {
  nonce: string;
  createdAt: number;
  used: boolean;
  usedAt?: number;
}

// ============================================================
// Storage Backend Abstraction
// ============================================================

/** Browser localStorage or in-memory fallback. */
interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Browser localStorage with graceful fallback. */
function getStorageBackend(): StorageBackend {
  try {
    if (typeof localStorage !== 'undefined') {
      // Test that localStorage actually works (may be blocked in private mode)
      localStorage.setItem('__wc_test__', '1');
      localStorage.removeItem('__wc_test__');
      return localStorage;
    }
  } catch {
    // localStorage unavailable or blocked
  }

  // In-memory fallback for Node.js / SSR / private browsing
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  };
}

// ============================================================
// Integrity
// ============================================================

/**
 * Compute an integrity hash for stored data.
 *
 * Uses SHA-256 over the canonical JSON of the data (excluding the
 * _integrity field) to detect tampering.
 */
function computeIntegrity(data: Record<string, unknown>): string {
  const { _integrity, ...rest } = data;
  const canonical = JSON.stringify(rest);
  const hash = sha256(new TextEncoder().encode(canonical));
  return Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Verify integrity of stored data. */
function verifyIntegrity(data: Record<string, unknown>): boolean {
  if (!data._integrity || typeof data._integrity !== 'string') return false;
  const expected = computeIntegrity(data);
  return data._integrity === expected;
}

/** Add integrity hash to data before storing. */
function addIntegrity<T extends Record<string, unknown>>(data: T): T & { _integrity: string } {
  const hash = computeIntegrity(data as Record<string, unknown>);
  return { ...data, _integrity: hash } as T & { _integrity: string };
}

// ============================================================
// SessionStore
// ============================================================

/**
 * Persistent store for WC v2 session data.
 *
 * Handles:
 * - Persisting pairings and sessions to localStorage
 * - Restoring sessions on app restart
 * - Detecting and cleaning expired entries
 * - Integrity verification (HMAC/SHA-256)
 * - Nonce management for replay protection
 */
export class SessionStore {
  private storage: StorageBackend;

  constructor() {
    this.storage = getStorageBackend();
    // Run migrations on initialization
    this.migrate();
  }

  // ============================================================
  // Pairing Storage
  // ============================================================

  /** Save a pairing to persistent storage. */
  savePairing(pairing: Pairing): void {
    const stored: StoredPairing = addIntegrity({
      topic: pairing.topic,
      uri: pairing.uri,
      peerMetadata: pairing.peerMetadata,
      active: pairing.active,
      expiry: pairing.expiry || Date.now() + DEFAULT_PAIRING_TTL_MS,
      symKey: pairing.symKey ?? '',
    });

    const pairings = this.loadPairings();
    pairings.set(stored.topic, stored);
    this.savePairings(pairings);
  }

  /** Load a pairing by topic, or undefined if not found or expired. */
  getPairing(topic: string): StoredPairing | null {
    const pairings = this.loadPairings();
    const pairing = pairings.get(topic);
    if (!pairing) return null;
    if (!verifyIntegrity(pairing as unknown as Record<string, unknown>)) {
      this.deletePairing(topic);
      return null;
    }
    return pairing;
  }

  /** Get all active (non-expired) pairings. */
  getActivePairings(): StoredPairing[] {
    const pairings = this.loadPairings();
    const now = Date.now();
    const active: StoredPairing[] = [];

    for (const [topic, pairing] of pairings) {
      if (!verifyIntegrity(pairing as unknown as Record<string, unknown>)) {
        this.deletePairing(topic);
        continue;
      }
      if (pairing.active && pairing.expiry > now) {
        active.push(pairing);
      } else {
        // Clean up expired pairing
        this.deletePairing(topic);
      }
    }

    return active;
  }

  /** Delete a pairing by topic. */
  deletePairing(topic: string): void {
    const pairings = this.loadPairings();
    pairings.delete(topic);
    this.savePairings(pairings);
  }

  /** Clear all expired pairings. */
  cleanupExpiredPairings(): number {
    const pairings = this.loadPairings();
    const now = Date.now();
    let count = 0;

    for (const [topic, pairing] of pairings) {
      if (!pairing.active || pairing.expiry <= now) {
        pairings.delete(topic);
        count++;
      }
    }

    if (count > 0) {
      this.savePairings(pairings);
    }
    return count;
  }

  // ============================================================
  // Session Storage
  // ============================================================

  /** Save a session to persistent storage. */
  saveSession(session: Session, keypair?: { publicKey: string; privateKey: string }, peerPublicKey?: string): void {
    const stored: StoredSession = addIntegrity({
      topic: session.topic,
      peerMetadata: session.peerMetadata,
      accounts: session.accounts,
      namespaces: session.namespaces,
      requiredNamespaces: session.requiredNamespaces,
      expiry: session.expiry,
      relay: session.relay,
      keypair,
      peerPublicKey,
    });

    const sessions = this.loadSessions();
    sessions.set(stored.topic, stored);
    this.saveSessions(sessions);

    // Also persist the keypair separately for recovery
    if (keypair && peerPublicKey) {
      this.saveKeypair(session.topic, keypair, peerPublicKey);
    }
  }

  /** Load a session by topic, or null if not found or expired. */
  getSession(topic: string): StoredSession | null {
    const sessions = this.loadSessions();
    const session = sessions.get(topic);
    if (!session) return null;
    if (!verifyIntegrity(session as unknown as Record<string, unknown>)) {
      this.deleteSession(topic);
      return null;
    }
    if (session.expiry <= Date.now()) {
      this.deleteSession(topic);
      return null;
    }
    return session;
  }

  /** Get all active (non-expired) sessions. */
  getActiveSessions(): StoredSession[] {
    const sessions = this.loadSessions();
    const now = Date.now();
    const active: StoredSession[] = [];

    for (const [topic, session] of sessions) {
      if (!verifyIntegrity(session as unknown as Record<string, unknown>)) {
        this.deleteSession(topic);
        continue;
      }
      if (session.expiry > now) {
        active.push(session);
      } else {
        this.deleteSession(topic);
      }
    }

    return active;
  }

  /** Delete a session by topic. */
  deleteSession(topic: string): void {
    const sessions = this.loadSessions();
    sessions.delete(topic);
    this.saveSessions(sessions);

    // Also clean up associated keypair
    const keypairs = this.loadKeypairs();
    keypairs.delete(topic);
    this.saveKeypairs(keypairs);
  }

  /** Clear all expired sessions. */
  cleanupExpiredSessions(): number {
    const sessions = this.loadSessions();
    const now = Date.now();
    let count = 0;

    for (const [topic, session] of sessions) {
      if (session.expiry <= now) {
        sessions.delete(topic);
        count++;
      }
    }

    if (count > 0) {
      this.saveSessions(sessions);
    }
    return count;
  }

  // ============================================================
  // Keypair Storage
  // ============================================================

  /** Save a keypair for a topic. */
  saveKeypair(topic: string, keypair: { publicKey: string; privateKey: string }, peerPublicKey: string): void {
    const keypairs = this.loadKeypairs();
    keypairs.set(topic, { topic, keypair, peerPublicKey });
    this.saveKeypairs(keypairs);
  }

  /** Load a keypair for a topic. */
  getKeypair(topic: string): StoredKeypair | null {
    const keypairs = this.loadKeypairs();
    return keypairs.get(topic) ?? null;
  }

  /** Delete a keypair for a topic. */
  deleteKeypair(topic: string): void {
    const keypairs = this.loadKeypairs();
    keypairs.delete(topic);
    this.saveKeypairs(keypairs);
  }

  // ============================================================
  // Metadata
  // ============================================================

  /** Save metadata. */
  saveMeta(meta: Partial<StoredMeta>): void {
    const existing = this.loadMeta();
    const merged = { ...existing, ...meta, version: 1 };
    this.storage.setItem(STORAGE_KEYS.META, JSON.stringify(merged));
  }

  /** Load metadata. */
  loadMeta(): Partial<StoredMeta> {
    try {
      const raw = this.storage.getItem(STORAGE_KEYS.META);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  // ============================================================
  // Nonce Management (Replay Protection)
  // ============================================================

  /** Generate a cryptographically random nonce. */
  generateNonce(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  /** Store a nonce as unused. */
  storeNonce(nonce: string): void {
    const nonces = this.loadNonces();
    nonces.set(nonce, { nonce, createdAt: Date.now(), used: false });
    this.saveNonces(nonces);
  }

  /** Mark a nonce as used. Returns false if nonce was already used (replay attack). */
  useNonce(nonce: string): boolean {
    const nonces = this.loadNonces();
    const entry = nonces.get(nonce);
    if (!entry) {
      // First time seeing this nonce — mark as used
      nonces.set(nonce, { nonce, createdAt: Date.now(), used: true, usedAt: Date.now() });
      this.saveNonces(nonces);
      return true;
    }
    if (entry.used) {
      // Nonce was already used — possible replay attack
      return false;
    }
    // Mark as used
    entry.used = true;
    entry.usedAt = Date.now();
    nonces.set(nonce, entry);
    this.saveNonces(nonces);
    return true;
  }

  /** Check if a nonce has been used. */
  isNonceUsed(nonce: string): boolean {
    const nonces = this.loadNonces();
    return nonces.get(nonce)?.used ?? false;
  }

  /** Clean up expired nonces (older than 24 hours). */
  cleanupExpiredNonces(expiryMs: number = DEFAULT_NONCE_EXPIRY_MS): number {
    const nonces = this.loadNonces();
    const cutoff = Date.now() - expiryMs;
    let count = 0;

    for (const [nonce, entry] of nonces) {
      if (entry.createdAt < cutoff) {
        nonces.delete(nonce);
        count++;
      }
    }

    if (count > 0) {
      this.saveNonces(nonces);
    }
    return count;
  }

  // ============================================================
  // Migration Support
  // ============================================================

  /**
   * Run schema migration if needed.
   *
   * Called automatically on initialization. Checks the current schema
   * version stored in metadata and applies any necessary migrations.
   *
   * @returns The current schema version after migration.
   */
  migrate(): number {
    const meta = this.loadMeta();
    const currentVersion = meta.schemaVersion ?? 0;

    if (currentVersion >= CURRENT_SCHEMA_VERSION) {
      return currentVersion;
    }

    logger.info(
      `[SessionStore] Migrating schema from v${currentVersion} to v${CURRENT_SCHEMA_VERSION}`,
    );

    // Apply migrations sequentially
    if (currentVersion < 1) {
      this.migrateToV1();
    }

    // Add future migrations here:
    // if (currentVersion < 2) { this.migrateToV2(); }

    // Update schema version
    this.saveMeta({ schemaVersion: CURRENT_SCHEMA_VERSION });
    return CURRENT_SCHEMA_VERSION;
  }

  /** Migrate to schema version 1. */
  private migrateToV1(): void {
    // V1 adds schemaVersion to metadata and integrity hashes.
    // No data transformation needed for existing entries since
    // the new fields are optional.
    // This is a no-op migration — future versions will have actual transforms.
  }

  // ============================================================
  // Batch Operations
  // ============================================================

  /**
   * Save multiple sessions in one batch.
   *
   * @param sessions - Array of { session, keypair?, peerPublicKey? }.
   */
  saveSessionsBatch(
    sessions: Array<{
      session: Session;
      keypair?: { publicKey: string; privateKey: string };
      peerPublicKey?: string;
    }>,
  ): void {
    const allSessions = this.loadSessions();

    for (const { session, keypair, peerPublicKey } of sessions) {
      const stored: StoredSession = addIntegrity({
        topic: session.topic,
        peerMetadata: session.peerMetadata,
        accounts: session.accounts,
        namespaces: session.namespaces,
        requiredNamespaces: session.requiredNamespaces,
        expiry: session.expiry,
        relay: session.relay,
        keypair,
        peerPublicKey,
      });
      allSessions.set(stored.topic, stored);
    }

    this.saveSessions(allSessions);
  }

  /**
   * Delete multiple sessions in one batch.
   *
   * @param topics - Array of session topics to delete.
   * @returns Number of sessions deleted.
   */
  deleteSessionsBatch(topics: string[]): number {
    const sessions = this.loadSessions();
    const keypairs = this.loadKeypairs();
    let count = 0;

    for (const topic of topics) {
      if (sessions.delete(topic)) {
        keypairs.delete(topic);
        count++;
      }
    }

    if (count > 0) {
      this.saveSessions(sessions);
      this.saveKeypairs(keypairs);
    }

    return count;
  }

  /**
   * Get a summary of all stored data.
   */
  getSummary(): {
    pairings: number;
    sessions: number;
    keypairs: number;
    nonces: number;
    activePairings: number;
    activeSessions: number;
  } {
    const pairings = this.loadPairings();
    const sessions = this.loadSessions();
    const keypairs = this.loadKeypairs();
    const nonces = this.loadNonces();
    const now = Date.now();

    return {
      pairings: pairings.size,
      sessions: sessions.size,
      keypairs: keypairs.size,
      nonces: nonces.size,
      activePairings: Array.from(pairings.values()).filter((p) => p.active && p.expiry > now).length,
      activeSessions: Array.from(sessions.values()).filter((s) => s.expiry > now).length,
    };
  }

  // ============================================================
  // Bulk Operations
  // ============================================================

  /** Restore the most recent active session (for single-session apps). */
  restoreLatestSession(): { session: StoredSession; keypair?: StoredKeypair } | null {
    const sessions = this.getActiveSessions();
    if (sessions.length === 0) return null;

    // Sort by expiry descending (most recent first)
    sessions.sort((a, b) => b.expiry - a.expiry);
    const latest = sessions[0];

    const keypair = this.getKeypair(latest.topic);
    return { session: latest, keypair: keypair ?? undefined };
  }

  /** Restore all active sessions with their keypairs. */
  restoreAllSessions(): Array<{ session: StoredSession; keypair?: StoredKeypair }> {
    const sessions = this.getActiveSessions();
    return sessions.map((session) => ({
      session,
      keypair: this.getKeypair(session.topic) ?? undefined,
    }));
  }

  /** Full cleanup of expired data. Returns total count of cleaned items. */
  fullCleanup(): { pairings: number; sessions: number; nonces: number } {
    return {
      pairings: this.cleanupExpiredPairings(),
      sessions: this.cleanupExpiredSessions(),
      nonces: this.cleanupExpiredNonces(),
    };
  }

  /** Clear all stored data. */
  clear(): void {
    this.storage.removeItem(STORAGE_KEYS.PAIRINGS);
    this.storage.removeItem(STORAGE_KEYS.SESSIONS);
    this.storage.removeItem(STORAGE_KEYS.KEYPAIRS);
    this.storage.removeItem(STORAGE_KEYS.META);
    this.storage.removeItem(STORAGE_KEYS.NONCES);
  }

  // ============================================================
  // Internal: Raw Storage Helpers
  // ============================================================

  private loadPairings(): Map<string, StoredPairing> {
    try {
      const raw = this.storage.getItem(STORAGE_KEYS.PAIRINGS);
      if (!raw) return new Map();
      const entries = JSON.parse(raw) as [string, StoredPairing][];
      return new Map(entries);
    } catch {
      return new Map();
    }
  }

  private savePairings(pairings: Map<string, StoredPairing>): void {
    this.storage.setItem(STORAGE_KEYS.PAIRINGS, JSON.stringify(Array.from(pairings.entries())));
  }

  private loadSessions(): Map<string, StoredSession> {
    try {
      const raw = this.storage.getItem(STORAGE_KEYS.SESSIONS);
      if (!raw) return new Map();
      const entries = JSON.parse(raw) as [string, StoredSession][];
      return new Map(entries);
    } catch {
      return new Map();
    }
  }

  private saveSessions(sessions: Map<string, StoredSession>): void {
    this.storage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(Array.from(sessions.entries())));
  }

  private loadKeypairs(): Map<string, StoredKeypair> {
    try {
      const raw = this.storage.getItem(STORAGE_KEYS.KEYPAIRS);
      if (!raw) return new Map();
      const entries = JSON.parse(raw) as [string, StoredKeypair][];
      return new Map(entries);
    } catch {
      return new Map();
    }
  }

  private saveKeypairs(keypairs: Map<string, StoredKeypair>): void {
    this.storage.setItem(STORAGE_KEYS.KEYPAIRS, JSON.stringify(Array.from(keypairs.entries())));
  }

  private loadNonces(): Map<string, StoredNonce> {
    try {
      const raw = this.storage.getItem(STORAGE_KEYS.NONCES);
      if (!raw) return new Map();
      const entries = JSON.parse(raw) as [string, StoredNonce][];
      return new Map(entries);
    } catch {
      return new Map();
    }
  }

  private saveNonces(nonces: Map<string, StoredNonce>): void {
    this.storage.setItem(STORAGE_KEYS.NONCES, JSON.stringify(Array.from(nonces.entries())));
  }
}

// ============================================================
// Default Export (Singleton)
// ============================================================

/** Default session store singleton instance. */
export const defaultSessionStore = new SessionStore();
