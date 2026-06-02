/**
 * D1 Database Migration — Cinacoin WalletConnect Relay
 *
 * Run: wrangler d1 execute cinacoin-wc-relay-db --file=./migrations/001_init.sql
 */

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL UNIQUE,
  project_id TEXT,
  peer_a TEXT,
  peer_b TEXT,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_active INTEGER DEFAULT (strftime('%s', 'now')),
  region TEXT,
  status TEXT DEFAULT 'active',
  metadata TEXT -- JSON blob for additional session data
);

CREATE INDEX IF NOT EXISTS idx_sessions_topic ON sessions(topic);
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_region ON sessions(region);

-- Connection tracking table
CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  session_topic TEXT,
  client_ip TEXT,
  region TEXT,
  connected_at INTEGER DEFAULT (strftime('%s', 'now')),
  disconnected_at INTEGER,
  bytes_sent INTEGER DEFAULT 0,
  bytes_received INTEGER DEFAULT 0,
  FOREIGN KEY (session_topic) REFERENCES sessions(topic)
);

CREATE INDEX IF NOT EXISTS idx_connections_session ON connections(session_topic);
CREATE INDEX IF NOT EXISTS idx_connections_ip ON connections(client_ip);

-- Metrics table for alerting
CREATE TABLE IF NOT EXISTS metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER DEFAULT (strftime('%s', 'now')),
  metric_name TEXT NOT NULL,
  region TEXT,
  value REAL,
  tags TEXT -- JSON blob
);

CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(metric_name);
