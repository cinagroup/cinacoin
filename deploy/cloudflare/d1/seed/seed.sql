-- ============================================================
-- Seed Data for cinacoin-auth D1 Database
-- ============================================================

-- System/admin user (password: change-me-on-first-login)
-- Password hash is bcrypt of "change-me-on-first-login"
INSERT OR IGNORE INTO users (id, email, username, password_hash, auth_type, mfa_enabled, status, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@cinacoin.local',
  'system-admin',
  '$2b$12$LJ3m4ys3Lg0VPGJkKHQnU.0f7yG.hVxhL8pWyZ3k9m0cJQFR1Yki',
  'password',
  0,
  'active',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Default system team
INSERT OR IGNORE INTO teams (id, name, description, owner_id, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  'System',
  'Internal system team for platform administration',
  '00000000-0000-0000-0000-000000000001',
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

-- Admin as owner of system team
INSERT OR IGNORE INTO team_members (team_id, user_id, role, joined_at)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'owner',
  strftime('%s', 'now')
);

-- Default permissions for system admin
INSERT OR IGNORE INTO permissions (id, user_id, team_id, resource, action, granted_at)
VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '*', '*', strftime('%s', 'now')),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', NULL, 'users', 'manage', strftime('%s', 'now')),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', NULL, 'teams', 'manage', strftime('%s', 'now')),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001', NULL, 'api_keys', 'manage', strftime('%s', 'now'));

-- Audit log entry for initial setup
INSERT INTO audit_logs (id, user_id, action, resource, resource_id, metadata, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000999',
  '00000000-0000-0000-0000-000000000001',
  'system.initialized',
  'database',
  NULL,
  '{"message": "D1 database initialized with seed data"}',
  strftime('%s', 'now')
);
