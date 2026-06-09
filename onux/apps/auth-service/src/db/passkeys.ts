/**
 * Passkey (WebAuthn) data access layer
 */
import { query } from './pool.js';
import { v4 as uuidv4 } from 'uuid';

export interface PasskeyRecord {
  id: string;
  user_id: string;
  credential_id: Buffer;
  public_key: Buffer;
  counter: number;
  device_type: string | null;
  backup_eligible: boolean;
  backed_up: boolean;
  transports: string[];
  name: string | null;
  last_used_at: string | null;
  created_at: string;
}

export interface WebAuthnChallengeRecord {
  id: string;
  user_id: string | null;
  challenge: string;
  challenge_type: 'registration' | 'authentication';
  expires_at: string;
  used: boolean;
  created_at: string;
}

/**
 * Create a WebAuthn challenge
 */
export async function createWebAuthnChallenge(params: {
  userId?: string;
  challenge: string;
  type: 'registration' | 'authentication';
}): Promise<WebAuthnChallengeRecord> {
  const id = uuidv4();
  
  const result = await query<WebAuthnChallengeRecord>(
    `INSERT INTO webauthn_challenges (id, user_id, challenge, challenge_type, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + INTERVAL '5 minutes')
     RETURNING *`,
    [id, params.userId || null, params.challenge, params.type]
  );
  
  return result.rows[0];
}

/**
 * Consume a WebAuthn challenge
 */
export async function consumeWebAuthnChallenge(challenge: string, type: 'registration' | 'authentication'): Promise<WebAuthnChallengeRecord | null> {
  const result = await query<WebAuthnChallengeRecord>(
    `UPDATE webauthn_challenges 
     SET used = TRUE 
     WHERE challenge = $1 AND challenge_type = $2 AND used = FALSE AND expires_at > NOW()
     RETURNING *`,
    [challenge, type]
  );
  
  return result.rows[0] || null;
}

/**
 * Store a new passkey credential
 */
export async function createPasskey(params: {
  userId: string;
  credentialId: Buffer;
  publicKey: Buffer;
  counter: number;
  deviceType?: string;
  backupEligible?: boolean;
  backedUp?: boolean;
  transports?: string[];
  name?: string;
}): Promise<PasskeyRecord> {
  const id = uuidv4();
  
  const result = await query<PasskeyRecord>(
    `INSERT INTO passkeys (id, user_id, credential_id, public_key, counter, device_type, 
     backup_eligible, backed_up, transports, name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      id,
      params.userId,
      params.credentialId,
      params.publicKey,
      params.counter,
      params.deviceType || null,
      params.backupEligible || false,
      params.backedUp || false,
      params.transports || [],
      params.name || null,
    ]
  );
  
  return result.rows[0];
}

/**
 * Find a passkey by credential ID
 */
export async function findPasskeyByCredentialId(credentialId: Buffer): Promise<PasskeyRecord | null> {
  const result = await query<PasskeyRecord>(
    `SELECT * FROM passkeys WHERE credential_id = $1`,
    [credentialId]
  );
  return result.rows[0] || null;
}

/**
 * Get all passkeys for a user
 */
export async function getUserPasskeys(userId: string): Promise<PasskeyRecord[]> {
  const result = await query<PasskeyRecord>(
    `SELECT * FROM passkeys WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

/**
 * Update passkey counter after authentication
 */
export async function updatePasskeyCounter(passkeyId: string, counter: number): Promise<void> {
  await query(
    `UPDATE passkeys SET counter = $1, last_used_at = NOW() WHERE id = $2`,
    [counter, passkeyId]
  );
}

/**
 * Delete a passkey
 */
export async function deletePasskey(passkeyId: string, userId: string): Promise<boolean> {
  const result = await query(
    `DELETE FROM passkeys WHERE id = $1 AND user_id = $2`,
    [passkeyId, userId]
  );
  return (result.rowCount || 0) > 0;
}

/**
 * Check if user has any passkeys
 */
export async function userHasPasskeys(userId: string): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM passkeys WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return result.rows.length > 0;
}
