-- Migration 002: Auth Phase 2 - Web3/Passkey/MFA
-- Adds tables for Web3 wallets, Passkeys (WebAuthn), and MFA (TOTP)

-- ============================================================================
-- Web3 Wallets
-- ============================================================================

CREATE TABLE IF NOT EXISTS web3_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address VARCHAR(42) NOT NULL,  -- 0x... EVM address
  chain VARCHAR(20) NOT NULL DEFAULT 'ethereum',
  chain_id INT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  nonce VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_web3_address_chain UNIQUE (address, chain)
);

CREATE INDEX IF NOT EXISTS idx_web3_wallets_user ON web3_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_web3_wallets_address ON web3_wallets(address, chain);

-- ============================================================================
-- Passkeys (WebAuthn/FIDO2 credentials)
-- ============================================================================

CREATE TABLE IF NOT EXISTS passkeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id BYTEA NOT NULL UNIQUE,
  public_key BYTEA NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type VARCHAR(50),  -- 'platform' or 'cross-platform'
  backup_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  backed_up BOOLEAN NOT NULL DEFAULT FALSE,
  transports VARCHAR(50)[] DEFAULT '{}',  -- usb, nfc, ble, internal, hybrid
  name VARCHAR(100),  -- User-friendly device name
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_passkeys_credential UNIQUE (credential_id)
);

CREATE INDEX IF NOT EXISTS idx_passkeys_user ON passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_passkeys_credential_id ON passkeys(credential_id);

-- ============================================================================
-- MFA Methods (TOTP + Recovery Codes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mfa_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,  -- 'totp', 'webauthn', 'recovery_code'
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,

  -- TOTP specific
  totp_secret TEXT,  -- Encrypted at application level
  totp_verified BOOLEAN DEFAULT FALSE,

  -- Recovery codes (stored as bcrypt hashes)
  recovery_codes_hash TEXT[],

  name VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_mfa_type CHECK (type IN ('totp', 'webauthn', 'email_otp', 'recovery_code'))
);

CREATE INDEX IF NOT EXISTS idx_mfa_methods_user ON mfa_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_methods_type ON mfa_methods(user_id, type) WHERE is_enabled = TRUE;

-- ============================================================================
-- MFA Challenges (temporary storage for pending challenges)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mfa_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_type VARCHAR(20) NOT NULL,  -- 'totp', 'recovery_code'
  session_token VARCHAR(255) NOT NULL,  -- Temporary token linking to partial auth
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mfa_challenges_session ON mfa_challenges(session_token);
CREATE INDEX IF NOT EXISTS idx_mfa_challenges_expires ON mfa_challenges(expires_at);

-- ============================================================================
-- Web3 Nonce storage (for SIWE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS web3_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address VARCHAR(42) NOT NULL,
  nonce VARCHAR(64) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web3_nonces_address ON web3_nonces(address);
CREATE INDEX IF NOT EXISTS idx_web3_nonces_nonce ON web3_nonces(nonce);
CREATE INDEX IF NOT EXISTS idx_web3_nonces_expires ON web3_nonces(expires_at);

-- ============================================================================
-- WebAuthn challenges (for Passkey registration/authentication)
-- ============================================================================

CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge VARCHAR(255) NOT NULL,
  challenge_type VARCHAR(20) NOT NULL,  -- 'registration' or 'authentication'
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webauthn_challenges ON webauthn_challenges(challenge);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires ON webauthn_challenges(expires_at);

-- ============================================================================
-- Audit log for auth events
-- ============================================================================

CREATE TABLE IF NOT EXISTS auth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  success BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_user ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_event ON auth_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created ON auth_audit_log(created_at DESC);

-- ============================================================================
-- Add MFA columns to users table
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_chain VARCHAR(20);

-- ============================================================================
-- Cleanup trigger for expired nonces/challenges (run daily via cron/pg_cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_auth_data() RETURNS void AS $$
BEGIN
  DELETE FROM web3_nonces WHERE expires_at < NOW();
  DELETE FROM webauthn_challenges WHERE expires_at < NOW();
  DELETE FROM mfa_challenges WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
