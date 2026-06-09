-- Migration: 002_2fa_enforcement.sql
-- Purpose: Enforce 2FA for all users

-- Add 2FA enforcement fields to users table
ALTER TABLE users ADD COLUMN two_factor_secret TEXT;
ALTER TABLE users ADD COLUMN two_factor_backup_codes TEXT; -- JSON array
ALTER TABLE users ADD COLUMN two_factor_enforced_at TEXT;
ALTER TABLE users ADD COLUMN two_factor_grace_period_days INTEGER NOT NULL DEFAULT 7;

-- Update existing users to require 2FA (set mfa_required = 1)
UPDATE users SET mfa_required = 1 WHERE status = 'active';

-- Set enforcement date for existing users (7 days from now)
UPDATE users SET two_factor_enforced_at = datetime('now', '+7 days') WHERE status = 'active' AND mfa_enabled = 0;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_mfa_required ON users(mfa_required);
CREATE INDEX IF NOT EXISTS idx_users_two_factor_enforced_at ON users(two_factor_enforced_at);
