import { logger } from '@cinacoin/logger';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

export interface KeyManagerConfig {
  /** Encryption key for at-rest key storage */
  encryptionKey?: string;
  /** Storage backend identifier */
  storageUri?: string;
  /** Session TTL in milliseconds */
  sessionTtlMs?: number;
  /** Salt for key derivation (16 bytes hex string). If not provided, a random salt is generated. */
  salt?: string;
}

export interface StoredKey {
  id: string;
  label: string;
  encrypted: string;
  algorithm: string;
  salt: string; // Salt used for encryption (hex encoded)
  createdAt: number;
}

export interface Session {
  id: string;
  userId: string;
  permissions: string[];
  expiresAt: number;
}

export interface DecryptResult {
  key: Uint8Array;
  metadata: Record<string, string>;
}

/**
 * KeyManager — handles key storage, encryption/decryption, and session management.
 * Uses AES-256-GCM for encryption with keys derived via scrypt.
 */
export class KeyManager {
  private encryptionKey: Buffer;
  private salt: Buffer;
  private store: Map<string, StoredKey> = new Map();
  private sessions: Map<string, Session> = new Map();
  private readonly sessionTtlMs: number;
  private static readonly LEGACY_SALT = 'onux-salt'; // For migration only
  private static readonly LEGACY_DEV_KEY = 'default-dev-key-do-not-use-in-production'; // For migration only

  constructor(config?: KeyManagerConfig) {
    // [S-002] Fix: Require encryption key in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!config?.encryptionKey) {
      if (isProduction) {
        throw new Error(
          'ENCRYPTION_KEY environment variable is required in production. ' +
          'Generate a secure key with: openssl rand -hex 32'
        );
      }
      // Development fallback with warning
      logger.warn(
        '[SECURITY WARNING] ENCRYPTION_KEY not set. Using insecure development key. ' +
        'This MUST NOT be used in production!'
      );
      const keyPhrase = KeyManager.LEGACY_DEV_KEY;
      // [H-001] Fix: Use random salt or provided salt, not hardcoded
      this.salt = config?.salt ? Buffer.from(config.salt, 'hex') : randomBytes(16);
      this.encryptionKey = scryptSync(keyPhrase, this.salt, 32);
    } else {
      // [H-001] Fix: Use random salt or provided salt, not hardcoded
      this.salt = config?.salt ? Buffer.from(config.salt, 'hex') : randomBytes(16);
      this.encryptionKey = scryptSync(config.encryptionKey, this.salt, 32);
    }
    
    this.sessionTtlMs = config?.sessionTtlMs ?? 3600_000; // 1 hour default
  }

  /** Store an encrypted key with a label */
  async storeKey(id: string, label: string, keyData: Uint8Array): Promise<StoredKey> {
    const { ciphertext, iv, authTag } = this.encrypt(keyData);
    const encrypted = Buffer.concat([iv, authTag, ciphertext]).toString('base64');
    const stored: StoredKey = {
      id,
      label,
      encrypted,
      algorithm: 'aes-256-gcm',
      salt: this.salt.toString('hex'), // Store salt with encrypted data
      createdAt: Date.now(),
    };
    this.store.set(id, stored);
    return stored;
  }

  /** Retrieve and decrypt a stored key */
  async getKey(id: string): Promise<StoredKey | null> {
    const stored = this.store.get(id);
    if (!stored) return null;
    return stored;
  }

  /** Decrypt an encrypted key value */
  decryptKey(encrypted: string, saltHex?: string): Uint8Array {
    const data = Buffer.from(encrypted, 'base64');
    const iv = data.subarray(0, 16);
    const authTag = data.subarray(16, 32);
    const ciphertext = data.subarray(32);
    
    // Use provided salt or current salt
    const decryptSalt = saltHex ? Buffer.from(saltHex, 'hex') : this.salt;
    
    // If salt differs from current, derive key with the provided salt
    let decryptionKey = this.encryptionKey;
    if (saltHex && saltHex !== this.salt.toString('hex')) {
      const keyPhrase = process.env.ENCRYPTION_KEY;
      if (!keyPhrase) {
        throw new Error(
          'ENCRYPTION_KEY is required to decrypt data encrypted with a different salt. ' +
          'Cannot fall back to insecure default.'
        );
      }
      decryptionKey = scryptSync(keyPhrase, decryptSalt, 32);
    }
    
    const decipher = createDecipheriv('aes-256-gcm', decryptionKey, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  /**
   * Migrate legacy encrypted data to use random salt
   * Call this for data encrypted with the old hardcoded salt
   * 
   * NOTE: This method requires ENCRYPTION_KEY to be set. It will throw in
   * production if the key is missing.
   */
  async migrateLegacyKey(id: string, label: string, legacyEncrypted: string): Promise<StoredKey> {
    const keyPhrase = process.env.ENCRYPTION_KEY;
    if (!keyPhrase) {
      throw new Error(
        'ENCRYPTION_KEY is required for legacy key migration. ' +
        'Cannot fall back to insecure default.'
      );
    }
    // Decrypt with legacy salt
    const legacySalt = Buffer.from(KeyManager.LEGACY_SALT);
    const legacyKey = scryptSync(keyPhrase, legacySalt, 32);
    
    const data = Buffer.from(legacyEncrypted, 'base64');
    const iv = data.subarray(0, 16);
    const authTag = data.subarray(16, 32);
    const ciphertext = data.subarray(32);
    
    const decipher = createDecipheriv('aes-256-gcm', legacyKey, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    
    // Re-encrypt with current (random) salt
    return this.storeKey(id, label, decrypted);
  }

  /** Delete a stored key */
  deleteKey(id: string): boolean {
    return this.store.delete(id);
  }

  /** List all stored keys (metadata only, no key material) */
  listKeys(): Omit<StoredKey, 'encrypted'>[] {
    return Array.from(this.store.values()).map(({ encrypted, ...rest }) => rest);
  }

  /** Create a new session with permissions */
  createSession(userId: string, permissions: string[]): Session {
    const id = randomBytes(16).toString('hex');
    const session: Session = {
      id,
      userId,
      permissions,
      expiresAt: Date.now() + this.sessionTtlMs,
    };
    this.sessions.set(id, session);
    return session;
  }

  /** Validate a session token */
  validateSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }

  /** Revoke a session */
  revokeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  private encrypt(data: Uint8Array): { ciphertext: Buffer; iv: Buffer; authTag: Buffer } {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return { ciphertext, iv, authTag };
  }
}
