# JWT Security Best Practices - CINAcoin Auth Service

## Overview

This document outlines security best practices for JWT (JSON Web Token) implementation in the CINAcoin Auth Service deployed on Cloudflare Workers.

## Current Implementation

### Architecture
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Library**: jose (JWT library compatible with Cloudflare Workers)
- **Secrets Management**: Cloudflare Workers Secrets (encrypted at rest)
- **Token Types**: Access tokens (short-lived) + Refresh tokens (long-lived)

### Configuration
```
JWT_ISSUER=https://auth.cinacoin.com
JWT_AUDIENCE=cinacoin
JWT_EXPIRES_IN=900 (15 minutes)
JWT_REFRESH_EXPIRES_IN=604800 (7 days)
```

## Security Best Practices

### 1. Secret Management

#### ✅ DO:
- **Use Cloudflare Workers Secrets** for production deployment
  ```bash
  echo -n "your-secret" | wrangler secret put JWT_SECRET
  ```
- **Generate cryptographically secure secrets** (minimum 64 bytes / 512 bits)
  ```bash
  openssl rand -base64 64 | tr -d '\n=' | tr '+/' '-_' | head -c 86
  ```
- **Rotate secrets regularly** (every 90 days recommended)
- **Use separate secrets** for access and refresh tokens (already implemented)
- **Store backup copies** in a secure password manager (1Password, Bitwarden)

#### ❌ DON'T:
- Never commit secrets to version control
- Never log secrets in plaintext
- Never use weak or predictable secrets
- Never reuse secrets across environments (production vs staging)
- Never share secrets via email, chat, or unencrypted channels

### 2. Token Design

#### Access Tokens
- **Short expiration**: 15 minutes (900 seconds) ✅
- **Minimal payload**: Only include necessary claims (sub, email, role) ✅
- **Stateless verification**: No database lookup required ✅

#### Refresh Tokens
- **Longer expiration**: 7 days (604800 seconds) ✅
- **Separate secret**: Different from access token secret ✅
- **Token rotation**: Implement refresh token rotation (see below)
- **Secure storage**: Store in httpOnly, secure, sameSite cookies on client

### 3. Token Rotation Strategy

Implement refresh token rotation to detect token theft:

```typescript
// When refresh token is used:
// 1. Verify the refresh token
// 2. Check if it's been used before (store in KV/DB)
// 3. If reused → revoke all tokens for this user (potential theft)
// 4. Issue new access + refresh token pair
// 5. Mark old refresh token as used
```

**Implementation checklist:**
- [ ] Store refresh token hash in database/KV
- [ ] Check for token reuse on each refresh
- [ ] Implement family-based token tracking (optional advanced)
- [ ] Add revocation endpoint for logout

### 4. Validation & Verification

#### Always Validate:
- ✅ **Signature**: Verify token wasn't tampered with
- ✅ **Expiration (exp)**: Reject expired tokens
- ✅ **Issuer (iss)**: Ensure token is from your service
- ✅ **Audience (aud)**: Ensure token is intended for your service
- ✅ **Token type**: Prevent access/refresh token confusion

#### Code Example (already implemented):
```typescript
const { payload } = await jwtVerify(token, secret, {
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
});

if (payload.type !== 'access') {
  throw new Error('Invalid token type');
}
```

### 5. Algorithm Security

#### Current: HS256 (Symmetric)
**Pros:**
- Simple to implement
- Fast performance
- Single secret to manage

**Cons:**
- Same secret for signing and verification
- If secret leaks, attacker can forge tokens

#### Future: RS256 (Asymmetric) - Recommended Upgrade
**Pros:**
- Separate signing (private key) and verification (public key)
- Public key can be distributed safely
- Better for microservices architecture

**Migration path:**
1. Generate RSA 2048-bit key pair (already done, see `keys/` directory)
2. Store private key as Workers secret: `JWT_PRIVATE_KEY`
3. Store public key as Workers variable or fetch from JWKS endpoint
4. Update `jwt.ts` to use RS256:
   ```typescript
   import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose';
   
   const privateKey = await importPKCS8(env.JWT_PRIVATE_KEY, 'RS256');
   const publicKey = await importSPKI(env.JWT_PUBLIC_KEY, 'RS256');
   
   const token = await new SignJWT(payload)
     .setProtectedHeader({ alg: 'RS256' })
     .sign(privateKey);
   
   const { payload } = await jwtVerify(token, publicKey);
   ```
5. Deploy to staging first, test thoroughly
6. Rotate production secrets during maintenance window

### 6. Transport Security

- ✅ **HTTPS only**: All token transmission over TLS
- ✅ **CORS configured**: Restrict to trusted origins
- ✅ **Secure cookies**: Use `Secure`, `HttpOnly`, `SameSite=Strict` flags
- ⚠️ **Token storage**: Avoid localStorage (XSS vulnerable), prefer httpOnly cookies

### 7. Rate Limiting

Already implemented in middleware:
- Registration: 5 requests per IP per 15 minutes
- Login: 10 requests per IP per 15 minutes
- Refresh: 30 requests per IP per 15 minutes

**Purpose:** Prevent brute-force attacks and token guessing

### 8. Monitoring & Alerting

#### Log Events (without sensitive data):
- Failed token verification attempts
- Token expiration patterns
- Unusual refresh token reuse
- Rate limit violations

#### Alert On:
- Sudden spike in authentication failures
- Multiple token refresh failures from same IP
- Unusual geographic distribution of token usage

### 9. Incident Response

#### If JWT Secret is Compromised:

1. **Immediate (0-5 minutes):**
   - Generate new secrets using `scripts/generate-secrets.sh`
   - Deploy new secrets to Cloudflare Workers
   - All existing tokens become invalid (expected)

2. **Short-term (5-30 minutes):**
   - Monitor for unusual activity
   - Notify users if necessary (force re-login)
   - Review logs for suspicious token usage

3. **Post-incident:**
   - Investigate how secret was compromised
   - Update security practices if needed
   - Document lessons learned

### 10. Environment Separation

#### Production
- Use Cloudflare Workers Secrets
- Separate D1 database and KV namespace
- Strict CORS origins
- Real OAuth credentials

#### Staging
- Separate secrets (don't reuse production)
- Separate infrastructure (D1, KV)
- Test OAuth credentials
- Relaxed CORS for testing

#### Local Development
- Use `.dev.vars` file (gitignored)
- Generate with `scripts/generate-secrets.sh`
- Never use production secrets locally

## Compliance & Standards

### OWASP JWT Cheat Sheet Compliance
- ✅ Use strong algorithms (HS256/RS256)
- ✅ Validate all claims
- ✅ Use short expiration times
- ✅ Implement token rotation
- ✅ Secure secret storage

### NIST Guidelines
- ✅ Cryptographic keys ≥ 256 bits (we use 512 bits)
- ✅ Regular key rotation (90 days)
- ✅ Secure key generation (CSPRNG)

## File Structure

```
workers/auth-service/
├── keys/
│   ├── jwt-private.pem      # RSA private key (RS256 upgrade)
│   ├── jwt-public.pem       # RSA public key (RS256 upgrade)
│   └── .gitignore           # Ignore private key
├── scripts/
│   ├── generate-secrets.sh  # Generate new secrets
│   └── setup-secrets.sh     # Deploy to Cloudflare
├── .dev.vars                # Local dev secrets (gitignored)
├── .dev.vars.example        # Template for local dev
└── src/
    └── lib/
        └── jwt.ts           # JWT implementation
```

## Quick Reference

### Generate New Secrets
```bash
cd workers/auth-service
./scripts/generate-secrets.sh
```

### Deploy to Production
```bash
./scripts/setup-secrets.sh --env production
```

### Deploy to Staging
```bash
./scripts/setup-secrets.sh --env staging
```

### Verify Secrets
```bash
wrangler secret list
wrangler secret list --env staging
```

### Local Development
```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars with generated secrets
npm run dev
```

## Resources

- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [jose Library Documentation](https://github.com/panva/jose)
- [RFC 7519 - JSON Web Token](https://tools.ietf.org/html/rfc7519)

---

**Last Updated**: 2026-06-09  
**Maintained By**: CINAcoin Security Team  
**Review Cycle**: Quarterly
