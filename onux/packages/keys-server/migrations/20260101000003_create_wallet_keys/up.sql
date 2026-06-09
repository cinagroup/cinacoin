-- Wallet keys table
CREATE TABLE wallet_keys (
    id                BIGSERIAL PRIMARY KEY,
    wallet_id         UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id           VARCHAR(255) NOT NULL,
    encrypted_key     TEXT NOT NULL,
    public_key        TEXT NOT NULL,
    address           VARCHAR(255) NOT NULL,
    chain_type        VARCHAR(32) NOT NULL DEFAULT 'ethereum',
    derivation_path   VARCHAR(128) NOT NULL,
    status            VARCHAR(16) NOT NULL DEFAULT 'active',  -- active | deleted
    metadata          JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_wallet_keys_wallet_id
    ON wallet_keys (wallet_id);

CREATE INDEX idx_wallet_keys_user_id
    ON wallet_keys (user_id);

CREATE INDEX idx_wallet_keys_address
    ON wallet_keys (address);

CREATE INDEX idx_wallet_keys_status
    ON wallet_keys (status);
