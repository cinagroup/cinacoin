-- Migration 005: Token Rotation Security
-- Adds tables for refresh token rotation with reuse detection

-- ============================================================================
-- Token Families - Track token lineage for reuse detection
-- ============================================================================

CREATE TABLE IF NOT EXISTS token_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_token_families_user ON token_families(user_id);
CREATE INDEX IF NOT EXISTS idx_token_families_revoked ON token_families(revoked_at) WHERE revoked_at IS NOT NULL;

-- ============================================================================
-- Sessions - Track refresh tokens with rotation support
-- ============================================================================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_family UUID NOT NULL REFERENCES token_families(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  token_type VARCHAR(20) NOT NULL DEFAULT 'refresh',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  revocation_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  
  CONSTRAINT chk_token_type CHECK (token_type IN ('refresh', 'access')),
  CONSTRAINT chk_token_hash CHECK (token_hash ~ '^[a-zA-Z0-9_-]+$')
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_family ON sessions(token_family);
CREATE INDEX IF NOT EXISTS idx_sessions_revoked ON sessions(is_revoked) WHERE is_revoked = FALSE;
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ============================================================================
-- Security Events - Log suspicious activities
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT chk_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at DESC);

-- ============================================================================
-- Cleanup function for expired sessions
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS void AS $$
BEGIN
  -- Delete sessions that expired more than 30 days ago
  DELETE FROM sessions WHERE expires_at < (NOW() - INTERVAL '30 days');
  
  -- Delete security events older than 90 days
  DELETE FROM security_events WHERE created_at < (NOW() - INTERVAL '90 days');
END;
$$ LANGUAGE plpgsql;
