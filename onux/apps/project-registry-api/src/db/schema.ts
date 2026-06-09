export const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  owner_address TEXT NOT NULL,
  chain_ids TEXT DEFAULT '[]',
  redirect_uris TEXT DEFAULT '[]',
  icon_url TEXT DEFAULT '',
  website_url TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  label TEXT DEFAULT '',
  permissions TEXT DEFAULT '["read","write"]',
  is_active INTEGER DEFAULT 1,
  last_used_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS usage_stats (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  api_key_id TEXT REFERENCES api_keys(id) ON DELETE SET NULL,
  endpoint TEXT DEFAULT '',
  request_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  date TEXT NOT NULL,
  UNIQUE(project_id, date)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_project ON api_keys(project_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_usage_stats_project_date ON usage_stats(project_id, date);
`;
