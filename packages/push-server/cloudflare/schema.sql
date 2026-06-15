-- D1 Schema for Cinacoin Push Server
-- Apply with: wrangler d1 execute cinacoin-push-devices --file=schema.sql

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'fcm' | 'apns'
  token TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_token ON devices(token);
CREATE INDEX IF NOT EXISTS idx_platform ON devices(platform);
