-- Rollback Auth Service Migration 003 (OAuth)
-- WARNING: This will delete all OAuth data

BEGIN;

-- Drop OAuth states table
DROP TABLE IF EXISTS oauth_states CASCADE;

-- Drop sessions table
DROP TABLE IF EXISTS sessions CASCADE;

-- Drop OAuth accounts table
DROP TABLE IF EXISTS oauth_accounts CASCADE;

-- Remove oauth_providers column from users
ALTER TABLE users DROP COLUMN IF EXISTS oauth_providers;

-- Drop cleanup function
DROP FUNCTION IF EXISTS cleanup_expired_oauth_states();

COMMIT;
