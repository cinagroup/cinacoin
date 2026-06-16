-- Migration 003: Add token encryption tracking
-- This migration adds a column to track which OAuth tokens are encrypted.
-- 
-- IMPORTANT: After applying this migration, run the encryption script
-- to encrypt existing plaintext tokens:
--   cd workers/auth-service
--   npx tsx scripts/encrypt-oauth-tokens.ts
--
-- The script requires ENCRYPTION_KEY environment variable (base64-encoded AES-256 key).

ALTER TABLE oauth_accounts ADD COLUMN token_encrypted INTEGER DEFAULT 0;

-- Add index for efficient lookup of unencrypted tokens
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_unencrypted 
ON oauth_accounts(token_encrypted) 
WHERE token_encrypted = 0;
