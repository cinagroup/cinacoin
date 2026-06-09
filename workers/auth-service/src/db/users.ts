/**
 * Database queries for users
 * D1 (SQLite) compatible
 */
import type { UserRecord, UserRole, UserStatus } from '../lib/types.js';
import { uuidv4, now } from '../lib/utils.js';

/**
 * Create a new user
 */
export async function createUser(
  db: D1Database,
  params: {
    id?: string;
    email: string;
    username: string;
    passwordHash?: string | null;
    displayName?: string;
    role?: UserRole;
    authType?: 'password' | 'oauth' | 'web3' | 'passkey';
  }
): Promise<UserRecord> {
  const id = params.id || uuidv4();
  const { email, username, passwordHash, displayName, role = 'user', authType = 'password' } = params;
  const timestamp = now();

  await db
    .prepare(
      `INSERT INTO users (id, email, username, display_name, password_hash, role, status, auth_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`
    )
    .bind(id, email, username, displayName || null, passwordHash ?? null, role, authType, timestamp, timestamp)
    .run();

  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRecord>();
  if (!user) throw new Error('Failed to create user');
  return user;
}

/**
 * Find a user by ID
 */
export async function findUserById(db: D1Database, id: string): Promise<UserRecord | null> {
  return db
    .prepare('SELECT * FROM users WHERE id = ? AND status != ?')
    .bind(id, 'deleted')
    .first<UserRecord>();
}

/**
 * Find a user by email
 */
export async function findUserByEmail(db: D1Database, email: string): Promise<UserRecord | null> {
  return db
    .prepare('SELECT * FROM users WHERE email = ? AND status != ?')
    .bind(email.toLowerCase(), 'deleted')
    .first<UserRecord>();
}

/**
 * Find a user by username
 */
export async function findUserByUsername(db: D1Database, username: string): Promise<UserRecord | null> {
  return db
    .prepare('SELECT * FROM users WHERE username = ? AND status != ?')
    .bind(username, 'deleted')
    .first<UserRecord>();
}

/**
 * Update user last login timestamp
 */
export async function updateLastLogin(db: D1Database, userId: string): Promise<void> {
  await db
    .prepare('UPDATE users SET last_login_at = ? WHERE id = ?')
    .bind(now(), userId)
    .run();
}

/**
 * Update user password
 */
export async function updatePassword(db: D1Database, userId: string, newPasswordHash: string): Promise<void> {
  await db
    .prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .bind(newPasswordHash, now(), userId)
    .run();
}

/**
 * Check if email exists
 */
export async function emailExists(db: D1Database, email: string): Promise<boolean> {
  const result = await db
    .prepare('SELECT 1 FROM users WHERE email = ? AND status != ? LIMIT 1')
    .bind(email.toLowerCase(), 'deleted')
    .first();
  return result !== null;
}

/**
 * Check if username exists
 */
export async function usernameExists(db: D1Database, username: string): Promise<boolean> {
  const result = await db
    .prepare('SELECT 1 FROM users WHERE username = ? AND status != ? LIMIT 1')
    .bind(username, 'deleted')
    .first();
  return result !== null;
}
