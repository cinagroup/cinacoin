-- Rollback Auth Service Migration 002 (Phase 2 Features)
-- WARNING: This will delete all Web3/Passkey/MFA data

BEGIN;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS auth_audit_log CASCADE;
DROP TABLE IF EXISTS webauthn_challenges CASCADE;
DROP TABLE IF EXISTS web3_nonces CASCADE;
DROP TABLE IF EXISTS mfa_challenges CASCADE;
DROP TABLE IF EXISTS mfa_methods CASCADE;
DROP TABLE IF EXISTS passkeys CASCADE;
DROP TABLE IF EXISTS web3_wallets CASCADE;

-- Remove columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS mfa_enabled;
ALTER TABLE users DROP COLUMN IF EXISTS mfa_required;
ALTER TABLE users DROP COLUMN IF EXISTS default_chain;

-- Drop functions
DROP FUNCTION IF EXISTS cleanup_expired_auth_data();
DROP FUNCTION IF EXISTS update_updated_at_column();

COMMIT;
