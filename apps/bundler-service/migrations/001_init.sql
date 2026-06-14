CREATE TABLE IF NOT EXISTS user_operations (
  hash TEXT PRIMARY KEY,
  sender TEXT NOT NULL,
  nonce TEXT NOT NULL,
  entry_point TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  block_number INTEGER,
  gas_used TEXT,
  success INTEGER DEFAULT 0,
  error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_user_ops_sender ON user_operations(sender);
CREATE INDEX IF NOT EXISTS idx_user_ops_status ON user_operations(status);
CREATE INDEX IF NOT EXISTS idx_user_ops_tx_hash ON user_operations(tx_hash);

CREATE TABLE IF NOT EXISTS paymaster_deposits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  paymaster_address TEXT NOT NULL,
  entry_point TEXT NOT NULL,
  deposit_amount TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS gas_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  block_number INTEGER NOT NULL,
  base_fee TEXT NOT NULL,
  priority_fee TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);
