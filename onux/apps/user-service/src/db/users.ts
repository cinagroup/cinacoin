/**
 * User data access layer
 */
import { query } from './pool.js';
import type { UserRecord, UserStatus } from '../lib/types.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateUserParams {
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  status?: UserStatus;
  metadata?: Record<string, unknown>;
}

export interface UpdateUserParams {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  locale?: string;
  timezone?: string;
  status?: UserStatus;
  emailVerified?: boolean;
  lastLoginAt?: string;
  lastLoginIp?: string;
  metadata?: Record<string, unknown>;
}

export async function createUser(params: CreateUserParams): Promise<UserRecord> {
  const id = uuidv4();
  const { email, displayName, firstName, lastName, avatarUrl, status = 'pending', metadata = {} } = params;

  const result = await query<UserRecord>(
    `
    INSERT INTO users (id, email, display_name, first_name, last_name, avatar_url, status, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [id, email.toLowerCase(), displayName || null, firstName || null, lastName || null, avatarUrl || null, status, metadata]
  );

  return result.rows[0];
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const result = await query<UserRecord>(
    'SELECT * FROM users WHERE id = $1 AND status != $2',
    [id, 'deleted']
  );
  return result.rows[0] || null;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const result = await query<UserRecord>(
    'SELECT * FROM users WHERE email = $1 AND status != $2',
    [email.toLowerCase(), 'deleted']
  );
  return result.rows[0] || null;
}

export async function findUserByExternalId(externalId: string): Promise<UserRecord | null> {
  const result = await query<UserRecord>(
    'SELECT * FROM users WHERE external_id = $1 AND status != $2',
    [externalId, 'deleted']
  );
  return result.rows[0] || null;
}

export async function updateUser(id: string, params: UpdateUserParams): Promise<UserRecord | null> {
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (params.displayName !== undefined) {
    setClauses.push(`display_name = $${paramIndex++}`);
    values.push(params.displayName);
  }

  if (params.firstName !== undefined) {
    setClauses.push(`first_name = $${paramIndex++}`);
    values.push(params.firstName);
  }

  if (params.lastName !== undefined) {
    setClauses.push(`last_name = $${paramIndex++}`);
    values.push(params.lastName);
  }

  if (params.avatarUrl !== undefined) {
    setClauses.push(`avatar_url = $${paramIndex++}`);
    values.push(params.avatarUrl);
  }

  if (params.locale !== undefined) {
    setClauses.push(`locale = $${paramIndex++}`);
    values.push(params.locale);
  }

  if (params.timezone !== undefined) {
    setClauses.push(`timezone = $${paramIndex++}`);
    values.push(params.timezone);
  }

  if (params.status !== undefined) {
    setClauses.push(`status = $${paramIndex++}`);
    values.push(params.status);
  }

  if (params.emailVerified !== undefined) {
    setClauses.push(`email_verified = $${paramIndex++}`);
    values.push(params.emailVerified);
  }

  if (params.lastLoginAt !== undefined) {
    setClauses.push(`last_login_at = $${paramIndex++}`);
    values.push(params.lastLoginAt);
  }

  if (params.lastLoginIp !== undefined) {
    setClauses.push(`last_login_ip = $${paramIndex++}`);
    values.push(params.lastLoginIp);
  }

  if (params.metadata !== undefined) {
    setClauses.push(`metadata = $${paramIndex++}`);
    values.push(JSON.stringify(params.metadata));
  }

  if (setClauses.length === 0) {
    return findUserById(id);
  }

  setClauses.push('updated_at = NOW()');
  values.push(id);

  const result = await query<UserRecord>(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND status != 'deleted' RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

export async function listUsers(params: {
  page?: number;
  pageSize?: number;
  status?: UserStatus;
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

export async function deleteUser(id: string): Promise<void> {
  await query(
    "UPDATE users SET status = 'deleted', updated_at = NOW() WHERE id = $1",
    [id]
  );
}
