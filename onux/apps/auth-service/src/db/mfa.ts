/**
 * MFA (Multi-Factor Authentication) data access layer
 */
import { query } from './pool.js';
import { v4 as uuidv4 } from 'uuid';
import argon2 from 'argon2';

export interface MfaMethodRecord {
  id: string;
  user_id: string;
  type: 'totp' | 'webauthn' | 'email_otp' | 'recovery_code';
  is_enabled: boolean;
  is_primary: boolean;
  totp_secret: string | null;
  totp_verified: boolean | null;
  recovery_codes_hash: string[] | null;
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
  used: boolean;
  created_at: string;
}

/**
 * Create a TOTP method (unverified until user confirms)
 */
export async function createTotpMethod(params: {
  userId: string;
  secret: string;
}): Promise<MfaMethodRecord> {
  const id = uuidv4();
  
  // Disable any existing TOTP methods first
  await query(
    `UPDATE mfa_methods SET is_enabled = FALSE WHERE user_id = $1 AND type = 'totp'`,
    [params.userId]
  );
  
  const result = await query<MfaMethodRecord>(
    `INSERT INTO mfa_methods (id, user_id, type, is_enabled, totp_secret, totp_verified)
     VALUES ($1, $2, 'totp', FALSE, $3, FALSE)
     RETURNING *`,
    [id, params.userId, params.secret]
  );
  
  return result.rows[0];
}

/**
 * Verify and enable TOTP method
 */
export async function enableTotpMethod(methodId: string, userId: string): Promise<boolean> {
  const result = await query(
    `UPDATE mfa_methods 
     SET is_enabled = TRUE, totp_verified = TRUE, updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND type = 'totp' AND totp_verified = FALSE
     RETURNING id`,
    [methodId, userId]
  );
  
  if (result.rowCount && result.rowCount > 0) {
    // Enable MFA on user record
    await query(
      `UPDATE users SET mfa_enabled = TRUE, updated_at = NOW() WHERE id = $1`,
      [userId]
    );
    return true;
  }
  return false;
}

/**
 * Get user's TOTP method
 */
export async function getUserTotpMethod(userId: string): Promise<MfaMethodRecord | null> {
  const result = await query<MfaMethodRecord>(
    `SELECT * FROM mfa_methods WHERE user_id = $1 AND type = 'totp' AND is_enabled = TRUE`,
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Disable MFA for user
 */
export async function disableMfa(userId: string): Promise<void> {
  await query(
    `UPDATE mfa_methods SET is_enabled = FALSE WHERE user_id = $1`,
    [userId]
  );
  await query(
    `UPDATE users SET mfa_enabled = FALSE, mfa_required = FALSE, updated_at = NOW() WHERE id = $1`,
    [userId]
  );
}

/**
 * Store recovery codes (hashed)
 */
export async function storeRecoveryCodes(userId: string, codes: string[]): Promise<void> {
  const hashedCodes = await Promise.all(
    codes.map(code => argon2.hash(code, { type: argon2.argon2id }))
  );
  
  // Update or insert recovery codes method
  const existing = await query(
    `SELECT id FROM mfa_methods WHERE user_id = $1 AND type = 'recovery_code'`,
    [userId]
  );
  
  if (existing.rows.length > 0) {
    await query(
      `UPDATE mfa_methods SET recovery_codes_hash = $1, is_enabled = TRUE, updated_at = NOW() WHERE id = $2`,
      [hashedCodes, existing.rows[0].id]
    );
  } else {
    const id = uuidv4();
    await query(
      `INSERT INTO mfa_methods (id, user_id, type, is_enabled, recovery_codes_hash)
       VALUES ($1, $2, 'recovery_code', TRUE, $3)`,
      [id, userId, hashedCodes]
    );
  }
}

/**
 * Verify and consume a recovery code
 */
export async function verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
  const result = await query<MfaMethodRecord>(
    `SELECT * FROM mfa_methods WHERE user_id = $1 AND type = 'recovery_code' AND is_enabled = TRUE`,
    [userId]
  );
  
  if (result.rows.length === 0 || !result.rows[0].recovery_codes_hash) {
    return false;
  }
  
  const method = result.rows[0];
  const hashedCodes = method.recovery_codes_hash;
  
  // Find matching code
  let matchingIndex = -1;
  for (let i = 0; i < hashedCodes.length; i++) {
    if (await argon2.verify(hashedCodes[i], code)) {
      matchingIndex = i;
      break;
    }
  }
  
  if (matchingIndex === -1) {
    return false;
  }
  
  // Remove used code
  const remainingCodes = [...hashedCodes];
  remainingCodes.splice(matchingIndex, 1);
  
  await query(
    `UPDATE mfa_methods SET recovery_codes_hash = $1, updated_at = NOW() WHERE id = $2`,
    [remainingCodes, method.id]
  );
  
  // If no recovery codes left, disable that method
  if (remainingCodes.length === 0) {
    await query(
      `UPDATE mfa_methods SET is_enabled = FALSE WHERE id = $1`,
      [method.id]
    );
  }
  
  return true;
}

/**
 * Create MFA challenge session
 */
export async function createMfaChallenge(params: {
  userId: string;
  challengeType: string;
  sessionToken: string;
}): Promise<MfaChallengeRecord> {
  const id = uuidv4();
  
  const result = await query<MfaChallengeRecord>(
    `INSERT INTO mfa_challenges (id, user_id, challenge_type, session_token, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + INTERVAL '10 minutes')
     RETURNING *`,
    [id, params.userId, params.challengeType, params.sessionToken]
  );
  
  return result.rows[0];
}

/**
 * Consume MFA challenge
 */
export async function consumeMfaChallenge(sessionToken: string): Promise<MfaChallengeRecord | null> {
  const result = await query<MfaChallengeRecord>(
    `UPDATE mfa_challenges 
     SET used = TRUE 
     WHERE session_token = $1 AND used = FALSE AND expires_at > NOW()
     RETURNING *`,
    [sessionToken]
  );
  
  return result.rows[0] || null;
}

/**
 * Get remaining recovery codes count
 */
export async function getRecoveryCodesCount(userId: string): Promise<number> {
  const result = await query<MfaMethodRecord>(
    `SELECT recovery_codes_hash FROM mfa_methods WHERE user_id = $1 AND type = 'recovery_code' AND is_enabled = TRUE`,
    [userId]
  );
  
  if (result.rows.length === 0 || !result.rows[0].recovery_codes_hash) {
    return 0;
  }
  
  return result.rows[0].recovery_codes_hash.length;
}
