/**
 * D1 Database Schema Types
 * Maps to the SQLite tables defined in migrations/0001_init.sql
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type AuthType = 'password' | 'oauth' | 'api_key' | 'sso';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'deleted';
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

// ─── Table Row Types ──────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  auth_type: AuthType;
  status: UserStatus;
  two_factor_enabled: boolean;
  two_factor_secret: string | null;
  two_factor_backup_codes: string | null; // JSON array
  two_factor_enforced_at: string | null;
  two_factor_grace_period_days: number;
  created_at: number; // Unix timestamp (seconds)
  updated_at: number;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: number;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: number;
}

export interface Permission {
  id: string;
  user_id: string | null;
  team_id: string | null;
  resource: string;
  action: string;
  granted_at: number;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  scopes: string; // JSON array stored as text
  expires_at: number | null;
  created_at: number;
}

// ─── Input / DTO Types ────────────────────────────────────────────────────────

export interface CreateUserInput {
  email: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  auth_type: AuthType;
}

export interface UpdateUserInput {
  username?: string;
  display_name?: string;
  avatar_url?: string;
  status?: UserStatus;
}

export interface CreateTeamInput {
  name: string;
  description?: string;
  owner_id: string;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
}

export interface AddTeamMemberInput {
  user_id: string;
  role: TeamRole;
}

export interface GrantPermissionInput {
  user_id?: string;
  team_id?: string;
  resource: string;
  action: string;
}

export interface CreateApiKeyInput {
  user_id: string;
  name: string;
  scopes: string[];
  expires_at?: number;
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface TeamWithMembers extends Team {
  members: (TeamMember & { user: User })[];
}

export interface PermissionWithUser extends Permission {
  user: User | null;
}

// ─── Env Bindings ─────────────────────────────────────────────────────────────

export type Env = {
  DB: D1Database;
  CACHE: KVNamespace;  // KV namespace for query caching
  JWT_SECRET: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  ADMIN_API_KEY: string;
  ENVIRONMENT: string;
};
