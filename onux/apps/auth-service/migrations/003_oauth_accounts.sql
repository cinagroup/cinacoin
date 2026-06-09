-- Migration 003: OAuth Accounts and Sessions
-- Adds tables for OAuth social login (Google, GitHub, Discord)

-- ============================================================================
-- OAuth Accounts Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scope TEXT,
  raw_profile JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider, provider_user_id);

-- ============================================================================
-- Sessions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_jti VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255) NOT NULL,
  auth_method VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  access_token_expires_at TIMESTAMPTZ NOT NULL,
  refresh_token_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_jti ON sessions(token_jti);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_hash ON sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_access_expires ON sessions(access_token_expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_expires ON sessions(refresh_token_expires_at);

-- ============================================================================
-- OAuth States Table (for CSRF protection)
-- ============================================================================

CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state VARCHAR(255) NOT NULL UNIQUE,
  provider VARCHAR(50) NOT NULL,
  code_verifier VARCHAR(255),
  redirect_uri TEXT,
  return_url TEXT,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_used ON oauth_states(used_at) WHERE used_at IS NULL;

-- ============================================================================
-- Note: audit_logs table already exists as 'auth_audit_log' in migration 002
-- We use the existing table for OAuth audit events
-- ============================================================================

-- No need to create audit_logs - using auth_audit_log from 002_auth_phase2.sql

-- ============================================================================
-- Add oauth_providers column to users table
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_providers JSONB DEFAULT '[]'::jsonb;

-- ============================================================================
-- Cleanup function for expired OAuth states
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states() RETURNS void AS $$
BEGIN
  DELETE FROM oauth_states WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;
