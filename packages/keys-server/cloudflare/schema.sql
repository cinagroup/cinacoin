-- CinaConnect Keys Server — D1 Schema (SQLite)

CREATE TABLE IF NOT EXISTS keypairs (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  chain_id TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  public_key TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(address, chain_id)
);

CREATE INDEX IF NOT EXISTS idx_keypairs_address ON keypairs(address);
CREATE INDEX IF NOT EXISTS idx_keypairs_chain ON keypairs(chain_id);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  nonce TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_address ON sessions(address);
CREATE INDEX IF NOT EXISTS idx_sessions_nonce ON sessions(nonce);

CREATE TABLE IF NOT EXISTS preferences (
  address TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions TEXT NOT NULL DEFAULT '{}',
  expires_at INTEGER,
  last_used_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);
