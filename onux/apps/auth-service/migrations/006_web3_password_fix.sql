-- Migration 006: Web3 Password Hash Fix
-- Fix security issue: Web3 users should have NULL password_hash, not empty string

-- ============================================================================
-- Update existing Web3 users with empty password_hash to NULL
-- ============================================================================

UPDATE users 
SET password_hash = NULL 
WHERE password_hash = '';

-- ============================================================================
-- Make password_hash nullable
-- ============================================================================

ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- ============================================================================
-- Add auth_type field to distinguish authentication methods
-- ============================================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_type VARCHAR(20) NOT NULL DEFAULT 'password';

-- Add check constraint for auth_type
ALTER TABLE users 
ADD CONSTRAINT chk_auth_type CHECK (auth_type IN ('password', 'oauth', 'web3', 'passkey'));

-- ============================================================================
-- Update existing Web3 users to have auth_type = 'web3'
-- ============================================================================

UPDATE users 
SET auth_type = 'web3' 
WHERE email LIKE '%@web3.cinacoin.local';

-- ============================================================================
-- Add index for auth_type
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_auth_type ON users(auth_type);

-- ============================================================================
-- Add comment documenting the change
-- ============================================================================

COMMENT ON COLUMN users.password_hash IS 'Password hash for password-based auth. NULL for OAuth/Web3/Passkey users.';
COMMENT ON COLUMN users.auth_type IS 'Authentication method: password, oauth, web3, or passkey';
