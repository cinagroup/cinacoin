/**
 * MFA Sessions data access layer
 * Handles temporary MFA session tokens used during login flow
 */
import { query } from './pool.js';
import crypto from 'crypto';

export interface MfaSessionRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

/**
 * Create a new MFA session with a secure token
 * Returns the plaintext token (only time it's available) and stores only the hash
 */
export async function createMfaSession(userId: string): Promise<string> {
  // Generate cryptographically secure random token
  const token = crypto.randomUUID();
  
  // Hash the token with SHA-256 before storing
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Store only the hash, never the plaintext
  await query(
    `INSERT INTO mfa_sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '5 minutes')`,
    [userId, tokenHash]
  );
  
  // Return plaintext token (caller must pass to user, then discard)
  return token;
}

/**
 * Consume an MFA session token
 * Validates the token, marks it as used, and returns the associated user_id
 * Returns null if token is invalid, expired, or already used
 */
export async function consumeMfaSession(token: string): Promise<string | null> {
  // Hash the provided token
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Find and consume the session in one atomic operation
  const result = await query<MfaSessionRecord>(
    `UPDATE mfa_sessions 
     SET used = TRUE 
     WHERE token_hash = $1 
       AND used = FALSE 
       AND expires_at > NOW()
     RETURNING user_id`,
    [tokenHash]
  );
  
  if (result.rowCount === 0) {
    return null;
  }
  
  return result.rows[0].user_id;
}

/**
 * Check if an MFA session token is valid (without consuming it)
 */
export async function validateMfaSession(token: string): Promise<boolean> {
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  const result = await query(
    `SELECT 1 FROM mfa_sessions 
     WHERE token_hash = $1 
       AND used = FALSE 
       AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );
  
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Invalidate all MFA sessions for a user (e.g., on logout or security event)
 */
export async function invalidateUserMfaSessions(userId: string): Promise<void> {
  await query(
    `UPDATE mfa_sessions SET used = TRUE WHERE user_id = $1 AND used = FALSE`,
    [userId]
  );
}
