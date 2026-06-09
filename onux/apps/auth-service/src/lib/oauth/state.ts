/**
 * OAuth State Management
 * Handles CSRF protection and PKCE code verifiers
 */
import { query } from '../../db/pool.js';
import type { OAuthStateRecord, OAuthProvider } from '../types.js';
import { getConfig } from '../config.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Generate random state for OAuth CSRF protection
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate PKCE code verifier
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Store OAuth state in database
 */
export async function storeOAuthState(params: {
  provider: OAuthProvider;
  state: string;
  codeVerifier?: string;
  redirectUri?: string;
  returnUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const config = getConfig();
  const expiresAt = new Date(Date.now() + config.oauth.stateExpiryMinutes * 60 * 1000);

  await query(
    `INSERT INTO oauth_states (id, state, provider, code_verifier, redirect_uri, return_url, metadata, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      uuidv4(),
      params.state,
      params.provider,
      params.codeVerifier || null,
      params.redirectUri || null,
      params.returnUrl || null,
      JSON.stringify(params.metadata || {}),
      expiresAt,
    ]
  );
}

/**
 * Validate and consume OAuth state
 * Returns the state record and marks it as used
 */
export async function validateAndConsumeState(
  state: string,
  provider: OAuthProvider
): Promise<OAuthStateRecord | null> {
  const result = await query<OAuthStateRecord>(
    `UPDATE oauth_states
     SET used_at = NOW()
     WHERE state = $1 AND provider = $2 AND used_at IS NULL AND expires_at > NOW()
     RETURNING *`,
    [state, provider]
  );

  return result.rows[0] || null;
}

/**
 * Clean up expired OAuth states
 */
export async function cleanupExpiredStates(): Promise<number> {
  const result = await query(
    `DELETE FROM oauth_states WHERE expires_at < NOW() - INTERVAL '1 hour'`
  );

  return result.rowCount || 0;
}
