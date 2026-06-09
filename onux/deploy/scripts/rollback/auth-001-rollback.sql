-- Rollback Auth Service Migration 001 (Initial Schema)
-- WARNING: This will delete ALL auth data

BEGIN;

-- Drop users table (core table)
DROP TABLE IF EXISTS users CASCADE;

COMMIT;

-- NOTE: This is a destructive operation. Only use in emergencies.
