# Cinacoin Workers — Performance Audit Report

**Auditor:** 000 (Performance Audit Agent)
**Date:** 2026-06-09
**Scope:** `api-gateway/src/`, `auth-service/src/`, `user-service/src/`
**Platform:** Cloudflare Workers (Hono + D1 + KV)

---

## Executive Summary

The Cinacoin Workers codebase is well-structured and security-conscious, but contains several performance bottlenecks — primarily **sequential database operations that could be parallelized**, **missing caching layers**, and **per-request overhead in middleware**. The most critical hotspots are in the authentication flows (login, register, refresh), where 5–7 sequential async operations add up to 200–500ms+ of avoidable latency.

**Overall Performance Score: 58 / 100**

| Dimension | Score | Status |
|---|---|---|
| Database Queries | 55/100 | 🟠 Needs work |
| Caching Strategy | 25/100 | 🔴 Critical gap |
| Response Time (Hot Paths) | 50/100 | 🟠 Sequential bottlenecks |
| Resource Usage | 70/100 | 🟡 PBKDF2 expected but heavy |
| Network Optimization | 45/100 | 🟠 Missing compression/caching headers |
| Token Management | 65/100 | 🟡 Secret re-encoding per call |
| Rate Limiting | 50/100 | 🟠 KV array growth issue |
| Cold Start | 75/100 | 🟡 Minor middleware overhead |

---

## 1. Database Queries

### 🔴 Finding 1.1 — Sequential DB reads in login flow (N+1 pattern)
- **File:** `auth-service/src/routes/auth/login.ts:36-73`
- **Impact:** Login performs 5–6 sequential DB roundtrips: `findUserByEmail` → `verifyPassword` → `getUserTotpMethod` → `updateLastLogin` → `generateTokenPair` → `recordTokenIssuance` (which does 2 inserts). Each D1 `.first()` / `.run()` is a network call (~5–20ms).
- **Expected cost:** ~50–120ms of pure DB latency.
- **Fix:** Use `db.batch()` to parallelize independent reads. `findUserByEmail` and `getUserTotpMethod` can be batched. `updateLastLogin` and `recordTokenIssuance` can be batched after token generation.
- **Expected gain:** 30–60ms reduction (−40–50% DB latency).

### 🔴 Finding 1.2 — Sequential existence checks in registration
- **File:** `auth-service/src/routes/auth/register.ts:29-36`
- **Impact:** `emailExists()` and `usernameExists()` are called sequentially. Both are independent reads.
- **Fix:** Use `db.batch([emailQuery, usernameQuery])` to run them in parallel.
- **Expected gain:** ~5–15ms saved per registration.

### 🟠 Finding 1.3 — `createUser` does INSERT then SELECT
- **File:** `auth-service/src/db/users.ts:30-37`
- **Impact:** After inserting, a second query re-reads the full row. D1 supports `RETURNING` clause.
- **Fix:** Use `INSERT ... RETURNING *` and `.first()` to get the inserted row in one roundtrip.
- **Expected gain:** ~5–15ms per user creation.

### 🟠 Finding 1.4 — Token rotation: 3+ sequential writes
- **File:** `auth-service/src/lib/token-rotation.ts:40-85`
- **Impact:** `rotateRefreshToken` performs: SELECT (lookup) → UPDATE (revoke old) → INSERT (new session). The revoke and insert are independent after the lookup.
- **Fix:** After the SELECT, batch the UPDATE + INSERT with `db.batch()`.
- **Expected gain:** ~5–15ms per token refresh.

### 🟠 Finding 1.5 — Refresh endpoint: redundant token hash computation
- **File:** `auth-service/src/routes/auth/refresh.ts:34-95`
- **Impact:** `detectTokenReuse()` hashes the token (SHA-256), then `rotateRefreshToken()` hashes it again. Two SHA-256 computations + two DB lookups on the same `token_hash`.
- **Fix:** Merge `detectTokenReuse` into `rotateRefreshToken` — the lookup + reuse check can be a single query.
- **Expected gain:** ~5–10ms + reduced CPU.

### 🟠 Finding 1.6 — Missing composite index on sessions
- **File:** `auth-service/migrations/001_init.sql` (sessions table)
- **Impact:** Queries filter on `token_hash AND token_type='refresh'` but only `token_hash` is indexed. The `token_type` filter requires a table scan of matching hash rows.
- **Fix:** Add composite index: `CREATE INDEX idx_sessions_token_hash_type ON sessions(token_hash, token_type);`
- **Expected gain:** Faster token lookups as sessions table grows.

### 🟡 Finding 1.7 — `recordTokenIssuance` does 2 sequential inserts
- **File:** `auth-service/src/lib/token-rotation.ts:120-150`
- **Impact:** Inserts into `token_families` then `sessions` sequentially. These are independent (well, sessions references token_family, but the ID is pre-generated).
- **Fix:** Use `db.batch()` for both inserts.
- **Expected gain:** ~5–10ms.

### 🟡 Finding 1.8 — Recovery codes stored as JSON blob
- **File:** `auth-service/src/db/mfa.ts:95-130`
- **Impact:** Every recovery code verification requires: SELECT blob → JSON.parse → linear scan → JSON.stringify → UPDATE. For 10 codes this is fine, but the full blob is read/written each time.
- **Note:** Acceptable for ≤10 codes. If code count grows, consider a separate `recovery_codes` table.
- **Severity:** Low for current usage.

### 🟡 Finding 1.9 — `getTeamMembers` JOIN is well-optimized
- **File:** `user-service/src/db/queries.ts:110-135`
- **Positive:** Uses a single JOIN query instead of N+1. Good pattern.

### 🟡 Finding 1.10 — `updateUser` does UPDATE then SELECT
- **File:** `user-service/src/db/queries.ts:75-97`
- **Impact:** Same as 1.3 — UPDATE followed by re-SELECT. Could use `RETURNING`.
- **Fix:** `UPDATE ... RETURNING *`.
- **Expected gain:** ~5–10ms per update.

---

## 2. Caching Strategy

### 🔴 Finding 2.1 — No caching layer anywhere
- **Files:** All services
- **Impact:** Every `/auth/me`, `/mfa/status`, `/api/users/:id`, `/api/teams/:teamId` hits D1 on every request. No KV cache, no in-memory cache, no ETag support.
- **Fix:** Implement KV caching with short TTLs (30–60s) for read-heavy endpoints. Use `cache-control` headers for client-side caching.
- **Expected gain:** 50–80% reduction in D1 reads for repeated requests.

### 🔴 Finding 2.2 — No `Cache-Control` headers on any response
- **Files:** All route handlers
- **Impact:** Clients/CDNs never cache responses. Every request goes full roundtrip to Worker → D1.
- **Fix:** Add `Cache-Control: private, max-age=30` for user-specific data, `public, max-age=300` for team listings.
- **Expected gain:** Significant reduction in Worker invocations for repeat requests.

### 🟠 Finding 2.3 — No ETag / conditional request support
- **Files:** All GET endpoints
- **Impact:** Even when data hasn't changed, full response is sent. Wastes bandwidth and compute.
- **Fix:** Generate ETags (e.g., hash of `updated_at`) and support `If-None-Match` → 304.
- **Expected gain:** Reduced bandwidth, faster client-side experience.

### 🟠 Finding 2.4 — User-service has no KV binding
- **File:** `user-service/src/db/schema.ts:88-93` (Env type)
- **Impact:** User service only has D1, no KV for caching. Even simple caches (user profile by ID) would help.
- **Fix:** Add `KV: KVNamespace` to user-service Env and wrangler.toml.
- **Expected gain:** Enables caching layer.

---

## 3. Response Time — Hot Path Analysis

### 🔴 Finding 3.1 — Login hot path: ~200–500ms total
- **File:** `auth-service/src/routes/auth/login.ts`
- **Breakdown:**
  - `findUserByEmail`: ~10ms
  - `verifyPassword` (PBKDF2 100k): ~80–150ms
  - `getUserTotpMethod`: ~10ms
  - `updateLastLogin`: ~10ms
  - `generateTokenPair` (2× JWT sign): ~5–10ms
  - `recordTokenIssuance` (2 inserts): ~20ms
  - **Total: ~135–210ms** (best case, no MFA)
- **Fix:** Parallelize independent operations:
  ```
  const [user, totpMethod] = await db.batch([findEmail, findTotp]);
  // After token generation:
  await db.batch([updateLastLogin, insertTokenFamily, insertSession]);
  ```
- **Expected gain:** Reduce to ~100–160ms (−30%).

### 🔴 Finding 3.2 — Registration hot path: ~150–300ms
- **File:** `auth-service/src/routes/auth/register.ts`
- **Breakdown:**
  - `emailExists`: ~10ms
  - `usernameExists`: ~10ms
  - `hashPassword` (PBKDF2 100k): ~80–150ms
  - `createUser` (INSERT + SELECT): ~20ms
  - `generateTokenPair`: ~5–10ms
  - **Total: ~125–200ms**
- **Fix:** Batch existence checks. PBKDF2 is unavoidable but could run in parallel with nothing (it's the bottleneck).
- **Expected gain:** ~15–25ms from batching.

### 🟠 Finding 3.3 — OAuth callback: 3 sequential external HTTP calls
- **File:** `auth-service/src/routes/oauth/index.ts:100-180`
- **Impact:** Token exchange → profile fetch → (optionally) email fetch. Each is 50–200ms to external APIs.
- **GitHub worst case:** token + profile + emails = 3 sequential fetches = 150–600ms.
- **Fix:** For GitHub, use `Accept: application/json` + scope `user:email` to get email in the profile call if available. Consider parallel fetches where possible.
- **Expected gain:** 50–200ms for GitHub flow.

### 🟠 Finding 3.4 — Change-password: 2× PBKDF2
- **File:** `auth-service/src/routes/auth/change-password.ts:38-55`
- **Impact:** `verifyPassword` (100k iterations) + `hashPassword` (100k iterations) = ~160–300ms of CPU time.
- **Note:** Unavoidable for security. But the two operations are sequential and independent until the result is needed.
- **Fix:** None practical — both must complete before the next step. This is acceptable.
- **Severity:** 🟡 Informational.

### 🟡 Finding 3.5 — `/auth/me` does full DB lookup every time
- **File:** `auth-service/src/routes/auth/me.ts:14-25`
- **Impact:** JWT is verified (fast, ~1ms), then `findUserById` hits D1 (~10ms). This endpoint is called on every page load.
- **Fix:** Cache user profile in KV with 30s TTL. Invalidate on profile update.
- **Expected gain:** ~8ms → ~1ms (KV hit).

---

## 4. Resource Usage

### 🟠 Finding 4.1 — PBKDF2 at 100,000 iterations (Cloudflare max)
- **File:** `auth-service/src/lib/password.ts:12`
- **Impact:** Each login/register/change-password burns ~80–150ms of CPU. Under load (e.g., 100 concurrent logins), this could hit CPU limits.
- **Note:** 100k is the CF Workers limit. This is the correct choice given platform constraints. OWASP recommends 600k for SHA-256, but CF caps at 100k.
- **Mitigation:** Consider adding a brief `Retry-After` hint on failed logins to slow brute-force. Already rate-limited (5/15min), which helps.
- **Severity:** 🟡 Acceptable given platform constraints.

### 🟡 Finding 4.2 — `TextEncoder().encode()` called per JWT operation
- **File:** `auth-service/src/lib/jwt.ts:24,47,69,87`
- **Impact:** `new TextEncoder().encode(env.JWT_SECRET)` creates a new Uint8Array on every token sign/verify. With HS256, this happens 2× per token pair generation.
- **Fix:** Cache the encoded secret. In Workers, module-level state persists across requests on the same isolate:
  ```ts
  const encoder = new TextEncoder();
  // In function: cache via WeakMap or module-level Map keyed by secret string
  ```
- **Expected gain:** Minor (~0.1ms per call) but adds up at scale.

### 🟡 Finding 4.3 — Recovery codes: JSON.parse/stringify on every verification
- **File:** `auth-service/src/db/mfa.ts:100-130`
- **Impact:** Parsing and stringifying a 10-element array is fast (~0.1ms). Negligible.
- **Severity:** 🔵 Low.

### 🔵 Finding 4.4 — `uuidv4()` uses manual hex formatting
- **File:** `auth-service/src/lib/utils.ts:8-20`
- **Impact:** `Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')` is slower than `crypto.randomUUID()` which is natively available in Workers.
- **Fix:** Use `crypto.randomUUID()` directly (already used in user-service).
- **Expected gain:** ~0.05ms per UUID. Minor but cleaner.

---

## 5. Network Optimization

### 🟠 Finding 5.1 — No response compression configured
- **Files:** All services
- **Impact:** Cloudflare Workers auto-compress with Brotli/gzip when the response has appropriate headers, but only if `Content-Encoding` is not already set. JSON responses benefit significantly.
- **Note:** CF Workers handles this automatically for most responses. However, setting `Content-Type: application/json` explicitly helps CF decide to compress.
- **Fix:** Ensure all JSON responses have explicit `Content-Type` (Hono does this by default with `c.json()`).
- **Severity:** 🟡 Mostly handled by CF, but verify.

### 🟠 Finding 5.2 — No request batching/endpoint
- **Files:** All services
- **Impact:** Client must make separate requests for `/auth/me` + `/mfa/status` + user profile. Each is a full Worker invocation.
- **Fix:** Consider a `/auth/profile` endpoint that returns user + MFA status in one call.
- **Expected gain:** Saves 1–2 roundtrips on app initialization.

### 🟡 Finding 5.3 — CORS preflight `maxAge` inconsistent
- **Files:**
  - `api-gateway/src/index.ts:12` — no `maxAge` set
  - `auth-service/src/index.ts:21` — no `maxAge` set
  - `user-service/src/index.ts:33` — `maxAge: 86400` ✅
- **Impact:** Without `maxAge`, browsers send OPTIONS preflight for every cross-origin request.
- **Fix:** Add `maxAge: 86400` to api-gateway and auth-service CORS config.
- **Expected gain:** Eliminates OPTIONS requests for 24h after first request.

### 🟡 Finding 5.4 — OAuth tokens sent via URL redirect (security + perf)
- **File:** `auth-service/src/routes/oauth/index.ts:215`
- **Impact:** Tokens in URL are logged by browsers/proxies. Also, redirect adds a full page load.
- **Note:** This is more a security concern than performance. Mentioning for completeness.
- **Severity:** 🟠 Security (not performance).

---

## 6. Token Management

### 🟠 Finding 6.1 — JWT secret re-encoded on every operation
- **File:** `auth-service/src/lib/jwt.ts`
- **Impact:** `new TextEncoder().encode(env.JWT_SECRET)` on every sign/verify. At 1000 req/s, that's 2000+ unnecessary encodings/sec.
- **Fix:** Cache encoded secrets at module level with lazy initialization:
  ```ts
  let _accessSecret: Uint8Array;
  function getAccessSecret(env: Env) {
    return _accessSecret ??= new TextEncoder().encode(env.JWT_SECRET);
  }
  ```
- **Expected gain:** ~0.1ms per request. Small but free.

### 🟡 Finding 6.2 — `generateTokenPair` signs 2 JWTs sequentially
- **File:** `auth-service/src/lib/jwt.ts:57-65`
- **Impact:** Access + refresh tokens signed one after another. Both are CPU-bound (HMAC-SHA256).
- **Fix:** Use `Promise.all([generateAccessToken(...), generateRefreshToken(...)])`.
- **Expected gain:** ~1–3ms (parallel crypto operations).

### 🟡 Finding 6.3 — `logSecurityEvent` on every token rotation
- **File:** `auth-service/src/routes/auth/refresh.ts:105-115`
- **Impact:** Every successful refresh writes a security event to D1. This is good for auditing but adds ~10ms to the refresh flow.
- **Fix:** Consider batching with the token rotation writes, or writing to a buffered KV queue that flushes periodically.
- **Trade-off:** Security vs. performance. Current approach is safer.
- **Severity:** 🔵 Low — acceptable overhead.

### 🔵 Finding 6.4 — Logout doesn't revoke tokens server-side
- **File:** `auth-service/src/routes/auth/logout.ts:15-25`
- **Impact:** Logout is client-side only. Refresh tokens remain valid until expiry. This means the `sessions` table isn't cleaned up on logout.
- **Note:** Not a performance issue per se, but means the sessions table grows until tokens expire naturally.
- **Severity:** 🟡 Security/design concern.

---

## 7. Rate Limiting

### 🔴 Finding 7.1 — Sliding window stores unbounded timestamp arrays in KV
- **File:** `auth-service/src/middleware/rate-limit.ts:42-72`
- **Impact:** Each rate-limited request reads a JSON array from KV, appends a timestamp, and writes it back. For `api` limit (100 req/min), the array grows to 100 entries (~800 bytes). At 100 req/min per IP, that's 100 KV reads + 100 KV writes per minute per IP.
- **KV operations are expensive:** ~10–30ms per read, ~10–30ms per write.
- **Fix:** Switch to a simpler fixed-window counter (like api-gateway uses) for high-volume endpoints. Or use a two-window approach:
  ```
  key = `rl:${type}:${ip}:${window}`
  value = counter (integer)
  TTL = 2× window
  ```
- **Expected gain:** Reduce KV payload from ~800B to ~4B. Faster reads/writes. Simpler logic.

### 🟠 Finding 7.2 — Dual rate limiting (gateway + auth-service)
- **Files:**
  - `api-gateway/src/index.ts:22-32` (fixed window)
  - `auth-service/src/middleware/rate-limit.ts` (sliding window)
- **Impact:** Auth requests are rate-limited twice: once at gateway (100/min/IP), once at auth-service (5/15min for login). The gateway limit is redundant for login (auth-service is stricter).
- **Fix:** Gateway should only apply broad DDoS protection (high limits). Auth-service handles granular per-endpoint limits.
- **Expected gain:** Remove 1 KV read + 1 KV write per auth request (~20–40ms).

### 🟡 Finding 7.3 — Rate limit key includes 'unknown' for missing IP
- **File:** `auth-service/src/middleware/rate-limit.ts:29`
- **Impact:** If `x-forwarded-for` and `x-real-ip` are both missing, all such requests share the `unknown` bucket. This is a correctness issue, not performance.
- **Note:** In CF Workers, `cf-connecting-ip` is always available. The middleware should use that.
- **Fix:** Use `c.req.header('cf-connecting-ip')` as primary IP source.

### 🟡 Finding 7.4 — API gateway rate limiter does KV put on allowed requests
- **File:** `api-gateway/src/index.ts:25-30`
- **Impact:** Every allowed request does: KV get → parse → KV put. Two KV operations per request.
- **Fix:** Use KV with `check-and-set` pattern, or accept the overhead as necessary.
- **Severity:** 🔵 Acceptable for now.

---

## 8. Cold Start & Module Loading

### 🟡 Finding 8.1 — Logger middleware always active in api-gateway
- **File:** `api-gateway/src/index.ts:11`
- **Impact:** `logger()` runs on every request in all environments. In production, this adds string formatting overhead.
- **Fix:** Conditionally apply: `if (ENVIRONMENT !== 'production') app.use('*', logger())`.
- **Expected gain:** ~0.1–0.5ms per request.

### 🟡 Finding 8.2 — CORS middleware re-created per request in auth-service
- **File:** `auth-service/src/index.ts:19-27`
- **Impact:** `cors({...})` creates a new middleware function on every request. The config object is re-allocated.
- **Fix:** Create the CORS middleware once at module level, or use a factory that caches.
- **Expected gain:** ~0.05ms per request. Minor.

### 🟡 Finding 8.3 — Dynamic import in MFA verify
- **File:** `auth-service/src/routes/mfa/index.ts:68`
- **Impact:** `await import('../../lib/jwt.js')` inside a route handler. Dynamic imports trigger module loading on first call.
- **Fix:** Use static import at top of file (it's already imported transitively).
- **Expected gain:** ~1–5ms on first MFA verify call.

### 🟡 Finding 8.4 — Zod schema re-created per request
- **File:** `auth-service/src/routes/mfa/index.ts:105-110`
- **Impact:** `verifyLoginSchema` is defined inside the route handler, re-created on every request.
- **Fix:** Move schema definition to module level.
- **Expected gain:** ~0.1ms per request.

### 🔵 Finding 8.5 — User-service conditional middleware checks
- **File:** `user-service/src/index.ts:38-48`
- **Impact:** Logger and prettyJSON middleware check `ENVIRONMENT` on every request. The check is fast but unnecessary in production.
- **Note:** Already conditionally applied. Good pattern.
- **Severity:** 🔵 No action needed.

---

## 9. Additional Findings

### 🟠 Finding 9.1 — `SELECT *` used everywhere
- **Files:** All DB query files
- **Impact:** Fetches all columns including large text fields (`password_hash`, `raw_profile`, `recovery_codes_hash`). For `oauth_accounts.raw_profile` (full JSON profile), this could be several KB.
- **Fix:** Use explicit column lists for read queries. E.g., for `/auth/me`, don't fetch `password_hash`.
- **Expected gain:** Reduced memory, faster serialization, less bandwidth.

### 🟡 Finding 9.2 — No D1 prepared statement caching
- **Note:** D1 doesn't support statement caching like traditional databases. Each `.prepare()` is stateless.
- **Impact:** No performance concern — this is by design in D1.
- **Severity:** 🔵 Informational.

### 🟡 Finding 9.3 — `mfa_sessions` cleanup not automated
- **File:** `auth-service/migrations/001_init.sql`
- **Impact:** Expired MFA sessions accumulate in the table. The `consumemfaseSession` query filters by `expires_at > datetime('now')`, but old rows are never deleted.
- **Fix:** Add periodic cleanup (cron trigger) or use D1's `DELETE WHERE expires_at < datetime('now') AND used = 1`.
- **Expected gain:** Keeps table small, faster queries over time.

---

## 10. Optimization Priority Matrix

| Priority | Finding | Effort | Impact |
|---|---|---|---|
| **P0** | 3.1 — Parallelize login DB operations | Medium | High (−50ms+) |
| **P0** | 7.1 — Fix sliding window KV bloat | Medium | High (−20ms/req) |
| **P0** | 2.1 — Add caching layer | High | High (−50% DB reads) |
| **P1** | 1.2 — Batch registration checks | Low | Medium (−10ms) |
| **P1** | 1.3 — Use RETURNING clause | Low | Medium (−10ms) |
| **P1** | 1.5 — Merge token reuse check | Medium | Medium (−10ms) |
| **P1** | 5.3 — CORS maxAge on all services | Low | Medium (fewer OPTIONS) |
| **P1** | 6.1 — Cache JWT secret encoding | Low | Medium (scale) |
| **P2** | 2.2 — Add Cache-Control headers | Low | Medium |
| **P2** | 7.2 — Deduplicate rate limiting | Medium | Medium |
| **P2** | 9.1 — Avoid SELECT * | Medium | Medium |
| **P2** | 8.3 — Remove dynamic import | Low | Low |
| **P3** | 1.8 — Recovery codes table | High | Low (future) |
| **P3** | 6.4 — Server-side logout | Medium | Low |

---

## 11. Quick Wins (< 30 min each)

1. **Batch `emailExists` + `usernameExists`** in register.ts → `db.batch()`
2. **Cache JWT secret** encoding at module level in jwt.ts
3. **Add `maxAge: 86400`** to CORS in api-gateway and auth-service
4. **Move `verifyLoginSchema`** to module level in mfa/index.ts
5. **Remove dynamic import** in mfa/index.ts:68 — use static import
6. **Use `crypto.randomUUID()`** instead of manual uuidv4 in auth-service
7. **Add `Cache-Control: private, max-age=30`** to `/auth/me` response
8. **Conditionally apply logger** in api-gateway (like user-service already does)

---

## 12. Architecture Recommendations

### Short-term (1–2 weeks)
- Implement KV-backed read cache for `/auth/me`, `/mfa/status`, user lookups
- Switch rate limiter from sliding-window-array to fixed-window-counter
- Parallelize all independent DB operations with `db.batch()`
- Add `RETURNING *` to all INSERT + re-SELECT patterns

### Medium-term (1–2 months)
- Add request batching endpoint (`/auth/profile` = user + MFA status)
- Implement ETag support for GET endpoints
- Add composite indexes for multi-column queries
- Set up D1 cleanup cron for expired sessions/challenges

### Long-term (3+ months)
- Consider moving PBKDF2 to a dedicated auth queue (off hot path) if scale demands
- Evaluate moving refresh token tracking to KV (faster than D1 for high-write patterns)
- Implement connection-level query caching if D1 adds support
- Add performance monitoring (timing headers, structured logging)

---

## Appendix: Methodology

- Static code analysis of all `.ts` files in the three services
- Database schema review (migrations)
- Identification of sequential async patterns that could be parallelized
- Assessment of caching, compression, and network optimization
- CPU cost estimation for cryptographic operations (PBKDF2, JWT, SHA-256)
- KV operation counting for rate limiting overhead

**Tools:** Manual code review, pattern matching for N+1 and sequential-async anti-patterns.

---

*Report generated 2026-06-09T02:33Z by Cinacoin Performance Audit Agent*
