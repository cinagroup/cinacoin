-- Invite keys table
CREATE TABLE invite_keys (
    id              BIGSERIAL PRIMARY KEY,
    invite_code     VARCHAR(32) NOT NULL UNIQUE,
    max_uses        INT NOT NULL DEFAULT 0,  -- 0 = unlimited
    current_uses    INT NOT NULL DEFAULT 0,
    expires_at      TIMESTAMPTZ,
    status          VARCHAR(16) NOT NULL DEFAULT 'active',  -- active | expired | revoked | redeemed
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invite_keys_code
    ON invite_keys (invite_code);

CREATE INDEX idx_invite_keys_status
    ON invite_keys (status);
