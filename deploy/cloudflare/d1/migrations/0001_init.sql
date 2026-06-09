-- ============================================================
-- Cloudflare D1 Schema: cinacoin-auth
-- Migrated from PostgreSQL → SQLite (D1)
-- Date: 2026-06-08
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- Users 表
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT,
  auth_type TEXT NOT NULL CHECK(auth_type IN ('password', 'oauth', 'web3', 'passkey')),
  mfa_enabled INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'deleted', 'pending')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ============================================================
-- Sessions 表
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  refresh_token_hash TEXT NOT NULL,
  token_family TEXT,
  device_info TEXT,
  ip_address TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- OAuth Accounts 表
-- ============================================================
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, provider_user_id)
);

-- ============================================================
-- Authenticators (Passkey / WebAuthn) 表
-- ============================================================
CREATE TABLE IF NOT EXISTS authenticators (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  credential_id TEXT UNIQUE NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL,
  device_type TEXT,
  backed_up INTEGER DEFAULT 0,
  transports TEXT,  -- JSON array stored as text, e.g. '["internal","hybrid"]'
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- MFA Secrets 表
-- ============================================================
CREATE TABLE IF NOT EXISTS mfa_secrets (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  secret_encrypted TEXT NOT NULL,
  enabled INTEGER DEFAULT 0,
  recovery_codes TEXT,  -- JSON array of hashed recovery codes
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- MFA Sessions 表（临时 MFA 验证）
-- ============================================================
CREATE TABLE IF NOT EXISTS mfa_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- Teams 表
-- ============================================================
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- ============================================================
-- Team Members 表
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
  team_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- Permissions 表
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  team_id TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  granted_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- ============================================================
-- API Keys 表
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  scopes TEXT NOT NULL,  -- JSON array stored as text, e.g. '["read","write"]'
  last_used_at INTEGER,
  expires_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- Audit Logs 表
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata TEXT,  -- JSON object stored as text
  created_at INTEGER NOT NULL
);

-- ============================================================
-- Token Blacklist 表（用于令牌撤销）
-- ============================================================
CREATE TABLE IF NOT EXISTS token_blacklist (
  token_hash TEXT PRIMARY KEY,
  token_type TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  blacklisted_at INTEGER NOT NULL
);

-- ============================================================
-- 索引
-- ============================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_token_family ON sessions(token_family);

-- OAuth Accounts
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider, provider_user_id);

-- Authenticators
CREATE INDEX IF NOT EXISTS idx_authenticators_user_id ON authenticators(user_id);
CREATE INDEX IF NOT EXISTS idx_authenticators_credential_id ON authenticators(credential_id);

-- MFA Secrets
CREATE INDEX IF NOT EXISTS idx_mfa_secrets_user_id ON mfa_secrets(user_id);

-- MFA Sessions
CREATE INDEX IF NOT EXISTS idx_mfa_sessions_token_hash ON mfa_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_mfa_sessions_expires_at ON mfa_sessions(expires_at);

-- Teams
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);

-- Team Members
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Permissions
CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_team_id ON permissions(team_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource, action);

-- API Keys
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Token Blacklist
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at);
