/**
 * Types for Cloudflare Workers Auth Service
 */

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  ENCRYPTION_KEY: string; // Base64-encoded AES-256 key for encrypting sensitive data
  CORS_ORIGIN: string;
  ENVIRONMENT: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
}

export type UserRole = 'user' | 'admin' | 'service';
export type UserStatus = 'active' | 'suspended' | 'deleted';
export type AuthType = 'password' | 'oauth' | 'web3' | 'passkey';

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  password_hash: string | null;
  role: UserRole;
  status: UserStatus;
  auth_type: AuthType;
  mfa_enabled: number;
  mfa_required: number;
  two_factor_secret: string | null;
  two_factor_backup_codes: string | null;
  two_factor_enforced_at: string | null;
  two_factor_grace_period_days: number;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export function toPublicUser(record: UserRecord): PublicUser {
  return {
    id: record.id,
    email: record.email,
    username: record.username,
    displayName: record.display_name,
    role: record.role,
    status: record.status,
    emailVerified: record.email_verified_at !== null,
    lastLoginAt: record.last_login_at,
    createdAt: record.created_at,
  };
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
  type: 'access' | 'refresh';
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

export type OAuthProvider = 'google' | 'github' | 'discord';

export interface OAuthAccountRecord {
  id: string;
  user_id: string;
  provider: OAuthProvider;
  provider_user_id: string;
  provider_email: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  scope: string | null;
  raw_profile: string;
  created_at: string;
  updated_at: string;
}
