-- Identity keys table
CREATE TABLE identity_keys (
    id              BIGSERIAL PRIMARY KEY,
    user_id         VARCHAR(255) NOT NULL,
    key_id          UUID NOT NULL DEFAULT gen_random_uuid(),
    public_key      TEXT NOT NULL,
    algorithm       VARCHAR(32) NOT NULL DEFAULT 'ed25519',
    status          VARCHAR(16) NOT NULL DEFAULT 'active',  -- active | revoked | rotated
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_identity_keys_user_id_active
    ON identity_keys (user_id, key_id) WHERE status = 'active';

CREATE INDEX idx_identity_keys_user_id
    ON identity_keys (user_id);

CREATE INDEX idx_identity_keys_status
    ON identity_keys (status);
