/**
 * Database queries for MFA
 * D1 (SQLite) compatible
 */
import { uuidv4, now, addMinutes } from '../lib/utils.js';
import { sha256 } from '../lib/utils.js';

export interface MfaMethodRecord {
  id: string;
  user_id: string;
  type: string;
  is_enabled: number;
  is_primary: number;
  totp_secret: string | null;
  totp_verified: number | null;
  recovery_codes_hash: string | null; // JSON array
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface MfaChallengeRecord {
  id: string;
  user_id: string;
  challenge_type: string;
  session_token: string;
  expires_at: string;
  used: number;
  created_at: string;
}

export interface MfaSessionRecord {
  id: number;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used: number;
  created_at: string;
}

/**
 * Create a TOTP method (unverified until user confirms)
 */
export async function createTotpMethod(
  db: D1Database,
  params: { userId: string; secret: string }
): Promise<MfaMethodRecord> {
  const id = uuidv4();
  const timestamp = now();

  // Disable any existing TOTP methods first
  await db
    .prepare(`UPDATE mfa_methods SET is_enabled = 0 WHERE user_id = ? AND type = 'totp'`)
    .bind(params.userId)
    .run();

  await db
    .prepare(
      `INSERT INTO mfa_methods (id, user_id, type, is_enabled, totp_secret, totp_verified, created_at, updated_at)
       VALUES (?, ?, 'totp', 0, ?, 0, ?, ?)`
    )
    .bind(id, params.userId, params.secret, timestamp, timestamp)
    .run();

  const method = await db.prepare('SELECT * FROM mfa_methods WHERE id = ?').bind(id).first<MfaMethodRecord>();
  if (!method) throw new Error('Failed to create TOTP method');
  return method;
}

/**
 * Verify and enable TOTP method
 */
export async function enableTotpMethod(
  db: D1Database,
  methodId: string,
  userId: string
): Promise<boolean> {
  const timestamp = now();
  const result = await db
    .prepare(
      `UPDATE mfa_methods 
       SET is_enabled = 1, totp_verified = 1, updated_at = ?
       WHERE id = ? AND user_id = ? AND type = 'totp' AND totp_verified = 0`
    )
    .bind(timestamp, methodId, userId)
    .run();

  if (result.meta.changes > 0) {
    // Enable MFA on user record
    await db
      .prepare(`UPDATE users SET mfa_enabled = 1, updated_at = ? WHERE id = ?`)
      .bind(timestamp, userId)
      .run();
    return true;
  }
  return false;
}

/**
 * Get user's TOTP method
 */
export async function getUserTotpMethod(
  db: D1Database,
  userId: string
): Promise<MfaMethodRecord | null> {
  return db
    .prepare(`SELECT * FROM mfa_methods WHERE user_id = ? AND type = 'totp' AND is_enabled = 1`)
    .bind(userId)
    .first<MfaMethodRecord>();
}

/**
 * Disable MFA for user
 */
export async function disableMfa(db: D1Database, userId: string): Promise<void> {
  const timestamp = now();
  await db
    .prepare(`UPDATE mfa_methods SET is_enabled = 0 WHERE user_id = ?`)
    .bind(userId)
    .run();
  await db
    .prepare(`UPDATE users SET mfa_enabled = 0, mfa_required = 0, updated_at = ? WHERE id = ?`)
    .bind(timestamp, userId)
    .run();
}

/**
 * Store recovery codes (hashed with SHA-256)
 */
export async function storeRecoveryCodes(
  db: D1Database,
  userId: string,
  codes: string[]
): Promise<void> {
  const hashedCodes = await Promise.all(codes.map((code) => sha256(code)));
  const timestamp = now();

  const existing = await db
    .prepare(`SELECT id FROM mfa_methods WHERE user_id = ? AND type = 'recovery_code'`)
    .bind(userId)
    .first<{ id: string }>();

  if (existing) {
    await db
      .prepare(
        `UPDATE mfa_methods SET recovery_codes_hash = ?, is_enabled = 1, updated_at = ? WHERE id = ?`
      )
      .bind(JSON.stringify(hashedCodes), timestamp, existing.id)
      .run();
  } else {
    const id = uuidv4();
    await db
      .prepare(
        `INSERT INTO mfa_methods (id, user_id, type, is_enabled, recovery_codes_hash, created_at, updated_at)
         VALUES (?, ?, 'recovery_code', 1, ?, ?, ?)`
      )
      .bind(id, userId, JSON.stringify(hashedCodes), timestamp, timestamp)
      .run();
  }
}

/**
 * Verify and consume a recovery code
 */
export async function verifyRecoveryCode(
  db: D1Database,
  userId: string,
  code: string
): Promise<boolean> {
  const method = await db
    .prepare(
      `SELECT * FROM mfa_methods WHERE user_id = ? AND type = 'recovery_code' AND is_enabled = 1`
    )
    .bind(userId)
    .first<MfaMethodRecord>();

  if (!method || !method.recovery_codes_hash) {
    return false;
  }

  const hashedCodes: string[] = JSON.parse(method.recovery_codes_hash);
  const codeHash = await sha256(code);

  const matchingIndex = hashedCodes.findIndex((h) => h === codeHash);
  if (matchingIndex === -1) {
    return false;
  }

  // Remove used code
  const remainingCodes = [...hashedCodes];
  remainingCodes.splice(matchingIndex, 1);
  const timestamp = now();

  await db
    .prepare(`UPDATE mfa_methods SET recovery_codes_hash = ?, updated_at = ? WHERE id = ?`)
    .bind(JSON.stringify(remainingCodes), timestamp, method.id)
    .run();

  // If no recovery codes left, disable that method
  if (remainingCodes.length === 0) {
    await db
      .prepare(`UPDATE mfa_methods SET is_enabled = 0 WHERE id = ?`)
      .bind(method.id)
      .run();
  }

  return true;
}

/**
 * Create MFA session with secure token
 */
export async function createMfaSession(
  db: D1Database,
  userId: string
): Promise<string> {
  const id = uuidv4();
  const token = uuidv4();
  const tokenHash = await sha256(token);
  const expiresAt = addMinutes(5);
  const createdAt = now();

  await db
    .prepare(
      `INSERT INTO mfa_sessions (id, user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(id, userId, tokenHash, expiresAt, createdAt)
    .run();

  return token;
}

/**
 * Consume MFA session token (delete after use)
 */
export async function consumeMfaSession(
  db: D1Database,
  token: string
): Promise<string | null> {
  const tokenHash = await sha256(token);

  const session = await db
    .prepare(
      `SELECT user_id FROM mfa_sessions 
       WHERE token_hash = ? AND expires_at > datetime('now')`
    )
    .bind(tokenHash)
    .first<{ user_id: string }>();

  if (!session) {
    return null;
  }

  // Delete the session after consumption (one-time use)
  await db
    .prepare(`DELETE FROM mfa_sessions WHERE token_hash = ?`)
    .bind(tokenHash)
    .run();

  return session.user_id;
}

/**
 * Get remaining recovery codes count
 */
export async function getRecoveryCodesCount(
  db: D1Database,
  userId: string
): Promise<number> {
  const method = await db
    .prepare(
      `SELECT recovery_codes_hash FROM mfa_methods WHERE user_id = ? AND type = 'recovery_code' AND is_enabled = 1`
    )
    .bind(userId)
    .first<MfaMethodRecord>();

  if (!method || !method.recovery_codes_hash) {
    return 0;
  }

  const codes: string[] = JSON.parse(method.recovery_codes_hash);
  return codes.length;
}
