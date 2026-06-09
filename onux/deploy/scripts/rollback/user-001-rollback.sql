-- Rollback User Service Migration 001 (Initial Schema)
-- WARNING: This will delete ALL user service data

BEGIN;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at();

-- Drop types
DROP TYPE IF EXISTS team_member_role;
DROP TYPE IF EXISTS user_status;

-- Drop extensions
DROP EXTENSION IF EXISTS "citext";
DROP EXTENSION IF EXISTS "pgcrypto";
DROP EXTENSION IF EXISTS "uuid-ossp";

COMMIT;

-- NOTE: This is a destructive operation. Only use in emergencies.
