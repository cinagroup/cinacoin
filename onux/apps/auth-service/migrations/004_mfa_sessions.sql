-- Migration 004: MFA Sessions for Login Flow
-- Fixes Critical Security Issue: MFA integration was broken in login route.
-- Users with MFA enabled could bypass verification and receive JWT directly.
--
-- This migration adds the mfa_sessions table to store short-lived temporary
-- tokens that bridge the gap between password authentication and MFA verification.

-- ============================================================================
-- MFA Sessions (temporary tokens for login MFA flow)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mfa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA-256 hash of the mfaToken (never store plaintext)
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_mfa_sessions_token_hash ON mfa_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_mfa_sessions_user ON mfa_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_sessions_expires ON mfa_sessions(expires_at);

-- Partial index for active (unused, unexpired) sessions
CREATE INDEX IF NOT EXISTS idx_mfa_sessions_active
  ON mfa_sessions(token_hash)
  WHERE used = FALSE AND expires_at > NOW();

-- Cleanup function for expired sessions (call via pg_cron or application scheduler)
CREATE OR REPLACE FUNCTION cleanup_expired_mfa_sessions() RETURNS void AS $$
BEGIN
  DELETE FROM mfa_sessions WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Extend the existing cleanup function to include mfa_sessions
CREATE OR REPLACE FUNCTION cleanup_expired_auth_data() RETURNS void AS $$
BEGIN
  DELETE FROM web3_nonces WHERE expires_at < NOW();
  DELETE FROM webauthn_challenges WHERE expires_at < NOW();
  DELETE FROM mfa_challenges WHERE expires_at < NOW();
  DELETE FROM mfa_sessions WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;
