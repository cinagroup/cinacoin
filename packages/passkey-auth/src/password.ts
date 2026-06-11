/**
 * Password management for @cinacoin/passkey-auth.
 *
 * Uses PBKDF2-HMAC-SHA256 for secure password hashing with
 * pluggable storage backends.
 *
 * ⚠️  SECURITY WARNING:
 * The default in-memory store (PASSWORD_STORE) is for development/testing ONLY.
 * In production, passwords MUST be persisted to a secure database (Postgres, Redis,
 * or similar) with proper access controls, encryption at rest, and audit logging.
 * In-memory storage loses all data on process restart and is not shared across
 * instances in a clustered deployment.
 *
 * To use persistent storage, call `configurePasswordStore()` with a custom
 * PasswordStore implementation backed by your database.
 *
 * @packageDocumentation
 */

import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, randomBytes } from '@noble/hashes/utils.js';
import { logger } from '@cinacoin/logger';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── Types ──────────────────────────────────────────────────────────────

/**
 * Stored password entry (hash + salt).
 */
export interface StoredPassword {
  /** The wallet ID this password belongs to. */
  walletId: string;
  /** PBKDF2-derived hash (hex-encoded). */
  hash: string;
  /** Random salt used for hashing (hex-encoded). */
  salt: string;
  /** Number of PBKDF2 iterations. */
  iterations: number;
  /** Derived key length in bytes. */
  dkLen: number;
  /** Timestamp when the password was set (Unix ms). */
  setAt: number;
}

/**
 * Password strength assessment result.
 */
export interface PasswordStrength {
  /** Numerical score from 0 (weakest) to 100 (strongest). */
  score: number;
  /** Human-readable strength label. */
  label: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';
  /** Individual criteria evaluation. */
  criteria: {
    /** Password length >= 8 characters. */
    length: boolean;
    /** Contains at least one uppercase letter (A-Z). */
    uppercase: boolean;
    /** Contains at least one lowercase letter (a-z). */
    hasLowercase: boolean;
    /** Contains at least one digit (0-9). */
    hasNumber: boolean;
    /** Contains at least one special character. */
    hasSpecialChar: boolean;
    /** Password length >= 12 characters (bonus criterion). */
    bonusLength: boolean;
  };
}

// ─── Constants ──────────────────────────────────────────────────────────

/** Default PBKDF2 iteration count (2^18 = 262,144). */
const DEFAULT_ITERATIONS = 262_144;

/** Default derived key length in bytes. */
const DEFAULT_DK_LEN = 32;

/** Salt length in bytes. */
const SALT_LENGTH = 16;

// ─── Storage Backend ────────────────────────────────────────────────────

/**
 * Abstract password store interface.
 * Implement this to plug in a persistent backend (Postgres, Redis, etc.).
 */
export interface PasswordStore {
  get(walletId: string): StoredPassword | undefined;
  set(walletId: string, entry: StoredPassword): void;
  delete(walletId: string): boolean;
  clear(): void;
}

/**
 * ⚠️  IN-MEMORY STORE — DEVELOPMENT/TESTING ONLY.
 *
 * This store holds password hashes in process memory. It:
 * - Loses all data on process restart
 * - Is not shared across cluster instances
 * - Has no encryption at rest
 * - Should NEVER be used in production
 *
 * For production, implement PasswordStore with a proper database.
 */
class InMemoryPasswordStore implements PasswordStore {
  private store = new Map<string, StoredPassword>();
  get(walletId: string): StoredPassword | undefined { return this.store.get(walletId); }
  set(walletId: string, entry: StoredPassword): void { this.store.set(walletId, entry); }
  delete(walletId: string): boolean { return this.store.delete(walletId); }
  clear(): void { this.store.clear(); }
}

/**
 * File-based password store for environments where a full database is unavailable.
 *
 * ⚠️  Still less secure than a proper database. Use only when necessary.
 * Entries are stored as JSON on disk — ensure file permissions are restrictive (0600).
 */
export class FilePasswordStore implements PasswordStore {
  private filePath: string;
  private cache: Map<string, StoredPassword> | null = null;

  constructor(filePath: string) {
    this.filePath = path.resolve(filePath);
  }

  private load(): Map<string, StoredPassword> {
    if (this.cache) return this.cache;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(raw) as Record<string, StoredPassword>;
        this.cache = new Map(Object.entries(data));
      } else {
        this.cache = new Map();
      }
    } catch {
      logger.warn('[passkey-auth] Failed to load password store from disk, starting fresh');
      this.cache = new Map();
    }
    return this.cache;
  }

  private persist(): void {
    if (!this.cache) return;
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = Object.fromEntries(this.cache);
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), { mode: 0o600 });
  }

  get(walletId: string): StoredPassword | undefined { return this.load().get(walletId); }
  set(walletId: string, entry: StoredPassword): void { this.load().set(walletId, entry); this.persist(); }
  delete(walletId: string): boolean { const r = this.load().delete(walletId); this.persist(); return r; }
  clear(): void { this.load().clear(); this.persist(); }
}

/**
 * Active password store. Defaults to in-memory (dev/test only).
 * Use `configurePasswordStore()` to switch to a persistent backend.
 *
 * Can be configured via environment variable:
 *   PASSWORD_STORE_PATH=/secure/path/passwords.json
 *
 * If PASSWORD_STORE_PATH is set, a FilePasswordStore will be used automatically
 * at module initialization. Otherwise, falls back to in-memory (dev/test only).
 */
let activeStore: PasswordStore = (() => {
  const storePath = process.env.PASSWORD_STORE_PATH;
  if (storePath) {
    logger.info(`[passkey-auth] Using file-based password store: ${storePath}`);
    return new FilePasswordStore(storePath);
  }
  // ⚠️  WARNING: In-memory store is for development/testing ONLY
  if (process.env.NODE_ENV === 'production') {
    logger.warn(
      '[passkey-auth] ⚠️  WARNING: Using in-memory password store in production! ' +
      'Set PASSWORD_STORE_PATH environment variable or call configurePasswordStore() ' +
      'with a persistent backend. In-memory storage loses all data on restart.'
    );
  }
  return new InMemoryPasswordStore();
})();

/**
 * Configure the password storage backend.
 *
 * @param store - A PasswordStore implementation (e.g., FilePasswordStore, or a custom DB-backed store).
 *
 * @example
 * ```ts
 * // Use file-based storage
 * configurePasswordStore(new FilePasswordStore('/secure/passwords.json'));
 *
 * // Use a custom database store
 * configurePasswordStore(new PostgresPasswordStore(dbConnection));
 * ```
 */
export function configurePasswordStore(store: PasswordStore): void {
  logger.info('[passkey-auth] Password store reconfigured');
  activeStore = store;
}

/**
 * Get the currently active password store (for testing/admin).
 */
export function getActiveStore(): PasswordStore {
  return activeStore;
}

// Legacy alias for backward compatibility
const PASSWORD_STORE_PROXY = {
  get: (id: string) => activeStore.get(id),
  set: (id: string, e: StoredPassword) => activeStore.set(id, e),
  delete: (id: string) => activeStore.delete(id),
  clear: () => activeStore.clear(),
};

// ─── Core Functions ─────────────────────────────────────────────────────

/**
 * Generate a random salt for password hashing.
 *
 * @returns Hex-encoded random salt.
 */
export function generateSalt(): string {
  return bytesToHex(randomBytes(SALT_LENGTH));
}

/**
 * Hash a password using PBKDF2-HMAC-SHA256.
 *
 * @param password - The plaintext password to hash.
 * @param salt - The salt to use (hex-encoded).
 * @param iterations - PBKDF2 iteration count.
 * @param dkLen - Derived key length in bytes.
 * @returns Promise resolving to the derived key (hex-encoded).
 */
export async function hashPassword(
  password: string,
  salt: string,
  iterations: number = DEFAULT_ITERATIONS,
  dkLen: number = DEFAULT_DK_LEN,
): Promise<string> {
  const hash = await pbkdf2Async(sha256, password, salt, { c: iterations, dkLen });
  return bytesToHex(hash);
}

/**
 * Set a password for a wallet.
 *
 * Hashes the password with a random salt and stores the result
 * in the password store.
 *
 * @param walletId - Unique identifier for the wallet.
 * @param password - The plaintext password to store.
 * @returns The stored password entry (without the plaintext).
 *
 * @example
 * ```ts
 * const entry = await setPassword('wallet-abc123', 'MyP@ssw0rd!');
 * logger.info(entry.hash); // "a3f8b2..."
 * ```
 */
export async function setPassword(
  walletId: string,
  password: string,
): Promise<StoredPassword> {
  if (!walletId || walletId.trim().length === 0) {
    throw new Error('walletId is required');
  }
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty');
  }

  const salt = generateSalt();
  const hash = await hashPassword(password, salt);

  const entry: StoredPassword = {
    walletId,
    hash,
    salt,
    iterations: DEFAULT_ITERATIONS,
    dkLen: DEFAULT_DK_LEN,
    setAt: Date.now(),
  };

  activeStore.set(walletId, entry);
  return entry;
}

/**
 * Verify a password against a stored hash for a given wallet.
 *
 * @param walletId - The wallet ID to look up.
 * @param password - The plaintext password to verify.
 * @returns Promise resolving to true if the password matches.
 *
 * @example
 * ```ts
 * const valid = await verifyPassword('wallet-abc123', 'MyP@ssw0rd!');
 * if (valid) {
 *   // password is correct
 * }
 * ```
 */
export async function verifyPassword(
  walletId: string,
  password: string,
): Promise<boolean> {
  const stored = activeStore.get(walletId);
  if (!stored) {
    return false;
  }

  const computedHash = await hashPassword(
    password,
    stored.salt,
    stored.iterations,
    stored.dkLen,
  );

  return computedHash === stored.hash;
}

/**
 * Change a password for a wallet.
 *
 * Verifies the old password first, then sets the new one.
 * If the old password is incorrect, throws an error.
 *
 * @param walletId - The wallet ID.
 * @param oldPassword - The current password.
 * @param newPassword - The new password to set.
 * @returns Promise resolving to the new stored password entry.
 *
 * @example
 * ```ts
 * const newEntry = await changePassword(
 *   'wallet-abc123',
 *   'OldP@ss1',
 *   'NewP@ss2!'
 * );
 * ```
 */
export async function changePassword(
  walletId: string,
  oldPassword: string,
  newPassword: string,
): Promise<StoredPassword> {
  if (!newPassword || newPassword.length === 0) {
    throw new Error('New password cannot be empty');
  }

  const valid = await verifyPassword(walletId, oldPassword);
  if (!valid) {
    throw new Error('Old password is incorrect');
  }

  // Remove old entry and set new one
  activeStore.delete(walletId);
  return setPassword(walletId, newPassword);
}

/**
 * Calculate the strength of a password.
 *
 * Evaluates length, character diversity, and bonus criteria
 * to produce a 0-100 score and label.
 *
 * Criteria checked:
 * - Length >= 8
 * - Has uppercase (A-Z)
 * - Has lowercase (a-z)
 * - Has number (0-9)
 * - Has special character
 * - Bonus: length >= 12
 *
 * @param password - The password to evaluate.
 * @returns Password strength assessment.
 *
 * @example
 * ```ts
 * const strength = calculatePasswordStrength('MyP@ssw0rd!');
 * // {
 * //   score: 80,
 * //   label: 'strong',
 * //   criteria: { length: true, uppercase: true, ... }
 * // }
 * ```
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  const criteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
    bonusLength: password.length >= 12,
  };

  // Scoring: base criteria = 15 points each (6 × 15 = 90), bonus = 10
  let score = 0;
  if (criteria.length) score += 15;
  if (criteria.uppercase) score += 15;
  if (criteria.hasLowercase) score += 15;
  if (criteria.hasNumber) score += 15;
  if (criteria.hasSpecialChar) score += 15;
  if (criteria.bonusLength) score += 10;

  // Extra length bonuses
  if (password.length >= 16) score += 5;
  if (password.length >= 20) score += 5;

  // Cap at 100
  score = Math.min(score, 100);

  // Determine label
  let label: PasswordStrength['label'];
  if (score >= 80) {
    label = 'very-strong';
  } else if (score >= 60) {
    label = 'strong';
  } else if (score >= 40) {
    label = 'fair';
  } else if (score >= 20) {
    label = 'weak';
  } else {
    label = 'very-weak';
  }

  return { score, label, criteria };
}

// ─── Utility Functions ──────────────────────────────────────────────────

/**
 * Get a stored password entry (for admin/debug use only).
 * Returns the stored metadata without the hash.
 *
 * @param walletId - The wallet ID.
 * @returns StoredPassword or undefined if not found.
 */
export function getPasswordEntry(walletId: string): StoredPassword | undefined {
  return activeStore.get(walletId);
}

/**
 * Remove a stored password for a wallet.
 *
 * @param walletId - The wallet ID.
 * @returns True if the entry was found and removed.
 */
export function removePassword(walletId: string): boolean {
  return activeStore.delete(walletId);
}

/**
 * Clear all stored passwords.
 */
export function clearAllPasswords(): void {
  activeStore.clear();
}
