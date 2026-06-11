# Deployment Status

_Last updated: 2026-06-11_

## Workers Services — All Deployed ✅

All 5 Workers services have active deployment records on Cloudflare:

| Service       | Name                   | Latest Deployment         |
| ------------- | ---------------------- | ------------------------- |
| RPC Proxy     | cinacoin-rpc-proxy     | ✅ Deployed               |
| Keys Server   | cinacoin-keys-server   | ✅ Deployed               |
| Relay Server  | cinacoin-relay-server  | ✅ Deployed (2026-06-08)  |
| Notify Server | cinacoin-notify-server | ✅ Deployed (2026-06-07+) |
| Push Server   | cinacoin-push-server   | ✅ Deployed               |

## KV Namespaces — All Exist ✅

| Binding       | KV Title      | ID                               |
| ------------- | ------------- | -------------------------------- |
| RATE_LIMIT_KV | RATE_LIMIT_KV | dceb86e5cb4c4a008013c8cf21d7181c |
| SESSION_KV    | SESSION_KV    | 4a9aca26d37c4f9babb340b3865219c0 |
| RELAY_CACHE   | RELAY_CACHE   | 1a8dc90cb91c423695be43ce74028c88 |
| KEYS_CACHE    | KEYS_CACHE    | aabcbb80b702499bb508bd8114cc608d |
| CACHE_KV      | CACHE_KV      | 80d6f4082ff9447b974619d9ae091584 |

## D1 Databases — All Exist ✅

| Name             | UUID                                 | Status        |
| ---------------- | ------------------------------------ | ------------- |
| cinacoin-auth    | dbb6063f-86ca-4ac2-b960-25bbb752b73d | ✅ Production |
| cinacoin-users   | 1772bf0d-5e3b-4a18-b143-1bb2c3d29b62 | ✅ Production |
| cinacoin-keys    | 67d98935-9d34-4e3d-b357-af745fa47596 | ✅ Production |
| cinacoin-keys-db | 2a1681f9-065e-4dcd-ae8d-a980753733f1 | ✅ Production |

## Remaining Configuration Issues ⚠️

### 1. Analytics Server — Placeholder IDs in wrangler.toml

`packages/analytics-server/wrangler.toml` still has placeholder values:

- `database_id = "YOUR_D1_DATABASE_ID"` → needs real D1 ID
- `id = "YOUR_KV_NAMESPACE_ID"` (RATE_LIMIT_KV) → actual ID: `dceb86e5cb4c4a008013c8cf21d7181c`
- `id = "YOUR_DEDUP_KV_ID"` → needs creation or mapping

### 2. Keys Server — Missing database_id

`packages/keys-server/wrangler.toml` has `database_name = "cinacoin-keys"` but no `database_id` field.
Known ID: `67d98935-9d34-4e3d-b357-af745fa47596`

### 3. OAuth Credentials — Not in wrangler.toml

Google/GitHub/Discord OAuth secrets are not stored in wrangler.toml (correct — they should be Wrangler secrets).
Verify with: `wrangler secret list --name <service>`

### 4. Empty vars (non-critical)

- `bundler/wrangler.toml`: PAYMASTER_ADDRESS, BUNDLER_PRIVATE_KEY (empty)
- `monitoring/wrangler.toml`: DISCORD_WEBHOOK_URL (empty)
- `analytics-server/wrangler.toml`: API_KEY (empty)

## API Token Status

- CLOUDFLARE_API_TOKEN: ✅ Available (via /tmp/cf_token.txt)
- CLOUDFLARE_ACCOUNT_ID: Not set as env var (account_id in rpc-proxy wrangler.toml: 7ea8e46d8210bad342fa7595f7935fea)
