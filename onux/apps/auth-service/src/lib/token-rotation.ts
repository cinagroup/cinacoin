/**
 * Token Rotation Security Module
 * Implements refresh token rotation with reuse detection.
 *
 * Security model:
 * - Each login creates a token_family.
 * - Each refresh revokes the old token and issues a new one within the same family.
 * - If a revoked token is presented again, the entire family is revoked (theft signal).
 */
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '@/db/pool.js';
import { generateRefreshToken } from './jwt.js';
import type { TokenPayload } from './jwt.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TokenFamilyRecord {
  id: string;
  user_id: string;
  created_at: string;
  revoked_at: string | null;
  revocation_reason: string | null;
}

export interface SessionRecord {
  id: string;
  user_id: string;
  token_family: string;
  token_hash: string;
  token_type: 'refresh' | 'access';
  issued_at: string;
  expires_at: string;
  revoked_at: string | null;
  is_revoked: boolean;
  ip_address: string | null;
  user_agent: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** SHA-256 hash of a token for safe storage */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Default refresh token TTL (7 days) */
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Core API
// ---------------------------------------------------------------------------

/**
 * Rotate a refresh token.
 * 1. Look up the old token in sessions.
 * 2. If not found OR already revoked → token reuse / theft detected.
 * 3. Otherwise, revoke old token, issue new one in the same family.
 */
export async function rotateRefreshToken(
  oldToken: string,
  payload: TokenPayload,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<{ newToken: string; familyId: string }> {
  const oldTokenHash = hashToken(oldToken);

  // Use a transaction so the read + write is atomic
  return transaction(async (client) => {
    // Lock the row to prevent race conditions
    const existingResult = await client.query<SessionRecord>(
      `SELECT s.*, tf.revoked_at AS family_revoked_at
       FROM sessions s
       JOIN token_families tf ON tf.id = s.token_family
       WHERE s.token_hash = $1 AND s.token_type = 'refresh'
       FOR UPDATE OF s`,
      [oldTokenHash]
    );

    if (existingResult.rows.length === 0) {
      // Token not found at all — could be a replay of an old token
      const err = new Error('TOKEN_NOT_FOUND') as Error & { code?: string };
      err.code = 'TOKEN_NOT_FOUND';
      throw err;
    }

    const session = existingResult.rows[0];

    // Check if the token itself or its family was already revoked
    const familyRevokedAt = (session as any).family_revoked_at as string | null;
    if (session.is_revoked || session.revoked_at !== null || familyRevokedAt !== null) {
      const err = new Error('TOKEN_REUSE_DETECTED') as Error & {
        code?: string;
        userId?: string;
        familyId?: string;
      };
      err.code = 'TOKEN_REUSE_DETECTED';
      err.userId = session.user_id;
      err.familyId = session.token_family;
      throw err;
    }

    // Revoke old token
    await client.query(
      `UPDATE sessions SET is_revoked = true, revoked_at = NOW() WHERE id = $1`,
      [session.id]
    );

    // Generate new refresh token
    const newToken = generateRefreshToken({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });
    const newTokenHash = hashToken(newToken);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

    // Insert new session row in the same family
    await client.query(
      `INSERT INTO sessions (
        id, user_id, token_family, token_hash, token_type,
        issued_at, expires_at, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, 'refresh', NOW(), $5, $6, $7)`,
      [
        uuidv4(),
        payload.sub,
        session.token_family,
        newTokenHash,
        expiresAt,
        metadata?.ipAddress || null,
        metadata?.userAgent || null,
      ]
    );

    return { newToken, familyId: session.token_family };
  });
}

/**
 * Detect whether a token has already been used (revoked).
 * Returns reuse info without mutating state.
 */
export async function detectTokenReuse(token: string): Promise<{
  isReused: boolean;
  userId?: string;
  familyId?: string;
}> {
  const tokenHash = hashToken(token);

  const result = await query<SessionRecord>(
    `SELECT * FROM sessions WHERE token_hash = $1 AND token_type = 'refresh'`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    return { isReused: false };
  }

  const session = result.rows[0];
  if (session.is_revoked || session.revoked_at !== null) {
    return {
      isReused: true,
      userId: session.user_id,
      familyId: session.token_family,
    };
  }

  return { isReused: false };
}

/**
 * Revoke every session and token family for a user.
 * Called when token reuse / theft is detected.
 */
export async function revokeAllUserTokens(
  userId: string,
  reason: string
): Promise<{ revokedCount: number }> {
  // Revoke all active sessions
  const sessionResult = await query(
    `UPDATE sessions
     SET is_revoked = true, revoked_at = NOW(), revocation_reason = $2
     WHERE user_id = $1 AND is_revoked = false`,
    [userId, reason]
  );

  // Revoke all token families
  await query(
    `UPDATE token_families
     SET revoked_at = NOW(), revocation_reason = $2
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId, reason]
  );

  return { revokedCount: sessionResult.rowCount ?? 0 };
}

/**
 * Create a new token family for a user (called on fresh login).
 */
export async function createTokenFamily(userId: string): Promise<string> {
  const familyId = uuidv4();
  await query(
    `INSERT INTO token_families (id, user_id) VALUES ($1, $2)`,
    [familyId, userId]
  );
  return familyId;
}

/**
 * Record the initial refresh token issuance after a successful login.
 * Returns the new token family id.
 */
export async function recordTokenIssuance(
  userId: string,
  token: string,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<string> {
  const tokenHash = hashToken(token);
  const familyId = await createTokenFamily(userId);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  await query(
    `INSERT INTO sessions (
      id, user_id, token_family, token_hash, token_type,
      issued_at, expires_at, ip_address, user_agent
    ) VALUES ($1, $2, $3, $4, 'refresh', NOW(), $5, $6, $7)`,
    [
      uuidv4(),
      userId,
      familyId,
      tokenHash,
      expiresAt,
      metadata?.ipAddress || null,
      metadata?.userAgent || null,
    ]
  );

  return familyId;
}

/**
 * Log a security event (token reuse, forced revocation, etc.).
 */
export async function logSecurityEvent(params: {
  userId: string;
  eventType: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const { userId, eventType, severity = 'high', details, ipAddress, userAgent } = params;

  await query(
    `INSERT INTO security_events (
      id, user_id, event_type, details, ip_address, user_agent, severity
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      uuidv4(),
      userId,
      eventType,
      JSON.stringify(details),
      ipAddress || null,
      userAgent || null,
      severity,
    ]
  );

  // Also log to console for real-time monitoring
  const logFn = severity === 'critical' ? console.error : console.warn;
  logFn(`🚨 SECURITY EVENT [${severity}]: ${eventType}`, {
    userId,
    details,
    timestamp: new Date().toISOString(),
  });
}
