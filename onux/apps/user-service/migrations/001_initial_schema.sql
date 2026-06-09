-- ============================================================================
-- User Service - Initial Schema
-- Database: cinacoin_users
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_status AS ENUM (
    'pending',       -- Registered but email not verified
    'active',        -- Active user
    'suspended',     -- Temporarily suspended
    'disabled',      -- Permanently disabled
    'deleted'        -- Soft-deleted
);

CREATE TYPE team_member_role AS ENUM (
    'owner',
    'admin',
    'member',
    'viewer'
);

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id     VARCHAR(32) UNIQUE NOT NULL DEFAULT 'usr_' || encode(gen_random_bytes(16), 'hex'),
    
    -- Authentication
    email           CITEXT UNIQUE NOT NULL,
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Profile
    display_name    VARCHAR(100),
    first_name      VARCHAR(50),
    last_name       VARCHAR(50),
    avatar_url      TEXT,
    locale          VARCHAR(10) DEFAULT 'en',
    timezone        VARCHAR(50) DEFAULT 'UTC',
    
    -- Status
    status          user_status NOT NULL DEFAULT 'pending',
    
    -- Security
    last_login_at   TIMESTAMPTZ,
    last_login_ip   INET,
    
    -- Metadata
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_users_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_external_id ON users (external_id);
CREATE INDEX idx_users_status ON users (status) WHERE status != 'deleted';
CREATE INDEX idx_users_created_at ON users (created_at);

-- ============================================================================
-- TEAMS TABLE
-- ============================================================================

CREATE TABLE teams (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id     VARCHAR(32) UNIQUE NOT NULL DEFAULT 'team_' || encode(gen_random_bytes(16), 'hex'),
    
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(50) NOT NULL,
    description     TEXT,
    avatar_url      TEXT,
    
    -- Ownership
    created_by      UUID REFERENCES users(id),
    
    -- Status
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Metadata
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teams_slug ON teams (slug);
CREATE INDEX idx_teams_created_by ON teams (created_by);
CREATE INDEX idx_teams_active ON teams (is_active);

-- ============================================================================
-- TEAM MEMBERS TABLE
-- ============================================================================

CREATE TABLE team_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    role            team_member_role NOT NULL DEFAULT 'member',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Invitation
    invited_by      UUID REFERENCES users(id),
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_team_member UNIQUE (team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members (team_id);
CREATE INDEX idx_team_members_user ON team_members (user_id);
CREATE INDEX idx_team_members_active ON team_members (is_active);

-- ============================================================================
-- PERMISSIONS TABLE
-- ============================================================================

CREATE TABLE permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    resource        VARCHAR(50) NOT NULL,  -- user, team, project
    action          VARCHAR(50) NOT NULL,  -- read, write, delete, manage
    qualifier       VARCHAR(50),           -- own, shared, all
    
    description     TEXT,
    permission_key  VARCHAR(150) GENERATED ALWAYS AS (
        resource || ':' || action || COALESCE(':' || qualifier, '')
    ) STORED UNIQUE,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_permission UNIQUE (resource, action, qualifier)
);

-- ============================================================================
-- USER PERMISSIONS (direct assignments)
-- ============================================================================

CREATE TABLE user_permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    
    is_deny         BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Scope context
    team_id         UUID REFERENCES teams(id) ON DELETE CASCADE,
    resource_id     VARCHAR(100),  -- Specific resource this applies to
    
    granted_by      UUID REFERENCES users(id),
    expires_at      TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_user_perm UNIQUE (user_id, permission_id, COALESCE(team_id, '00000000-0000-0000-0000-000000000000'::UUID), COALESCE(resource_id, ''))
);

CREATE INDEX idx_user_permissions_user ON user_permissions (user_id);
CREATE INDEX idx_user_permissions_team ON user_permissions (team_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Default permissions
INSERT INTO permissions (resource, action, qualifier, description) VALUES
    ('user', 'read', NULL, 'Read any user profile'),
    ('user', 'read', 'own', 'Read own profile'),
    ('user', 'write', NULL, 'Write any user profile'),
    ('user', 'write', 'own', 'Write own profile'),
    ('user', 'delete', NULL, 'Delete any user'),
    
    ('team', 'read', NULL, 'Read any team'),
    ('team', 'write', NULL, 'Write any team'),
    ('team', 'delete', NULL, 'Delete any team'),
    ('team', 'member', 'read', 'Read team members'),
    ('team', 'member', 'write', 'Add/remove team members'),
    
    ('project', 'read', NULL, 'Read any project'),
    ('project', 'write', NULL, 'Write any project'),
    ('project', 'delete', NULL, 'Delete any project');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'Core user accounts for Cinacoin applications';
COMMENT ON TABLE teams IS 'Teams that group users';
COMMENT ON TABLE team_members IS 'Team membership with roles';
COMMENT ON TABLE permissions IS 'Atomic permission definitions (resource:action:qualifier)';
COMMENT ON TABLE user_permissions IS 'Direct user permission assignments';
