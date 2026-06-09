-- ============================================================================
-- Cinacoin Unified Authentication System - Database Schema
-- Version: 1.0.0
-- Date: 2026-06-08
-- Database: PostgreSQL 16+
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";  -- Case-insensitive text

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_status AS ENUM (
    'pending',       -- Registered but email not verified
    'active',        -- Active user
    'suspended',     -- Temporarily suspended
    'disabled',      -- Permanently disabled
    'deleted'        -- Soft-deleted (30-day grace period)
);

CREATE TYPE auth_method AS ENUM (
    'password',      -- Email + password
    'oauth',         -- OAuth social login
    'web3',          -- SIWE (Sign-In with Ethereum)
    'passkey',       -- WebAuthn/FIDO2
    'magic_link',    -- Passwordless email link
    'api_key'        -- API key authentication
);

CREATE TYPE mfa_type AS ENUM (
    'totp',          -- Time-based OTP (Google Authenticator)
    'webauthn',      -- FIDO2/WebAuthn
    'email_otp',     -- Email-based OTP
    'sms_otp',       -- SMS-based OTP
    'recovery_code'  -- One-time recovery code
);

CREATE TYPE oauth_provider AS ENUM (
    'google',
    'github',
    'discord',
    'apple',
    'microsoft',
    'custom'
);

CREATE TYPE token_type AS ENUM (
    'access',
    'refresh',
    'id',
    'authorization_code',
    'password_reset',
    'email_verification',
    'magic_link',
    'api_key'
);

CREATE TYPE global_role AS ENUM (
    'super_admin',
    'admin',
    'user',
    'guest'
);

CREATE TYPE org_member_role AS ENUM (
    'owner',
    'admin',
    'member',
    'viewer'
);

CREATE TYPE audit_action AS ENUM (
    'user.register',
    'user.login',
    'user.login_failed',
    'user.logout',
    'user.password_change',
    'user.password_reset_request',
    'user.password_reset_complete',
    'user.email_change',
    'user.email_verified',
    'user.profile_update',
    'user.account_delete_request',
    'user.account_delete_complete',
    'user.account_restore',
    'mfa.enable',
    'mfa.disable',
    'mfa.challenge',
    'mfa.verify_success',
    'mfa.verify_failed',
    'mfa.recovery_used',
    'oauth.consent_grant',
    'oauth.consent_revoke',
    'oauth.token_issued',
    'oauth.token_revoked',
    'session.create',
    'session.destroy',
    'session.destroy_all',
    'api_key.create',
    'api_key.revoke',
    'org.create',
    'org.update',
    'org.delete',
    'org.member_add',
    'org.member_remove',
    'org.member_role_change',
    'team.create',
    'team.update',
    'team.delete',
    'team.member_add',
    'team.member_remove',
    'permission.grant',
    'permission.revoke',
    'admin.user_suspend',
    'admin.user_unsuspend',
    'admin.user_impersonate',
    'system.config_change'
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id     VARCHAR(32) UNIQUE NOT NULL DEFAULT 'usr_' || encode(gen_random_bytes(16), 'hex'),
    
    -- Authentication
    email           CITEXT UNIQUE NOT NULL,
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash   TEXT,  -- NULL for OAuth-only users
    password_salt   TEXT,
    
    -- Profile
    display_name    VARCHAR(100),
    first_name      VARCHAR(50),
    last_name       VARCHAR(50),
    avatar_url      TEXT,
    locale          VARCHAR(10) DEFAULT 'en',
    timezone        VARCHAR(50) DEFAULT 'UTC',
    
    -- Status
    status          user_status NOT NULL DEFAULT 'pending',
    global_role     global_role NOT NULL DEFAULT 'user',
    
    -- MFA
    mfa_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_required    BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_methods     mfa_type[] DEFAULT '{}',
    
    -- Web3
    default_chain   VARCHAR(20),  -- Preferred chain for SIWE
    
    -- Security
    failed_login_attempts   INT NOT NULL DEFAULT 0,
    locked_until            TIMESTAMPTZ,
    last_login_at           TIMESTAMPTZ,
    last_login_ip           INET,
    last_login_user_agent   TEXT,
    last_password_change    TIMESTAMPTZ,
    
    -- Deletion
    delete_requested_at     TIMESTAMPTZ,
    deleted_at              TIMESTAMPTZ,
    
    -- Metadata
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_users_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_users_display_name CHECK (char_length(display_name) BETWEEN 1 AND 100)
);

-- Indexes for users
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_external_id ON users (external_id);
CREATE INDEX idx_users_status ON users (status) WHERE status != 'deleted';
CREATE INDEX idx_users_created_at ON users (created_at);
CREATE INDEX idx_users_last_login ON users (last_login_at);
CREATE INDEX idx_users_global_role ON users (global_role);

-- Password history (prevent reuse)
CREATE TABLE password_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash   TEXT NOT NULL,
    password_salt   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_password_history UNIQUE (user_id, created_at)
);

CREATE INDEX idx_password_history_user ON password_history (user_id);

-- OAuth accounts (linked social providers)
CREATE TABLE oauth_accounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider        oauth_provider NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email  CITEXT,
    access_token    TEXT,  -- Encrypted
    refresh_token   TEXT,  -- Encrypted
    token_expires_at TIMESTAMPTZ,
    scope           TEXT,
    raw_profile     JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id)
);

CREATE INDEX idx_oauth_accounts_user ON oauth_accounts (user_id);
CREATE INDEX idx_oauth_accounts_provider ON oauth_accounts (provider, provider_user_id);

-- Web3 wallets (linked blockchain addresses)
CREATE TABLE web3_wallets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address         VARCHAR(42) NOT NULL,  -- 0x... for EVM
    chain           VARCHAR(20) NOT NULL DEFAULT 'ethereum',  -- ethereum, solana, bitcoin, etc.
    chain_id        INT,  -- EVM chain ID
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    last_used_at    TIMESTAMPTZ,
    nonce           VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_web3_address_chain UNIQUE (address, chain)
);

CREATE INDEX idx_web3_wallets_user ON web3_wallets (user_id);
CREATE INDEX idx_web3_wallets_address ON web3_wallets (address, chain);

-- Passkeys (WebAuthn credentials)
CREATE TABLE passkeys (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id   BYTEA NOT NULL UNIQUE,
    public_key      BYTEA NOT NULL,
    counter         BIGINT NOT NULL DEFAULT 0,
    device_type     VARCHAR(50),  -- platform, cross-platform
    backup_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    backed_up       BOOLEAN NOT NULL DEFAULT FALSE,
    transports      VARCHAR(50)[] DEFAULT '{}',  -- usb, nfc, ble, internal
    name            VARCHAR(100),  -- User-friendly name
    last_used_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_passkeys_credential UNIQUE (credential_id)
);

CREATE INDEX idx_passkeys_user ON passkeys (user_id);

-- MFA methods
CREATE TABLE mfa_methods (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            mfa_type NOT NULL,
    is_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- TOTP specific
    totp_secret     TEXT,  -- Encrypted
    totp_verified   BOOLEAN DEFAULT FALSE,
    
    -- Email/SMS specific
    contact_info    VARCHAR(255),  -- Email or phone (encrypted)
    
    -- Recovery codes (stored as hash)
    recovery_codes_hash TEXT[],  -- Array of hashed recovery codes
    
    name            VARCHAR(100),  -- User-friendly name
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_mfa_type_config CHECK (
        (type = 'totp' AND totp_secret IS NOT NULL) OR
        (type IN ('email_otp', 'sms_otp') AND contact_info IS NOT NULL) OR
        (type = 'webauthn') OR
        (type = 'recovery_code')
    )
);

CREATE INDEX idx_mfa_methods_user ON mfa_methods (user_id);
CREATE INDEX idx_mfa_methods_type ON mfa_methods (user_id, type) WHERE is_enabled = TRUE;

-- ============================================================================
-- SESSION & TOKEN MANAGEMENT
-- ============================================================================

-- Active sessions
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session info
    token_jti       VARCHAR(128) UNIQUE NOT NULL,  -- JWT ID for access token
    refresh_token_hash VARCHAR(128) UNIQUE NOT NULL,  -- Hash of refresh token
    auth_method     auth_method NOT NULL,
    
    -- Device info
    ip_address      INET NOT NULL,
    user_agent      TEXT,
    device_name     VARCHAR(100),
    device_type     VARCHAR(20),  -- desktop, mobile, tablet
    os_name         VARCHAR(50),
    browser_name    VARCHAR(50),
    country_code    VARCHAR(2),
    
    -- Token lifecycle
    access_token_expires_at  TIMESTAMPTZ NOT NULL,
    refresh_token_expires_at TIMESTAMPTZ NOT NULL,
    
    -- Activity
    last_active_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_ip  INET,
    
    -- Status
    is_revoked      BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at      TIMESTAMPTZ,
    revoke_reason   VARCHAR(100),
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_sessions_not_expired CHECK (refresh_token_expires_at > created_at)
);

CREATE INDEX idx_sessions_user ON sessions (user_id) WHERE is_revoked = FALSE;
CREATE INDEX idx_sessions_token ON sessions (token_jti);
CREATE INDEX idx_sessions_refresh ON sessions (refresh_token_hash);
CREATE INDEX idx_sessions_expires ON sessions (refresh_token_expires_at) WHERE is_revoked = FALSE;
CREATE INDEX idx_sessions_user_active ON sessions (user_id, last_active_at DESC) WHERE is_revoked = FALSE;

-- Token blacklist (revoked tokens before expiry)
CREATE TABLE token_blacklist (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jti             VARCHAR(128) UNIQUE NOT NULL,  -- JWT ID
    token_type      token_type NOT NULL,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at      TIMESTAMPTZ NOT NULL,  -- When token would have expired naturally
    revoked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    reason          VARCHAR(200),
    
    CONSTRAINT chk_blacklist_future CHECK (expires_at > revoked_at)
);

CREATE INDEX idx_blacklist_jti ON token_blacklist (jti);
CREATE INDEX idx_blacklist_expires ON token_blacklist (expires_at);

-- Verification tokens (email verification, password reset, magic links)
CREATE TABLE verification_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            token_type NOT NULL,
    token_hash      VARCHAR(128) UNIQUE NOT NULL,  -- Hash of the token sent to user
    
    -- Context
    metadata        JSONB DEFAULT '{}',  -- Additional context (redirect_uri, etc.)
    
    -- Lifecycle
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    used_ip         INET,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_vtoken_type CHECK (type IN ('email_verification', 'password_reset', 'magic_link', 'authorization_code'))
);

CREATE INDEX idx_vtoken_hash ON verification_tokens (token_hash);
CREATE INDEX idx_vtoken_user_type ON verification_tokens (user_id, type) WHERE used_at IS NULL;
CREATE INDEX idx_vtoken_expires ON verification_tokens (expires_at);

-- ============================================================================
-- OAUTH 2.0 / OIDC PROVIDER TABLES
-- ============================================================================

-- OAuth clients (registered applications)
CREATE TABLE oauth_clients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id       VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    client_secret_hash VARCHAR(128),  -- NULL for public clients
    
    -- App info
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    icon_url        TEXT,
    website_url     TEXT,
    
    -- Configuration
    owner_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    is_first_party  BOOLEAN NOT NULL DEFAULT FALSE,  -- Cinacoin's own apps
    is_confidential BOOLEAN NOT NULL DEFAULT TRUE,    -- Can keep secrets
    
    -- OAuth settings
    redirect_uris   TEXT[] NOT NULL DEFAULT '{}',
    allowed_scopes  TEXT[] NOT NULL DEFAULT '{openid,profile,email}',
    default_scopes  TEXT[] NOT NULL DEFAULT '{openid,profile,email}',
    grant_types     VARCHAR(50)[] NOT NULL DEFAULT '{authorization_code,refresh_token}',
    response_types  VARCHAR(50)[] NOT NULL DEFAULT '{code}',
    token_endpoint_auth_method VARCHAR(50) DEFAULT 'client_secret_post',
    
    -- Token settings
    access_token_ttl    INT NOT NULL DEFAULT 900,      -- 15 min
    refresh_token_ttl   INT NOT NULL DEFAULT 2592000,  -- 30 days
    id_token_ttl        INT NOT NULL DEFAULT 900,      -- 15 min
    auth_code_ttl       INT NOT NULL DEFAULT 600,      -- 10 min
    
    -- PKCE
    pkce_required   BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Status
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_oauth_clients_client_id ON oauth_clients (client_id);
CREATE INDEX idx_oauth_clients_owner ON oauth_clients (owner_id);

-- OAuth consents (user granted access to client)
CREATE TABLE oauth_consents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id       UUID NOT NULL REFERENCES oauth_clients(id) ON DELETE CASCADE,
    
    granted_scopes  TEXT[] NOT NULL,
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,  -- NULL = never expires
    revoked_at      TIMESTAMPTZ,
    
    CONSTRAINT uq_oauth_consent UNIQUE (user_id, client_id)
);

CREATE INDEX idx_oauth_consents_user ON oauth_consents (user_id);
CREATE INDEX idx_oauth_consents_client ON oauth_consents (client_id);

-- ============================================================================
-- ORGANIZATIONS & TEAMS
-- ============================================================================

-- Organizations
CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id     VARCHAR(32) UNIQUE NOT NULL DEFAULT 'org_' || encode(gen_random_bytes(16), 'hex'),
    
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(50) UNIQUE NOT NULL,
    description     TEXT,
    avatar_url      TEXT,
    
    -- Settings
    owner_id        UUID NOT NULL REFERENCES users(id),
    is_personal     BOOLEAN NOT NULL DEFAULT FALSE,  -- Personal org (one per user)
    
    -- Security settings
    mfa_required    BOOLEAN NOT NULL DEFAULT FALSE,
    sso_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    sso_config      JSONB DEFAULT '{}',
    ip_allowlist    INET[] DEFAULT '{}',
    
    -- Billing
    plan            VARCHAR(20) DEFAULT 'free',  -- free, pro, enterprise
    max_members     INT DEFAULT 5,
    
    -- Status
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orgs_owner ON organizations (owner_id);
CREATE INDEX idx_orgs_slug ON organizations (slug);

-- Organization members
CREATE TABLE org_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    role            org_member_role NOT NULL DEFAULT 'member',
    
    -- Invitation
    invited_by      UUID REFERENCES users(id),
    invited_at      TIMESTAMPTZ,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Status
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_org_member UNIQUE (org_id, user_id)
);

CREATE INDEX idx_org_members_org ON org_members (org_id);
CREATE INDEX idx_org_members_user ON org_members (user_id);

-- Teams (within organizations)
CREATE TABLE teams (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(50) NOT NULL,
    description     TEXT,
    
    created_by      UUID REFERENCES users(id),
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_team_slug_org UNIQUE (org_id, slug)
);

CREATE INDEX idx_teams_org ON teams (org_id);

-- Team members
CREATE TABLE team_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    role            VARCHAR(20) NOT NULL DEFAULT 'member',  -- lead, member
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_team_member UNIQUE (team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members (team_id);
CREATE INDEX idx_team_members_user ON team_members (user_id);

-- ============================================================================
-- RBAC - PERMISSIONS
-- ============================================================================

-- Permission definitions
CREATE TABLE permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    resource        VARCHAR(50) NOT NULL,  -- user, org, project, system
    action          VARCHAR(50) NOT NULL,  -- read, write, delete, manage
    qualifier       VARCHAR(50),           -- own, shared, all (NULL = all)
    description     TEXT,
    
    -- Composite key
    permission_key  VARCHAR(150) GENERATED ALWAYS AS (
        resource || ':' || action || COALESCE(':' || qualifier, '')
    ) STORED UNIQUE,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_permission UNIQUE (resource, action, qualifier)
);

-- Role definitions
CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name            VARCHAR(50) NOT NULL,
    slug            VARCHAR(50) NOT NULL,
    description     TEXT,
    
    -- Scope
    scope           VARCHAR(20) NOT NULL DEFAULT 'global',  -- global, org, app
    app_id          VARCHAR(50),  -- Which app (NULL for global/org roles)
    org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,  -- NULL for global roles
    
    -- Inheritance
    inherits_from   UUID REFERENCES roles(id) ON DELETE SET NULL,
    
    -- System role flag
    is_system       BOOLEAN NOT NULL DEFAULT FALSE,  -- Cannot be deleted
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_role_slug_scope UNIQUE (slug, scope, COALESCE(app_id, ''), COALESCE(org_id, '00000000-0000-0000-0000-000000000000'::UUID))
);

-- Role-Permission mapping
CREATE TABLE role_permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    
    -- Deny flag (explicit deny overrides allow)
    is_deny         BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions (role_id);
CREATE INDEX idx_role_permissions_perm ON role_permissions (permission_id);

-- User-Role assignment (for org/app-specific roles)
CREATE TABLE user_roles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    
    -- Scope context
    org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
    team_id         UUID REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Temporal
    granted_by      UUID REFERENCES users(id),
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,  -- NULL = permanent
    
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    
    CONSTRAINT chk_user_roles_scope CHECK (
        (role_id IN (SELECT id FROM roles WHERE scope = 'global')) OR
        (org_id IS NOT NULL)
    )
);

CREATE INDEX idx_user_roles_user ON user_roles (user_id);
CREATE INDEX idx_user_roles_role ON user_roles (role_id);
CREATE INDEX idx_user_roles_org ON user_roles (org_id);
CREATE INDEX idx_user_roles_expires ON user_roles (expires_at) WHERE expires_at IS NOT NULL;

-- Direct user permissions (overrides/exceptions)
CREATE TABLE user_permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    
    is_deny         BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Scope context
    org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
    resource_id     VARCHAR(100),  -- Specific resource this applies to
    
    granted_by      UUID REFERENCES users(id),
    expires_at      TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_user_perm UNIQUE (user_id, permission_id, COALESCE(org_id, '00000000-0000-0000-0000-000000000000'::UUID), COALESCE(resource_id, ''))
);

CREATE INDEX idx_user_permissions_user ON user_permissions (user_id);

-- ============================================================================
-- API KEYS
-- ============================================================================

CREATE TABLE api_keys (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Key info
    key_prefix      VARCHAR(16) NOT NULL,  -- First 8 chars for identification (e.g., "ck_live_abc")
    key_hash        VARCHAR(128) UNIQUE NOT NULL,  -- Full hash of the API key
    
    -- Ownership
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Configuration
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    scopes          TEXT[] NOT NULL DEFAULT '{}',
    permissions     TEXT[] NOT NULL DEFAULT '{}',
    
    -- Restrictions
    ip_allowlist    INET[] DEFAULT '{}',
    rate_limit      INT,  -- Requests per minute (NULL = default)
    allowed_origins TEXT[] DEFAULT '{}',
    
    -- Lifecycle
    expires_at      TIMESTAMPTZ,
    last_used_at    TIMESTAMPTZ,
    last_used_ip    INET,
    is_revoked      BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at      TIMESTAMPTZ,
    revoked_by      UUID REFERENCES users(id),
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys (user_id);
CREATE INDEX idx_api_keys_org ON api_keys (org_id);
CREATE INDEX idx_api_keys_hash ON api_keys (key_hash);
CREATE INDEX idx_api_keys_prefix ON api_keys (key_prefix);

-- ============================================================================
-- PROJECTS (for Cloud Dashboard integration)
-- ============================================================================

CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id     VARCHAR(32) UNIQUE NOT NULL DEFAULT 'prj_' || encode(gen_random_bytes(16), 'hex'),
    
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(50) NOT NULL,
    description     TEXT,
    
    -- Settings
    settings        JSONB DEFAULT '{}',
    
    -- Status
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_project_slug_org UNIQUE (org_id, slug)
);

CREATE INDEX idx_projects_org ON projects (org_id);

-- Project members (explicit access, inherits from org membership)
CREATE TABLE project_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    role            VARCHAR(20) NOT NULL DEFAULT 'viewer',  -- admin, developer, viewer
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
);

CREATE INDEX idx_project_members_project ON project_members (project_id);
CREATE INDEX idx_project_members_user ON project_members (user_id);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Event
    action          audit_action NOT NULL,
    category        VARCHAR(50) GENERATED ALWAYS AS (
        SPLIT_PART(action::TEXT, '.', 1)
    ) STORED,
    
    -- Actor
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    org_id          UUID REFERENCES organizations(id) ON DELETE SET NULL,
    
    -- Context
    ip_address      INET,
    user_agent      TEXT,
    country_code    VARCHAR(2),
    session_id      UUID,
    request_id      VARCHAR(64),
    
    -- Target (what was affected)
    target_user_id  UUID,
    target_org_id   UUID,
    target_resource VARCHAR(100),
    target_id       VARCHAR(100),
    
    -- Details
    metadata        JSONB DEFAULT '{}',
    success         BOOLEAN NOT NULL DEFAULT TRUE,
    error_message   TEXT,
    
    -- Timestamp
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partition by month for performance
CREATE INDEX idx_audit_logs_user ON audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_logs_org ON audit_logs (org_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs (action, created_at DESC);
CREATE INDEX idx_audit_logs_created ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_ip ON audit_logs (ip_address, created_at DESC);
CREATE INDEX idx_audit_logs_target_user ON audit_logs (target_user_id, created_at DESC);

-- ============================================================================
-- INVITATIONS
-- ============================================================================

CREATE TABLE invitations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Invitation info
    email           CITEXT NOT NULL,
    token_hash      VARCHAR(128) UNIQUE NOT NULL,
    
    -- Context
    org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
    team_id         UUID REFERENCES teams(id) ON DELETE CASCADE,
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Role to assign on acceptance
    role            org_member_role NOT NULL DEFAULT 'member',
    
    -- Inviter
    invited_by      UUID NOT NULL REFERENCES users(id),
    
    -- Message
    message         TEXT,
    
    -- Lifecycle
    expires_at      TIMESTAMPTZ NOT NULL,
    accepted_at     TIMESTAMPTZ,
    accepted_by     UUID REFERENCES users(id),
    revoked_at      TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_email ON invitations (email) WHERE accepted_at IS NULL AND revoked_at IS NULL;
CREATE INDEX idx_invitations_token ON invitations (token_hash);
CREATE INDEX idx_invitations_org ON invitations (org_id);

-- ============================================================================
-- NOTIFICATION PREFERENCES
-- ============================================================================

CREATE TABLE notification_preferences (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Email notifications
    email_login_alerts      BOOLEAN NOT NULL DEFAULT TRUE,
    email_security_alerts   BOOLEAN NOT NULL DEFAULT TRUE,
    email_product_updates   BOOLEAN NOT NULL DEFAULT FALSE,
    email_marketing         BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Push notifications
    push_enabled            BOOLEAN NOT NULL DEFAULT FALSE,
    push_security_alerts    BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Default permissions
INSERT INTO permissions (resource, action, qualifier, description) VALUES
    -- User permissions
    ('user', 'read', NULL, 'Read any user profile'),
    ('user', 'read', 'own', 'Read own profile'),
    ('user', 'write', NULL, 'Write any user profile'),
    ('user', 'write', 'own', 'Write own profile'),
    ('user', 'delete', NULL, 'Delete any user'),
    ('user', 'impersonate', NULL, 'Impersonate any user'),
    
    -- Organization permissions
    ('org', 'read', NULL, 'Read organization'),
    ('org', 'write', NULL, 'Write organization settings'),
    ('org', 'delete', NULL, 'Delete organization'),
    ('org', 'member', 'read', 'Read organization members'),
    ('org', 'member', 'write', 'Add/remove organization members'),
    
    -- Project permissions
    ('project', 'read', NULL, 'Read any project'),
    ('project', 'read', 'own', 'Read own projects'),
    ('project', 'write', NULL, 'Write any project'),
    ('project', 'write', 'own', 'Write own projects'),
    ('project', 'delete', NULL, 'Delete any project'),
    ('project', 'delete', 'own', 'Delete own projects'),
    ('project', 'api_key', 'manage', 'Manage project API keys'),
    
    -- System permissions
    ('system', 'config', NULL, 'Modify system configuration'),
    ('system', 'audit_log', 'read', 'Read audit logs'),
    ('system', 'billing', 'manage', 'Manage billing'),
    
    -- App-specific
    ('analytics', 'report', 'read', 'Read analytics reports'),
    ('analytics', 'report', 'export', 'Export analytics data'),
    ('wallet', 'curate', NULL, 'Curate wallet explorer data'),
    ('status', 'update', NULL, 'Update service status');

-- Default global roles
INSERT INTO roles (name, slug, scope, is_system, inherits_from) VALUES
    ('Super Admin', 'super_admin', 'global', TRUE, NULL),
    ('Admin', 'admin', 'global', TRUE, NULL),
    ('User', 'user', 'global', TRUE, NULL),
    ('Guest', 'guest', 'global', TRUE, NULL);

-- Set up inheritance
UPDATE roles SET inherits_from = (SELECT id FROM roles WHERE slug = 'admin') WHERE slug = 'super_admin';
UPDATE roles SET inherits_from = (SELECT id FROM roles WHERE slug = 'user') WHERE slug = 'admin';
UPDATE roles SET inherits_from = (SELECT id FROM roles WHERE slug = 'guest') WHERE slug = 'user';

-- Assign permissions to roles
-- Super Admin: everything
INSERT INTO role_permissions (role_id, permission_id, is_deny)
SELECT r.id, p.id, FALSE
FROM roles r CROSS JOIN permissions p
WHERE r.slug = 'super_admin';

-- Admin: most things except system:config and user:impersonate
INSERT INTO role_permissions (role_id, permission_id, is_deny)
SELECT r.id, p.id, FALSE
FROM roles r CROSS JOIN permissions p
WHERE r.slug = 'admin'
AND p.permission_key NOT IN ('system:config', 'user:impersonate');

-- User: own resources
INSERT INTO role_permissions (role_id, permission_id, is_deny)
SELECT r.id, p.id, FALSE
FROM roles r CROSS JOIN permissions p
WHERE r.slug = 'user'
AND (p.qualifier = 'own' OR p.resource IN ('analytics') OR p.action = 'read');

-- Guest: read only
INSERT INTO role_permissions (role_id, permission_id, is_deny)
SELECT r.id, p.id, FALSE
FROM roles r CROSS JOIN permissions p
WHERE r.slug = 'guest'
AND p.action = 'read'
AND p.qualifier IS NULL;

-- Register Cinacoin's own OAuth clients
INSERT INTO oauth_clients (client_id, name, description, is_first_party, is_confidential, redirect_uris, allowed_scopes, grant_types, pkce_required) VALUES
    ('cinacoin_cloud', 'Cinacoin Cloud Dashboard', 'Main cloud management dashboard', TRUE, TRUE,
     ARRAY['https://cloud.cinacoin.com/callback', 'https://cloud.cinacoin.com/auth/callback'],
     ARRAY['openid', 'profile', 'email', 'project:read', 'project:write'],
     ARRAY['authorization_code', 'refresh_token'], TRUE),
    
    ('cinacoin_dashboard', 'Cinacoin Backend Dashboard', 'Backend administration dashboard', TRUE, TRUE,
     ARRAY['https://dash.cinacoin.com/callback', 'https://dash.cinacoin.com/auth/callback'],
     ARRAY['openid', 'profile', 'email', 'system:audit_log:read'],
     ARRAY['authorization_code', 'refresh_token'], TRUE),
    
    ('cinacoin_analytics', 'Cinacoin Analytics', 'Analytics dashboard', TRUE, TRUE,
     ARRAY['https://analytics.cinacoin.com/callback', 'https://analytics.cinacoin.com/analytics/callback'],
     ARRAY['openid', 'profile', 'email', 'analytics:report:read'],
     ARRAY['authorization_code', 'refresh_token'], TRUE),
    
    ('cinacoin_wallet', 'Wallet Explorer', 'Wallet explorer (optional auth)', TRUE, FALSE,
     ARRAY['https://wallet.cinacoin.com/callback'],
     ARRAY['openid', 'profile'],
     ARRAY['authorization_code', 'refresh_token'], TRUE),
    
    ('cinacoin_website', 'Cinacoin Website', 'Main website (optional login)', TRUE, FALSE,
     ARRAY['https://cinacoin.com/callback'],
     ARRAY['openid', 'profile', 'email'],
     ARRAY['authorization_code', 'refresh_token'], TRUE),
    
    ('cinacoin_status', 'Health Status', 'Service status page (admin only)', TRUE, TRUE,
     ARRAY['https://status.cinacoin.com/callback'],
     ARRAY['openid', 'profile', 'status:update'],
     ARRAY['authorization_code', 'refresh_token'], TRUE);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_oauth_accounts_updated_at BEFORE UPDATE ON oauth_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_web3_wallets_updated_at BEFORE UPDATE ON web3_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_mfa_methods_updated_at BEFORE UPDATE ON mfa_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_oauth_clients_updated_at BEFORE UPDATE ON oauth_clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_org_members_updated_at BEFORE UPDATE ON org_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_notification_prefs_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Cleanup expired tokens (run periodically via cron/pg_cron)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Clean expired token blacklist entries
    DELETE FROM token_blacklist WHERE expires_at < NOW() - INTERVAL '1 day';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean expired verification tokens
    DELETE FROM verification_tokens WHERE expires_at < NOW() - INTERVAL '7 day';
    deleted_count := deleted_count + (SELECT COUNT(*) FROM verification_tokens WHERE expires_at < NOW() - INTERVAL '7 day');
    
    -- Clean expired sessions
    DELETE FROM sessions WHERE refresh_token_expires_at < NOW() - INTERVAL '1 day';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Check and enforce max sessions per user
CREATE OR REPLACE FUNCTION enforce_max_sessions()
RETURNS TRIGGER AS $$
DECLARE
    session_count INTEGER;
    max_sessions INTEGER := 5;
BEGIN
    SELECT COUNT(*) INTO session_count
    FROM sessions
    WHERE user_id = NEW.user_id AND is_revoked = FALSE;
    
    IF session_count >= max_sessions THEN
        -- Revoke oldest session
        UPDATE sessions
        SET is_revoked = TRUE, revoked_at = NOW(), revoke_reason = 'max_sessions_exceeded'
        WHERE id = (
            SELECT id FROM sessions
            WHERE user_id = NEW.user_id AND is_revoked = FALSE
            ORDER BY last_active_at ASC
            LIMIT 1
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_max_sessions BEFORE INSERT ON sessions FOR EACH ROW EXECUTE FUNCTION enforce_max_sessions();

-- ============================================================================
-- VIEWS (for common queries)
-- ============================================================================

-- User with full profile
CREATE VIEW v_user_profiles AS
SELECT 
    u.id,
    u.external_id,
    u.email,
    u.email_verified,
    u.display_name,
    u.first_name,
    u.last_name,
    u.avatar_url,
    u.status,
    u.global_role,
    u.mfa_enabled,
    u.last_login_at,
    u.created_at,
    COALESCE(json_agg(
        json_build_object(
            'provider', oa.provider,
            'provider_user_id', oa.provider_user_id,
            'provider_email', oa.provider_email
        )
    ) FILTER (WHERE oa.id IS NOT NULL), '[]') AS oauth_accounts,
    COALESCE(json_agg(
        json_build_object(
            'address', w.address,
            'chain', w.chain,
            'is_primary', w.is_primary
        )
    ) FILTER (WHERE w.id IS NOT NULL), '[]') AS web3_wallets
FROM users u
LEFT JOIN oauth_accounts oa ON u.id = oa.user_id
LEFT JOIN web3_wallets w ON u.id = w.user_id
WHERE u.status != 'deleted'
GROUP BY u.id;

-- Active sessions with user info
CREATE VIEW v_active_sessions AS
SELECT 
    s.id,
    s.user_id,
    u.email,
    u.display_name,
    s.auth_method,
    s.ip_address,
    s.user_agent,
    s.device_name,
    s.country_code,
    s.last_active_at,
    s.access_token_expires_at,
    s.refresh_token_expires_at,
    s.created_at
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.is_revoked = FALSE
AND s.refresh_token_expires_at > NOW();

-- User effective permissions (computed)
CREATE VIEW v_user_permissions AS
SELECT 
    ur.user_id,
    ur.org_id,
    p.permission_key,
    COALESCE(up.is_deny, rp.is_deny, FALSE) AS is_deny,
    CASE 
        WHEN up.is_deny = TRUE THEN 'direct_deny'
        WHEN up.id IS NOT NULL THEN 'direct_allow'
        WHEN rp.is_deny = TRUE THEN 'role_deny'
        ELSE 'role_allow'
    END AS source
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
LEFT JOIN user_permissions up ON up.user_id = ur.user_id AND up.permission_id = p.id AND up.org_id = ur.org_id
WHERE ur.is_active = TRUE
AND (ur.expires_at IS NULL OR ur.expires_at > NOW());

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'Core user accounts for all Cinacoin applications';
COMMENT ON TABLE sessions IS 'Active user sessions with device tracking';
COMMENT ON TABLE oauth_clients IS 'Registered OAuth 2.0 client applications';
COMMENT ON TABLE organizations IS 'Teams/companies that group users and projects';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all authentication events';
COMMENT ON TABLE permissions IS 'Atomic permission definitions (resource:action:qualifier)';
COMMENT ON TABLE roles IS 'Named permission sets with inheritance support';
