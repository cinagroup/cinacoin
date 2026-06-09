/**
 * User data access layer
 * Handles all database operations for users
 */
import { query, transaction } from './pool.js';
import type { UserRecord, UserRole, UserStatus } from '../lib/types.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new user
 */
export async function createUser(params: {
  id?: string;
  email: string;
  username: string;
  passwordHash?: string | null;
  displayName?: string;
  role?: UserRole;
  authType?: 'password' | 'oauth' | 'web3' | 'passkey';
}): Promise<UserRecord> {
  const id = params.id || uuidv4();
  const { email, username, passwordHash, displayName, role = 'user', authType = 'password' } = params;

  const result = await query<UserRecord>(
    `
    INSERT INTO users (id, email, username, display_name, password_hash, role, status, auth_type)
    VALUES ($1, $2, $3, $4, $5, $6, 'active', $7)
    RETURNING *
    `,
    [id, email, username, displayName || null, passwordHash ?? null, role, authType]
  );

  return result.rows[0];
}

/**
 * Find a user by ID
 */
export async function findUserById(id: string): Promise<UserRecord | null> {
  const result = await query<UserRecord>(
    'SELECT * FROM users WHERE id = $1 AND status != $2',
    [id, 'deleted']
  );
  return result.rows[0] || null;
}

/**
 * Find a user by email
 */
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const result = await query<UserRecord>(
    'SELECT * FROM users WHERE email = $1 AND status != $2',
    [email.toLowerCase(), 'deleted']
  );
  return result.rows[0] || null;
}

/**
 * Find a user by username
 */
export async function findUserByUsername(username: string): Promise<UserRecord | null> {
  const result = await query<UserRecord>(
    'SELECT * FROM users WHERE username = $1 AND status != $2',
    [username, 'deleted']
  );
  return result.rows[0] || null;
}

/**
 * Update user last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await query(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [userId]
  );
}

/**
 * Update user password
 */
export async function updatePassword(userId: string, newPasswordHash: string): Promise<void> {
  await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newPasswordHash, userId]
  );
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: { username?: string; displayName?: string }
): Promise<UserRecord | null> {
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.username !== undefined) {
    setClauses.push(`username = $${paramIndex++}`);
    values.push(updates.username);
  }

  if (updates.displayName !== undefined) {
    setClauses.push(`display_name = $${paramIndex++}`);
    values.push(updates.displayName);
  }

  if (setClauses.length === 0) {
    return findUserById(userId);
  }

  setClauses.push('updated_at = NOW()');
  values.push(userId);

  const result = await query<UserRecord>(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

/**
 * Update user status
 */
export async function updateUserStatus(
  userId: string,
  status: UserStatus
): Promise<void> {
  await query(
    'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
    [status, userId]
  );
}

/**
 * Mark email as verified
 */
export async function verifyEmail(userId: string): Promise<void> {
  await query(
    'UPDATE users SET email_verified_at = NOW(), updated_at = NOW() WHERE id = $1',
    [userId]
  );
}

/**
 * Check if email exists
 */
export async function emailExists(email: string): Promise<boolean> {
  const result = await query(
    'SELECT 1 FROM users WHERE email = $1 AND status != $2 LIMIT 1',
    [email.toLowerCase(), 'deleted']
  );
  return result.rows.length > 0;
}

/**
 * Check if username exists
 */
export async function usernameExists(username: string): Promise<boolean> {
  const result = await query(
    'SELECT 1 FROM users WHERE username = $1 AND status != $2 LIMIT 1',
    [username, 'deleted']
  );
  return result.rows.length > 0;
}

/**
 * List users with pagination
 */
export async function listUsers(params: {
  page?: number;
  pageSize?: number;
  status?: UserStatus;
  role?: UserRole;
}): Promise<{ users: UserRecord[]; total: number }> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const offset = (page - 1) * pageSize;

  const whereClauses: string[] = ["status != 'deleted'"];
  const values: any[] = [];
  let paramIndex = 1;

  if (params.status) {
    whereClauses.push(`status = $${paramIndex++}`);
    values.push(params.status);
  }

  if (params.role) {
    whereClauses.push(`role = $${paramIndex++}`);
    values.push(params.role);
  }

  const whereClause = whereClauses.join(' AND ');

  const countResult = await query(
    `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const usersResult = await query<UserRecord>(
    `
    SELECT * FROM users 
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `,
    [...values, pageSize, offset]
  );

  return { users: usersResult.rows, total };
}

/**
 * Delete a user (soft delete)
 */
export async function deleteUser(userId: string): Promise<void> {
  await updateUserStatus(userId, 'deleted');
}
