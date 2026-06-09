/**
 * Shared types for the Auth Service
 */

/** User role enum */
export type UserRole = 'user' | 'admin' | 'service';

/** User status enum */
export type UserStatus = 'active' | 'suspended' | 'deleted';

/** Authentication type enum */
export type AuthType = 'password' | 'oauth' | 'web3' | 'passkey';

/** Database user record */
export interface UserRecord {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  password_hash: string | null;
  role: UserRole;
  status: UserStatus;
  auth_type: AuthType;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Public user info (safe to return in API responses) */
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

/** Convert a database record to public user info */
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

/** Standard API error response */
export interface ApiError {
  error: string;
  message: string;
  details?: string[];
}

/** Standard API success response */
export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

/** Paginated response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Auth tokens response */
export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: PublicUser;
}

/** MFA required response (returned when user has MFA enabled) */
export interface MfaRequiredResponse {
  mfaRequired: true;
  mfaToken: string;
  mfaTokenExpiresIn: number; // seconds
}

/** MFA verify-login request */
export interface MfaVerifyLoginRequest {
  mfaToken: string;
  code: string;
  method?: 'totp' | 'recovery_code';
}

// ============================================================================
// OAuth Types
// ============================================================================

/** Supported OAuth providers */
export type OAuthProvider = 'google' | 'github' | 'discord';

/** OAuth provider account record from database */
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
  raw_profile: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Public OAuth account info (safe for API responses) */
export interface PublicOAuthAccount {
  id: string;
  provider: OAuthProvider;
  providerUserId: string;
  providerEmail: string | null;
  scope: string | null;
  createdAt: string;
}

/** Convert database record to public OAuth account */
export function toPublicOAuthAccount(record: OAuthAccountRecord): PublicOAuthAccount {
  return {
    id: record.id,
    provider: record.provider,
    providerUserId: record.provider_user_id,
    providerEmail: record.provider_email,
    scope: record.scope,
    createdAt: record.created_at,
  };
}

/** OAuth state record from database */
export interface OAuthStateRecord {
  id: string;
  state: string;
  provider: OAuthProvider;
  code_verifier: string | null;
  redirect_uri: string | null;
  return_url: string | null;
  metadata: Record<string, unknown>;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

/** Normalized user profile from any OAuth provider */
export interface OAuthUserProfile {
  id: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  raw: Record<string, unknown>;
}

/** OAuth session info for audit logging */
export interface OAuthSessionInfo {
  authMethod: 'oauth';
  provider: OAuthProvider;
  isNewUser: boolean;
  isAccountLink: boolean;
}

/** Audit log record */
export interface AuditLogRecord {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  status: 'success' | 'failure';
  created_at: string;
}
