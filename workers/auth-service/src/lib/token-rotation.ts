/**
 * Token Rotation Security Module
 * Implements refresh token rotation with reuse detection.
 */
import type { Env, TokenPayload } from './types.js';
import { generateRefreshToken } from './jwt.js';
import { hashToken, uuidv4 } from './utils.js';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionRecord {
  id: string;
  user_id: string;
  token_family: string;
  token_hash: string;
  token_type: string;
  issued_at: string;
  expires_at: string;
  revoked_at: string | null;
  is_revoked: number;
  ip_address: string | null;
  user_agent: string | null;
  family_revoked_at?: string | null;
}

/**
 * Rotate a refresh token
 */
export async function rotateRefreshToken(
  db: D1Database,
  oldToken: string,
  payload: TokenPayload,
  env: Env,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<{ newToken: string; familyId: string }> {
  const oldTokenHash = await hashToken(oldToken);

  // Look up the existing session
  const existing = await db
    .prepare(
      `SELECT s.*, tf.revoked_at AS family_revoked_at
       FROM sessions s
       JOIN token_families tf ON tf.id = s.token_family
       WHERE s.token_hash = ? AND s.token_type = 'refresh'`
    )
    .bind(oldTokenHash)
    .first<SessionRecord>();

  if (!existing) {
    const err = new Error('TOKEN_NOT_FOUND') as Error & { code?: string };
    err.code = 'TOKEN_NOT_FOUND';
    throw err;
  }

  if (existing.is_revoked || existing.revoked_at || existing.family_revoked_at) {
    const err = new Error('TOKEN_REUSE_DETECTED') as Error & {
      code?: string;
      userId?: string;
      familyId?: string;
    };
    err.code = 'TOKEN_REUSE_DETECTED';
    err.userId = existing.user_id;
    err.familyId = existing.token_family;
    throw err;
  }

  // Revoke old token
  await db
    .prepare(`UPDATE sessions SET is_revoked = 1, revoked_at = datetime('now') WHERE id = ?`)
    .bind(existing.id)
    .run();

  // Generate new refresh token
  const newToken = await generateRefreshToken(
    { sub: payload.sub, email: payload.email, role: payload.role },
    env
  );
  const newTokenHash = await hashToken(newToken);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS).toISOString();

  // Insert new session in same family
  const now = Date.now();
  const issuedAt = new Date(now).toISOString();
  const newExpiresAt = now + REFRESH_TTL_MS;

  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, token_family, token_hash, refresh_token_hash, token_type, issued_at, expires_at, created_at, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, 'refresh', ?, ?, ?, ?, ?)`
    )
    .bind(
      uuidv4(),
      payload.sub,
      existing.token_family,
      newTokenHash,
      newTokenHash,
      issuedAt,
      newExpiresAt,
      now,
      metadata?.ipAddress || null,
      metadata?.userAgent || null
    )
    .run();

  return { newToken, familyId: existing.token_family };
}

/**
 * Detect whether a token has already been used
 */
export async function detectTokenReuse(
  db: D1Database,
  token: string
): Promise<{ isReused: boolean; userId?: string; familyId?: string }> {
  const tokenHash = await hashToken(token);

  const session = await db
    .prepare(`SELECT * FROM sessions WHERE token_hash = ? AND token_type = 'refresh'`)
    .bind(tokenHash)
    .first<SessionRecord>();

  if (!session) {
    return { isReused: false };
  }

  if (session.is_revoked || session.revoked_at) {
    return {
      isReused: true,
      userId: session.user_id,
      familyId: session.token_family,
    };
  }

  return { isReused: false };
}

/**
 * Revoke all tokens for a user
 */
export async function revokeAllUserTokens(
  db: D1Database,
  userId: string,
  reason: string
): Promise<{ revokedCount: number }> {
  const sessionResult = await db
    .prepare(
      `UPDATE sessions SET is_revoked = 1, revoked_at = datetime('now'), revocation_reason = ?
       WHERE user_id = ? AND is_revoked = 0`
    )
    .bind(reason, userId)
    .run();

  await db
    .prepare(
      `UPDATE token_families SET revoked_at = datetime('now'), revocation_reason = ?
       WHERE user_id = ? AND revoked_at IS NULL`
    )
    .bind(reason, userId)
    .run();

  return { revokedCount: sessionResult.meta.changes };
}

/**
 * Record initial token issuance after login
 */
export async function recordTokenIssuance(
  db: D1Database,
  userId: string,
  token: string,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<string> {
  const tokenHash = await hashToken(token);
  const familyId = uuidv4();
  const now = Date.now();
  const issuedAt = new Date(now).toISOString();
  const expiresAt = now + REFRESH_TTL_MS;

  await db
    .prepare(`INSERT INTO token_families (id, user_id) VALUES (?, ?)`)
    .bind(familyId, userId)
    .run();

  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, token_family, token_hash, refresh_token_hash, token_type, issued_at, expires_at, created_at, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, 'refresh', ?, ?, ?, ?, ?)`
    )
    .bind(
      uuidv4(),
      userId,
      familyId,
      tokenHash,
      tokenHash,
      issuedAt,
      expiresAt,
      now,
      metadata?.ipAddress || null,
      metadata?.userAgent || null
    )
    .run();

  return familyId;
}

/**
 * Log a security event
 */
export async function logSecurityEvent(params: {
  db: D1Database;
  userId: string;
  eventType: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const { db, userId, eventType, severity = 'high', details, ipAddress, userAgent } = params;

  await db
    .prepare(
      `INSERT INTO security_events (id, user_id, event_type, details, ip_address, user_agent, severity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      uuidv4(),
      userId,
      eventType,
      JSON.stringify(details),
      ipAddress || null,
      userAgent || null,
      severity
    )
    .run();
}
