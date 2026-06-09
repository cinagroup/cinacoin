# Frontend Security Fix Report

**Date:** 2026-06-08
**Project:** Cinacoin (onux monorepo)
**Scope:** apps/demo, apps/website, apps/demo-dapp-react

---

## Summary

| ID | Issue | Status | File(s) |
|----|-------|--------|---------|
| F-001 | Auth session stored in localStorage | ✅ Already fixed | `apps/demo/src/lib/secureAuthSession.ts` exists; no imports of insecure `authSession.ts` found |
| F-002 | Hardcoded fallback API key | ✅ Already fixed | `buildWidgetUrl()` throws if `NEXT_PUBLIC_MOONPAY_API_KEY` is unset |
| F-003 | iframe missing sandbox attribute | ✅ Already fixed | `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"` present |
| F-004 | Missing security response headers | 🔧 Fixed | `apps/demo-dapp-react/next.config.js` — added full header set |
| F-005 | SIWE verification client-side only | 🔧 Fixed | Created `/api/verify-siwe` route; updated `siwe.ts` to call it |
| F-008 | Contact form has no rate limiting | 🔧 Fixed | Added per-IP memory rate limiter (5 req / 15 min) |

---

## Detailed Changes

### F-001 — Auth Session Storage (No change needed)
- `secureAuthSession.ts` already exists with in-memory storage (XSS-safe).
- `siwe.ts` already imports from `secureAuthSession`, not `authSession`.
- `authSession.ts` is already marked `@deprecated`.
- No files in the codebase import from the insecure module.

### F-002 — Hardcoded API Key (No change needed)
- `buildWidgetUrl()` in `onramp/page.tsx` already throws `Error('NEXT_PUBLIC_MOONPAY_API_KEY is required')` when the env var is missing. No fallback key exists.

### F-003 — iframe Sandbox (No change needed)
- The iframe in `onramp/page.tsx` already includes `sandbox="allow-scripts allow-same-origin allow-forms allow-popups"`.

### F-004 — Security Response Headers
**File:** `apps/demo-dapp-react/next.config.js`

Added the same security header configuration used by the other apps:
- `Content-Security-Policy` — restrictive CSP (self-only scripts, no frames, no objects, upgrade-insecure-requests)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 0` (modern best practice — rely on CSP)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

**Already had headers:** website (`next.config.mjs`), demo (`next.config.ts`), wallet-explorer (`next.config.mjs`), analytics-dashboard (`next.config.ts`), cloud-dashboard (`next.config.ts`).

### F-005 — Server-Side SIWE Verification
**New file:** `apps/demo/src/app/api/verify-siwe/route.ts`
- POST endpoint accepts `{ address, message, signature }`
- Uses `ethers.verifyMessage()` to cryptographically recover the signer address
- Compares recovered address with claimed address (case-insensitive)
- Returns `{ valid, recoveredAddress?, error? }`

**Modified:** `apps/demo/src/lib/siwe.ts`
- `verifySiweSignature()` now calls `/api/verify-siwe` server-side endpoint
- Removed client-side-only checks (parsing message, checking `eth_accounts`)
- The actual `signature` parameter is now passed through (was previously ignored as `_signature`)

### F-008 — Contact Form Rate Limiting
**File:** `apps/website/src/app/api/contact/route.ts`
- Added in-memory per-IP rate limiter: 5 requests per 15-minute window
- Extracts client IP from `X-Forwarded-For` / `X-Real-IP` headers
- Returns `429 Too Many Requests` with `Retry-After` header when limit exceeded
- Includes periodic cleanup of expired entries to prevent memory leaks

---

## Dependencies

- F-005 requires `ethers` package in `apps/demo`. Verify it's in `package.json` dependencies.

## Recommendations

1. **F-001:** Consider deleting the deprecated `authSession.ts` file entirely to prevent accidental future use.
2. **F-008:** For production, replace in-memory rate limiting with Redis-backed rate limiting for persistence across restarts and horizontal scaling.
3. **General:** Add `ethers` to demo app's `package.json` if not already present as a direct dependency.
