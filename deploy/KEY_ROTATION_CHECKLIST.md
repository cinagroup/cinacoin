# Key Rotation Checklist

## Audit Summary

**Audit Date:** 2026-06-11
**Git History Clean:** ❌ NO — real secrets found in commit `8694bff4`
**Rotation Required:** ✅ YES

### Exposed Secrets (confirmed in git history)

The following real-looking secrets were committed in `8694bff4` and replaced with placeholders in `1dd99ff9`. Because git history retains the originals, **all must be considered compromised** unless the repo has never been pushed to a remote or the remote history was force-rewritten.

| Secret             | Value in History                                                   | Risk        |
| ------------------ | ------------------------------------------------------------------ | ----------- |
| DB_PASSWORD        | `XLSNYE5SZLICfFrWCYQdQCCPMDWVzV1z`                                 | 🔴 HIGH     |
| REDIS_PASSWORD     | `ULwncxfztz8jCRIvKeQIe77xv4GdyNry`                                 | 🔴 HIGH     |
| OAUTH_STATE_SECRET | `zZM05wzr3crK2OybDY1uZw216K9Y2IST7j8ieH7SIQ8KmIWW`                 | 🔴 HIGH     |
| SESSION_SECRET     | `qyODziuTarCQQtylhNxDOsmXWSw8agcBshOyNiP7HoHD8uH9`                 | 🔴 HIGH     |
| ENCRYPTION_KEY     | `efe014bf6ca500128d48c26f928593b015f6f6599831088920cd93e3c11104d9` | 🔴 CRITICAL |
| WEBHOOK_SECRET     | `75ed7e9b6997f5d523d15e766c9d76ac44f247df5f693bbb4a77f23c044076f4` | 🔴 HIGH     |

### Not Exposed (were already placeholders)

- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET — were `your-google-client-id` etc.
- GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET — same
- DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET — same
- SMTP_PASSWORD — was `your-smtp-password`
- SENTRY_DSN — was `your-sentry-dsn`
- CF_API_TOKEN — no history found in git (file is gitignored)

## Secrets to Verify/Rotate

### 🔴 Critical Priority

- [ ] **ENCRYPTION_KEY** — If exposed, all encrypted data may be decryptable. Rotate immediately and re-encrypt existing data.
- [ ] **DB_PASSWORD** — Database credentials exposed. Rotate and verify no unauthorized access.
- [ ] **SESSION_SECRET** — Session hijacking possible. Rotate; all active sessions will be invalidated.

### 🟠 High Priority

- [ ] **REDIS_PASSWORD** — Rotate and check Redis ACLs/logs for unauthorized access.
- [ ] **OAUTH_STATE_SECRET** — Rotate; OAuth flows will need re-validation.
- [ ] **WEBHOOK_SECRET** — Rotate and update webhook endpoint configurations.

### 🟡 Low Risk / No Action Needed

- [x] GOOGLE_CLIENT_SECRET — Was placeholder, no rotation needed
- [x] GITHUB_CLIENT_SECRET — Was placeholder, no rotation needed
- [x] DISCORD_CLIENT_SECRET — Was placeholder, no rotation needed
- [x] SMTP_PASSWORD — Was placeholder, no rotation needed
- [x] CF_API_TOKEN — No history in git (gitignored), no rotation needed

## Rotation Procedure

1. Generate new secret (use `openssl rand -hex 32` or equivalent)
2. Update in Cloudflare Secrets (`wrangler secret put <NAME>`)
3. Update in local `.env.secrets` (gitignored)
4. For ENCRYPTION_KEY: re-encrypt all existing encrypted data with new key
5. Verify service functionality
6. Remove old secret from all stores
7. Consider force-pushing cleaned history or using `git filter-repo` to scrub commit `8694bff4`

## Git History Remediation

The secrets live in commit `8694bff4`. Even though `1dd99ff9` replaced them, **anyone with clone access can inspect the old commit**. Options:

1. **`git filter-repo`** — Rewrite history to scrub the values (requires force-push + team coordination)
2. **BFG Repo-Cleaner** — Alternative to filter-repo
3. **Accept & rotate** — If the repo was never public/external, rotation alone may suffice

## Status

- Audit Date: 2026-06-11
- Git History Clean: ❌ NO
- Rotation Required: ✅ YES
- Secrets Exposed: 6
- Secrets Safe: 6
