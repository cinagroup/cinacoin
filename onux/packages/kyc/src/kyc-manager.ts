/**
 * KYC Status Manager & Credential Storage
 *
 * Manages KYC state lifecycle and stores encrypted KYC credentials.
 * Supports local storage (browser) and server-side storage adapters.
 */

import type { KycLevel } from "./providers.js";
import type { KycStatus } from "./types.js";
import type { KycProviderResult } from "./providers.js";

// ============================================================
// Types
// ============================================================

/** KYC status record for a user. */
export interface KycStatusRecord {
  /** User identifier (wallet address or internal ID) */
  userId: string;
  /** Current KYC status */
  status: KycStatus;
  /** KYC level achieved */
  level?: KycLevel;
  /** Provider used for verification */
  provider: string;
  /** Provider-specific applicant ID */
  providerApplicantId: string;
  /** When the status was last updated */
  updatedAt: string;
  /** When the KYC was first submitted */
  submittedAt: string;
  /** When the KYC expires (if applicable) */
  expiresAt?: string;
  /** Rejection reason (if rejected) */
  rejectReason?: string;
  /** Last verification URL */
  verificationUrl?: string;
}

/** Encrypted KYC credential for storage. */
export interface EncryptedKycCredential {
  /** User identifier */
  userId: string;
  /** Encrypted document data (base64) */
  encryptedData: string;
  /** Initialization vector (base64) */
  iv: string;
  /** Encryption algorithm */
  algorithm: "AES-GCM";
  /** Created timestamp */
  createdAt: string;
  /** Document type */
  docType: string;
}

/** Storage backend for KYC data. */
export interface KycStorage {
  /** Get a KYC status record */
  getStatus(userId: string): Promise<KycStatusRecord | null>;
  /** Save a KYC status record */
  saveStatus(record: KycStatusRecord): Promise<void>;
  /** Get encrypted credentials */
  getCredentials(userId: string): Promise<EncryptedKycCredential[]>;
  /** Save an encrypted credential */
  saveCredential(credential: EncryptedKycCredential): Promise<void>;
  /** Delete all data for a user */
  deleteUserData(userId: string): Promise<void>;
}

// ============================================================
// In-Memory Storage (for testing / client-side)
// ============================================================

export class InMemoryKycStorage implements KycStorage {
  private statuses: Map<string, KycStatusRecord> = new Map();
  private credentials: Map<string, EncryptedKycCredential[]> = new Map();

  async getStatus(userId: string): Promise<KycStatusRecord | null> {
    return this.statuses.get(userId) ?? null;
  }

  async saveStatus(record: KycStatusRecord): Promise<void> {
    this.statuses.set(record.userId, record);
  }

  async getCredentials(userId: string): Promise<EncryptedKycCredential[]> {
    return this.credentials.get(userId) ?? [];
  }

  async saveCredential(credential: EncryptedKycCredential): Promise<void> {
    const existing = this.credentials.get(credential.userId) ?? [];
    existing.push(credential);
    this.credentials.set(credential.userId, existing);
  }

  async deleteUserData(userId: string): Promise<void> {
    this.statuses.delete(userId);
    this.credentials.delete(userId);
  }
}

// ============================================================
// LocalStorage (for browser use)
// ============================================================

export class LocalStorageKyc implements KycStorage {
  private prefix: string;

  constructor(prefix: string = "cinacoin-kyc") {
    this.prefix = prefix;
  }

  private keyFor(type: string, userId: string): string {
    return `${this.prefix}:${type}:${userId}`;
  }

  async getStatus(userId: string): Promise<KycStatusRecord | null> {
    try {
      const raw = localStorage.getItem(this.keyFor("status", userId));
      if (!raw) return null;
      return JSON.parse(raw) as KycStatusRecord;
    } catch {
      return null;
    }
  }

  async saveStatus(record: KycStatusRecord): Promise<void> {
    localStorage.setItem(this.keyFor("status", record.userId), JSON.stringify(record));
  }

  async getCredentials(userId: string): Promise<EncryptedKycCredential[]> {
    try {
      const raw = localStorage.getItem(this.keyFor("creds", userId));
      if (!raw) return [];
      return JSON.parse(raw) as EncryptedKycCredential[];
    } catch {
      return [];
    }
  }

  async saveCredential(credential: EncryptedKycCredential): Promise<void> {
    const existing = await this.getCredentials(credential.userId);
    existing.push(credential);
    localStorage.setItem(
      this.keyFor("creds", credential.userId),
      JSON.stringify(existing),
    );
  }

  async deleteUserData(userId: string): Promise<void> {
    localStorage.removeItem(this.keyFor("status", userId));
    localStorage.removeItem(this.keyFor("creds", userId));
  }
}

// ============================================================
// Encryption Helpers
// ============================================================

/**
 * Encrypt data using AES-GCM with a provided key.
 * Returns { encryptedData, iv } both as base64 strings.
 */
export async function encryptCredential(
  data: string,
  key: CryptoKey,
): Promise<{ encryptedData: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  );

  return {
    encryptedData: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

/**
 * Decrypt an encrypted credential.
 */
export async function decryptCredential(
  encryptedData: string,
  iv: string,
  key: CryptoKey,
): Promise<string> {
  const encryptedBytes = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
  const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    encryptedBytes,
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Generate a new AES-GCM encryption key.
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

// ============================================================
// KycStatusManager
// ============================================================

export interface KycStatusManagerConfig {
  /** Storage backend */
  storage: KycStorage;
  /** Default expiry in days (365 = 1 year) */
  defaultExpiryDays?: number;
}

export class KycStatusManager {
  private storage: KycStorage;
  private defaultExpiryDays: number;

  constructor(config: KycStatusManagerConfig) {
    this.storage = config.storage;
    this.defaultExpiryDays = config.defaultExpiryDays ?? 365;
  }

  /**
   * Create or update a KYC status record.
   */
  async updateStatus(userId: string, result: KycProviderResult, providerName: string): Promise<KycStatusRecord> {
    const existing = await this.storage.getStatus(userId);

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + this.defaultExpiryDays * 86_400_000).toISOString();

    const record: KycStatusRecord = {
      userId,
      status: result.status,
      level: result.level,
      provider: providerName,
      providerApplicantId: result.providerId,
      updatedAt: now,
      submittedAt: existing?.submittedAt ?? now,
      expiresAt,
      rejectReason: result.rejectReason,
      verificationUrl: existing?.verificationUrl,
    };

    await this.storage.saveStatus(record);
    return record;
  }

  /**
   * Get the current KYC status for a user.
   */
  async getStatus(userId: string): Promise<KycStatusRecord | null> {
    return this.storage.getStatus(userId);
  }

  /**
   * Check if a user is KYC verified.
   */
  async isVerified(userId: string): Promise<boolean> {
    const record = await this.storage.getStatus(userId);
    if (!record) return false;
    if (record.status !== "verified") return false;

    // Check expiry
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Set a verification URL for the user.
   */
  async setVerificationUrl(userId: string, url: string): Promise<void> {
    const record = await this.storage.getStatus(userId);
    if (record) {
      record.verificationUrl = url;
      await this.storage.saveStatus(record);
    }
  }

  /**
   * Store an encrypted KYC credential.
   */
  async storeCredential(_userId: string, credential: EncryptedKycCredential): Promise<void> {
    await this.storage.saveCredential(credential);
  }

  /**
   * Get all encrypted credentials for a user.
   */
  async getCredentials(userId: string): Promise<EncryptedKycCredential[]> {
    return this.storage.getCredentials(userId);
  }

  /**
   * Delete all KYC data for a user (GDPR right to be forgotten).
   */
  async deleteUserData(userId: string): Promise<void> {
    await this.storage.deleteUserData(userId);
  }

  /**
   * Get all users with a specific KYC status.
   * Note: this requires iterating all users; in production, use a database index.
   */
  async getUsersByStatus(_status: KycStatus): Promise<KycStatusRecord[]> {
    // This would be implemented with a database query in production
    return [];
  }
}
