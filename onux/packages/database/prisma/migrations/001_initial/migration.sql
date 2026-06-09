-- ============================================================================
-- Cinacoin Unified Database - Initial Migration
-- Version: 001_initial
-- Date: 2026-06-08
-- Database: PostgreSQL 16+
-- ============================================================================

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pending', 'active', 'suspended', 'disabled', 'deleted');
CREATE TYPE "AuthMethod" AS ENUM ('password', 'oauth', 'web3', 'passkey', 'magic_link', 'api_key');
CREATE TYPE "MfaType" AS ENUM ('totp', 'webauthn', 'email_otp', 'sms_otp', 'recovery_code');
CREATE TYPE "OAuthProvider" AS ENUM ('google', 'github', 'discord', 'apple', 'microsoft', 'custom');
CREATE TYPE "TokenType" AS ENUM ('access', 'refresh', 'id', 'authorization_code', 'password_reset', 'email_verification', 'magic_link', 'api_key');
CREATE TYPE "GlobalRole" AS ENUM ('super_admin', 'admin', 'user', 'guest');
CREATE TYPE "OrgMemberRole" AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE "AuditAction" AS ENUM (
    'user_register', 'user_login', 'user_login_failed', 'user_logout',
    'user_password_change', 'user_password_reset_request', 'user_password_reset_complete',
    'user_email_change', 'user_email_verified', 'user_profile_update',
    'user_account_delete_request', 'user_account_delete_complete', 'user_account_restore',
    'mfa_enable', 'mfa_disable', 'mfa_challenge', 'mfa_verify_success', 'mfa_verify_failed', 'mfa_recovery_used',
    'oauth_consent_grant', 'oauth_consent_revoke', 'oauth_token_issued', 'oauth_token_revoked',
    'session_create', 'session_destroy', 'session_destroy_all',
    'api_key_create', 'api_key_revoke',
    'org_create', 'org_update', 'org_delete', 'org_member_add', 'org_member_remove', 'org_member_role_change',
    'team_create', 'team_update', 'team_delete', 'team_member_add', 'team_member_remove',
    'permission_grant', 'permission_revoke',
    'admin_user_suspend', 'admin_user_unsuspend', 'admin_user_impersonate',
    'system_config_change'
);

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateTable: users
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "external_id" VARCHAR(32) NOT NULL DEFAULT 'usr_' || encode(gen_random_bytes(16), 'hex'),
    "email" CITEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "password_hash" TEXT,
    "password_salt" TEXT,
    "display_name" VARCHAR(100),
    "first_name" VARCHAR(50),
    "last_name" VARCHAR(50),
    "avatar_url" TEXT,
    "locale" VARCHAR(10) NOT NULL DEFAULT 'en',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "status" "UserStatus" NOT NULL DEFAULT 'pending',
    "global_role" "GlobalRole" NOT NULL DEFAULT 'user',
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "mfa_required" BOOLEAN NOT NULL DEFAULT false,
    "mfa_methods" "MfaType"[] DEFAULT ARRAY[]::"MfaType"[],
    "default_chain" VARCHAR(20),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ,
    "last_login_at" TIMESTAMPTZ,
    "last_login_ip" INET,
    "last_login_user_agent" TEXT,
    "last_password_change" TIMESTAMPTZ,
    "delete_requested_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: password_history
CREATE TABLE "password_history" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "password_hash" TEXT NOT NULL,
    "password_salt" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable: oauth_accounts
CREATE TABLE "oauth_accounts" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "provider" "OAuthProvider" NOT NULL,
    "provider_user_id" VARCHAR(255) NOT NULL,
    "provider_email" CITEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMPTZ,
    "scope" TEXT,
    "raw_profile" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: web3_wallets
CREATE TABLE "web3_wallets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "address" VARCHAR(42) NOT NULL,
    "chain" VARCHAR(20) NOT NULL DEFAULT 'ethereum',
    "chain_id" INTEGER,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "last_used_at" TIMESTAMPTZ,
    "nonce" VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "web3_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: passkeys
CREATE TABLE "passkeys" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "credential_id" BYTEA NOT NULL,
    "public_key" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "device_type" VARCHAR(50),
    "backup_eligible" BOOLEAN NOT NULL DEFAULT false,
    "backed_up" BOOLEAN NOT NULL DEFAULT false,
    "transports" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "name" VARCHAR(100),
    "last_used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passkeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable: mfa_methods
CREATE TABLE "mfa_methods" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "type" "MfaType" NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "totp_secret" TEXT,
    "totp_verified" BOOLEAN,
    "contact_info" VARCHAR(255),
    "recovery_codes_hash" TEXT[],
    "name" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfa_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable: sessions
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "token_jti" VARCHAR(128) NOT NULL,
    "refresh_token_hash" VARCHAR(128) NOT NULL,
    "auth_method" "AuthMethod" NOT NULL,
    "ip_address" INET NOT NULL,
    "user_agent" TEXT,
    "device_name" VARCHAR(100),
    "device_type" VARCHAR(20),
    "os_name" VARCHAR(50),
    "browser_name" VARCHAR(50),
    "country_code" VARCHAR(2),
    "access_token_expires_at" TIMESTAMPTZ NOT NULL,
    "refresh_token_expires_at" TIMESTAMPTZ NOT NULL,
    "last_active_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_active_ip" INET,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMPTZ,
    "revoke_reason" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: token_blacklist
CREATE TABLE "token_blacklist" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "jti" VARCHAR(128) NOT NULL,
    "token_type" "TokenType" NOT NULL,
    "user_id" UUID,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_by" UUID,
    "reason" VARCHAR(200),

    CONSTRAINT "token_blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable: verification_tokens
CREATE TABLE "verification_tokens" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "type" "TokenType" NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "used_ip" INET,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable: oauth_clients
CREATE TABLE "oauth_clients" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "client_id" VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    "client_secret_hash" VARCHAR(128),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "website_url" TEXT,
    "owner_id" UUID,
    "is_first_party" BOOLEAN NOT NULL DEFAULT false,
    "is_confidential" BOOLEAN NOT NULL DEFAULT true,
    "redirect_uris" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowed_scopes" TEXT[] DEFAULT ARRAY['openid', 'profile', 'email']::TEXT[],
    "default_scopes" TEXT[] DEFAULT ARRAY['openid', 'profile', 'email']::TEXT[],
    "grant_types" TEXT[] DEFAULT ARRAY['authorization_code', 'refresh_token']::TEXT[],
    "response_types" TEXT[] DEFAULT ARRAY['code']::TEXT[],
    "token_endpoint_auth_method" VARCHAR(50) DEFAULT 'client_secret_post',
    "access_token_ttl" INTEGER NOT NULL DEFAULT 900,
    "refresh_token_ttl" INTEGER NOT NULL DEFAULT 2592000,
    "id_token_ttl" INTEGER NOT NULL DEFAULT 900,
    "auth_code_ttl" INTEGER NOT NULL DEFAULT 600,
    "pkce_required" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable: oauth_consents
CREATE TABLE "oauth_consents" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "granted_scopes" TEXT[] NOT NULL,
    "granted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,

    CONSTRAINT "oauth_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable: organizations
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "external_id" VARCHAR(32) NOT NULL DEFAULT 'org_' || encode(gen_random_bytes(16), 'hex'),
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "avatar_url" TEXT,
    "owner_id" UUID NOT NULL,
    "is_personal" BOOLEAN NOT NULL DEFAULT false,
    "mfa_required" BOOLEAN NOT NULL DEFAULT false,
    "sso_enabled" BOOLEAN NOT NULL DEFAULT false,
    "sso_config" JSONB NOT NULL DEFAULT '{}',
    "ip_allowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "plan" VARCHAR(20) DEFAULT 'free',
    "max_members" INTEGER NOT NULL DEFAULT 5,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: org_members
CREATE TABLE "org_members" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "OrgMemberRole" NOT NULL DEFAULT 'member',
    "invited_by" UUID,
    "invited_at" TIMESTAMPTZ,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable: teams
CREATE TABLE "teams" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable: team_members
CREATE TABLE "team_members" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "team_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'member',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable: permissions
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "resource" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "qualifier" VARCHAR(50),
    "description" TEXT,
    "permission_key" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: roles
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "scope" VARCHAR(20) NOT NULL DEFAULT 'global',
    "app_id" VARCHAR(50),
    "org_id" UUID,
    "inherits_from" UUID,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: role_permissions
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "is_deny" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: user_roles
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "org_id" UUID,
    "team_id" UUID,
    "granted_by" UUID,
    "granted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: user_permissions
CREATE TABLE "user_permissions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "is_deny" BOOLEAN NOT NULL DEFAULT false,
    "org_id" UUID,
    "resource_id" VARCHAR(100),
    "granted_by" UUID,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: api_keys
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "key_prefix" VARCHAR(16) NOT NULL,
    "key_hash" VARCHAR(128) NOT NULL,
    "user_id" UUID NOT NULL,
    "org_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ip_allowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rate_limit" INTEGER,
    "allowed_origins" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expires_at" TIMESTAMPTZ,
    "last_used_at" TIMESTAMPTZ,
    "last_used_ip" INET,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMPTZ,
    "revoked_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable: projects
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "external_id" VARCHAR(32) NOT NULL DEFAULT 'prj_' || encode(gen_random_bytes(16), 'hex'),
    "org_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable: project_members
CREATE TABLE "project_members" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'viewer',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable: audit_logs
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "action" "AuditAction" NOT NULL,
    "user_id" UUID,
    "org_id" UUID,
    "ip_address" INET,
    "user_agent" TEXT,
    "country_code" VARCHAR(2),
    "session_id" UUID,
    "request_id" VARCHAR(64),
    "target_user_id" UUID,
    "target_org_id" UUID,
    "target_resource" VARCHAR(100),
    "target_id" VARCHAR(100),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: invitations
CREATE TABLE "invitations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" CITEXT NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "org_id" UUID,
    "team_id" UUID,
    "project_id" UUID,
    "role" "OrgMemberRole" NOT NULL DEFAULT 'member',
    "invited_by" UUID NOT NULL,
    "message" TEXT,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "accepted_at" TIMESTAMPTZ,
    "accepted_by" UUID,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: notification_preferences
CREATE TABLE "notification_preferences" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "email_login_alerts" BOOLEAN NOT NULL DEFAULT true,
    "email_security_alerts" BOOLEAN NOT NULL DEFAULT true,
    "email_product_updates" BOOLEAN NOT NULL DEFAULT false,
    "email_marketing" BOOLEAN NOT NULL DEFAULT false,
    "push_enabled" BOOLEAN NOT NULL DEFAULT false,
    "push_security_alerts" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_external_id_key" ON "users"("external_id");
CREATE INDEX "idx_users_status" ON "users"("status") WHERE "status" != 'deleted';
CREATE INDEX "idx_users_created_at" ON "users"("created_at");
CREATE INDEX "idx_users_last_login" ON "users"("last_login_at");
CREATE INDEX "idx_users_global_role" ON "users"("global_role");

CREATE UNIQUE INDEX "password_history_user_id_created_at_key" ON "password_history"("user_id", "created_at");
CREATE INDEX "idx_password_history_user" ON "password_history"("user_id");

CREATE UNIQUE INDEX "oauth_accounts_provider_provider_user_id_key" ON "oauth_accounts"("provider", "provider_user_id");
CREATE INDEX "idx_oauth_accounts_user" ON "oauth_accounts"("user_id");

CREATE UNIQUE INDEX "web3_wallets_address_chain_key" ON "web3_wallets"("address", "chain");
CREATE INDEX "idx_web3_wallets_user" ON "web3_wallets"("user_id");

CREATE UNIQUE INDEX "passkeys_credential_id_key" ON "passkeys"("credential_id");
CREATE INDEX "idx_passkeys_user" ON "passkeys"("user_id");

CREATE INDEX "idx_mfa_methods_user" ON "mfa_methods"("user_id");

CREATE UNIQUE INDEX "sessions_token_jti_key" ON "sessions"("token_jti");
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "sessions"("refresh_token_hash");
CREATE INDEX "idx_sessions_user" ON "sessions"("user_id") WHERE "is_revoked" = false;
CREATE INDEX "idx_sessions_expires" ON "sessions"("refresh_token_expires_at") WHERE "is_revoked" = false;
CREATE INDEX "idx_sessions_user_active" ON "sessions"("user_id", "last_active_at" DESC) WHERE "is_revoked" = false;

CREATE UNIQUE INDEX "token_blacklist_jti_key" ON "token_blacklist"("jti");
CREATE INDEX "idx_blacklist_expires" ON "token_blacklist"("expires_at");

CREATE UNIQUE INDEX "verification_tokens_token_hash_key" ON "verification_tokens"("token_hash");
CREATE INDEX "idx_vtoken_user_type" ON "verification_tokens"("user_id", "type") WHERE "used_at" IS NULL;
CREATE INDEX "idx_vtoken_expires" ON "verification_tokens"("expires_at");

CREATE UNIQUE INDEX "oauth_clients_client_id_key" ON "oauth_clients"("client_id");
CREATE INDEX "idx_oauth_clients_owner" ON "oauth_clients"("owner_id");

CREATE UNIQUE INDEX "oauth_consents_user_id_client_id_key" ON "oauth_consents"("user_id", "client_id");
CREATE INDEX "idx_oauth_consents_user" ON "oauth_consents"("user_id");
CREATE INDEX "idx_oauth_consents_client" ON "oauth_consents"("client_id");

CREATE UNIQUE INDEX "organizations_external_id_key" ON "organizations"("external_id");
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE INDEX "idx_orgs_owner" ON "organizations"("owner_id");

CREATE UNIQUE INDEX "org_members_org_id_user_id_key" ON "org_members"("org_id", "user_id");
CREATE INDEX "idx_org_members_org" ON "org_members"("org_id");
CREATE INDEX "idx_org_members_user" ON "org_members"("user_id");

CREATE UNIQUE INDEX "teams_org_id_slug_key" ON "teams"("org_id", "slug");
CREATE INDEX "idx_teams_org" ON "teams"("org_id");

CREATE UNIQUE INDEX "team_members_team_id_user_id_key" ON "team_members"("team_id", "user_id");
CREATE INDEX "idx_team_members_team" ON "team_members"("team_id");
CREATE INDEX "idx_team_members_user" ON "team_members"("user_id");

CREATE UNIQUE INDEX "permissions_permission_key_key" ON "permissions"("permission_key");
CREATE UNIQUE INDEX "permissions_resource_action_qualifier_key" ON "permissions"("resource", "action", "qualifier");

CREATE UNIQUE INDEX "roles_slug_scope_app_id_org_id_key" ON "roles"("slug", "scope", COALESCE("app_id", ''::VARCHAR), COALESCE("org_id", '00000000-0000-0000-0000-000000000000'::UUID));

CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");
CREATE INDEX "idx_role_permissions_role" ON "role_permissions"("role_id");
CREATE INDEX "idx_role_permissions_perm" ON "role_permissions"("permission_id");

CREATE INDEX "idx_user_roles_user" ON "user_roles"("user_id");
CREATE INDEX "idx_user_roles_role" ON "user_roles"("role_id");
CREATE INDEX "idx_user_roles_org" ON "user_roles"("org_id");
CREATE INDEX "idx_user_roles_expires" ON "user_roles"("expires_at") WHERE "expires_at" IS NOT NULL;

CREATE UNIQUE INDEX "user_permissions_user_id_permission_id_org_id_resource_id_key" ON "user_permissions"("user_id", "permission_id", COALESCE("org_id", '00000000-0000-0000-0000-000000000000'::UUID), COALESCE("resource_id", ''::VARCHAR));
CREATE INDEX "idx_user_permissions_user" ON "user_permissions"("user_id");

CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");
CREATE INDEX "idx_api_keys_user" ON "api_keys"("user_id");
CREATE INDEX "idx_api_keys_org" ON "api_keys"("org_id");
CREATE INDEX "idx_api_keys_prefix" ON "api_keys"("key_prefix");

CREATE UNIQUE INDEX "projects_external_id_key" ON "projects"("external_id");
CREATE UNIQUE INDEX "projects_org_id_slug_key" ON "projects"("org_id", "slug");
CREATE INDEX "idx_projects_org" ON "projects"("org_id");

CREATE UNIQUE INDEX "project_members_project_id_user_id_key" ON "project_members"("project_id", "user_id");
CREATE INDEX "idx_project_members_project" ON "project_members"("project_id");
CREATE INDEX "idx_project_members_user" ON "project_members"("user_id");

CREATE INDEX "idx_audit_logs_user" ON "audit_logs"("user_id", "created_at" DESC);
CREATE INDEX "idx_audit_logs_org" ON "audit_logs"("org_id", "created_at" DESC);
CREATE INDEX "idx_audit_logs_action" ON "audit_logs"("action", "created_at" DESC);
CREATE INDEX "idx_audit_logs_created" ON "audit_logs"("created_at" DESC);
CREATE INDEX "idx_audit_logs_ip" ON "audit_logs"("ip_address", "created_at" DESC);
CREATE INDEX "idx_audit_logs_target_user" ON "audit_logs"("target_user_id", "created_at" DESC);

CREATE INDEX "idx_invitations_email" ON "invitations"("email") WHERE "accepted_at" IS NULL AND "revoked_at" IS NULL;
CREATE UNIQUE INDEX "invitations_token_hash_key" ON "invitations"("token_hash");
CREATE INDEX "idx_invitations_org" ON "invitations"("org_id");

CREATE UNIQUE INDEX "notification_preferences_user_id_key" ON "notification_preferences"("user_id");

-- ============================================================================
-- FOREIGN KEYS
-- ============================================================================

ALTER TABLE "password_history" ADD CONSTRAINT "password_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "web3_wallets" ADD CONSTRAINT "web3_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "passkeys" ADD CONSTRAINT "passkeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mfa_methods" ADD CONSTRAINT "mfa_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "oauth_consents" ADD CONSTRAINT "oauth_consents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "oauth_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teams" ADD CONSTRAINT "teams_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "roles" ADD CONSTRAINT "roles_inherits_from_fkey" FOREIGN KEY ("inherits_from") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "roles" ADD CONSTRAINT "roles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_oauth_accounts_updated_at BEFORE UPDATE ON "oauth_accounts" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_web3_wallets_updated_at BEFORE UPDATE ON "web3_wallets" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_mfa_methods_updated_at BEFORE UPDATE ON "mfa_methods" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_oauth_clients_updated_at BEFORE UPDATE ON "oauth_clients" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON "organizations" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_org_members_updated_at BEFORE UPDATE ON "org_members" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_teams_updated_at BEFORE UPDATE ON "teams" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_api_keys_updated_at BEFORE UPDATE ON "api_keys" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON "projects" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_notification_prefs_updated_at BEFORE UPDATE ON "notification_preferences" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Max sessions enforcement trigger
CREATE OR REPLACE FUNCTION enforce_max_sessions()
RETURNS TRIGGER AS $$
DECLARE
    session_count INTEGER;
    max_sessions INTEGER := 5;
BEGIN
    SELECT COUNT(*) INTO session_count
    FROM "sessions"
    WHERE "user_id" = NEW."user_id" AND "is_revoked" = false;
    
    IF session_count >= max_sessions THEN
        UPDATE "sessions"
        SET "is_revoked" = true, "revoked_at" = CURRENT_TIMESTAMP, "revoke_reason" = 'max_sessions_exceeded'
        WHERE "id" = (
            SELECT "id" FROM "sessions"
            WHERE "user_id" = NEW."user_id" AND "is_revoked" = false
            ORDER BY "last_active_at" ASC
            LIMIT 1
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_max_sessions BEFORE INSERT ON "sessions" FOR EACH ROW EXECUTE FUNCTION enforce_max_sessions();
