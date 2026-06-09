/**
 * OAuth Accounts Data Access Layer
 * Handles all database operations for OAuth-linked accounts
 */
import { query, transaction } from './pool.js';
import type { OAuthAccountRecord, OAuthProvider, AuditLogRecord } from '../lib/types.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Find an OAuth account by provider and provider user ID
 */
export async function findOAuthAccount(
  provider: OAuthProvider,
  providerUserId: string
): Promise<OAuthAccountRecord | null> {
  const result = await query<OAuthAccountRecord>(
    'SELECT * FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2',
    [provider, providerUserId]
  );
  return result.rows[0] || null;
}

/**
 * Find all OAuth accounts for a user
 */
export async function findOAuthAccountsByUserId(
  userId: string
): Promise<OAuthAccountRecord[]> {
  const result = await query<OAuthAccountRecord>(
    'SELECT * FROM oauth_accounts WHERE user_id = $1 ORDER BY created_at ASC',
    [userId]
  );
  return result.rows;
}

/**
 * Find an OAuth account by ID
 */
export async function findOAuthAccountById(
  id: string
): Promise<OAuthAccountRecord | null> {
  const result = await query<OAuthAccountRecord>(
    'SELECT * FROM oauth_accounts WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Create a new OAuth account link
 */
export async function createOAuthAccount(params: {
  userId: string;
  provider: OAuthProvider;
  providerUserId: string;
  providerEmail?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
  scope?: string | null;
  rawProfile?: Record<string, unknown>;
}): Promise<OAuthAccountRecord> {
  const id = uuidv4();
  const result = await query<OAuthAccountRecord>(
    `INSERT INTO oauth_accounts (
      id, user_id, provider, provider_user_id, provider_email,
      access_token, refresh_token, token_expires_at, scope, raw_profile
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      id,
      params.userId,
      params.provider,
      params.providerUserId,
      params.providerEmail || null,
      params.accessToken || null,
      params.refreshToken || null,
      params.tokenExpiresAt || null,
      params.scope || null,
      JSON.stringify(params.rawProfile || {}),
    ]
  );
  return result.rows[0];
}

/**
 * Update an existing OAuth account (e.g., refresh tokens)
 */
export async function updateOAuthAccount(
  id: string,
  updates: {
    accessToken?: string;
    refreshToken?: string;
    tokenExpiresAt?: string;
    scope?: string;
    rawProfile?: Record<string, unknown>;
    providerEmail?: string;
  }
): Promise<OAuthAccountRecord | null> {
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.accessToken !== undefined) {
    setClauses.push(`access_token = $${paramIndex++}`);
    values.push(updates.accessToken);
  }
  if (updates.refreshToken !== undefined) {
    setClauses.push(`refresh_token = $${paramIndex++}`);
    values.push(updates.refreshToken);
  }
  if (updates.tokenExpiresAt !== undefined) {
    setClauses.push(`token_expires_at = $${paramIndex++}`);
    values.push(updates.tokenExpiresAt);
  }
  if (updates.scope !== undefined) {
    setClauses.push(`scope = $${paramIndex++}`);
    values.push(updates.scope);
  }
  if (updates.rawProfile !== undefined) {
    setClauses.push(`raw_profile = $${paramIndex++}`);
    values.push(JSON.stringify(updates.rawProfile));
  }
  if (updates.providerEmail !== undefined) {
    setClauses.push(`provider_email = $${paramIndex++}`);
    values.push(updates.providerEmail);
  }

  if (setClauses.length === 0) return findOAuthAccountById(id);

  setClauses.push('updated_at = NOW()');
  values.push(id);

  const result = await query<OAuthAccountRecord>(
    `UPDATE oauth_accounts SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

/**
 * Delete an OAuth account (unlink)
 */
export async function deleteOAuthAccount(
  id: string,
  userId: string
): Promise<boolean> {
  const result = await query(
    'DELETE FROM oauth_accounts WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return (result.rowCount || 0) > 0;
}

/**
 * Update user's oauth_providers JSON field (denormalized)
 */
export async function updateUserOAuthProviders(userId: string): Promise<void> {
  await query(
    `UPDATE users SET
      oauth_providers = (
        SELECT COALESCE(json_agg(json_build_object(
          'provider', provider,
          'provider_user_id', provider_user_id,
          'provider_email', provider_email
        )), '[]'::json)
        FROM oauth_accounts WHERE user_id = $1
      ),
      updated_at = NOW()
    WHERE id = $1`,
    [userId]
  );
}

/**
 * Check if a user has a password set (for unlink safety)
 */
export async function userHasPassword(userId: string): Promise<boolean> {
  const result = await query(
    "SELECT password_hash FROM users WHERE id = $1",
    [userId]
  );
  if (result.rows.length === 0) return false;
  const hash = result.rows[0].password_hash;
  return hash !== null && hash !== '';
}

/**
 * Count OAuth accounts for a user
 */
export async function countOAuthAccounts(userId: string): Promise<number> {
  const result = await query(
    'SELECT COUNT(*) as count FROM oauth_accounts WHERE user_id = $1',
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
}

/**
 * Write an audit log entry
 * Uses the existing auth_audit_log table from migration 002
 */
export async function writeAuditLog(params: {
  userId?: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failure';
}): Promise<void> {
  // Map to auth_audit_log schema: event_type, metadata, success (boolean)
  const metadata = {
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    ...params.details,
  };

  await query(
    `INSERT INTO auth_audit_log (id, user_id, event_type, ip_address, user_agent, metadata, success)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      uuidv4(),
      params.userId || null,
      params.action,
      params.ipAddress || null,
      params.userAgent || null,
      JSON.stringify(metadata),
      params.status === 'success',
    ]
  );
}
