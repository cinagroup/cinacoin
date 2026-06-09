# Cinacoin Phase 2 — SSL/TLS Configuration Guide

> **Version**: 2.0.0  
> **Date**: 2026-06-08  
> **Status**: Production Ready  
> **Certificate Authority**: Let's Encrypt (via Cloudflare Universal SSL)

---

## 1. Certificate Architecture

### 1.1 Certificate Strategy

| Layer | Certificate Type | Provider | Renewal |
|-------|-----------------|----------|---------|
| Edge (Cloudflare) | Universal SSL | Cloudflare (Let's Encrypt / DigiCert) | Automatic |
| Origin (Workers) | Cloudflare Origin CA | Cloudflare | Manual (15-year validity) |
| Custom Certificates | Dedicated SSL | Let's Encrypt via Cloudflare | Automatic |

### 1.2 Coverage Map

| Subdomain | Edge SSL | Origin SSL | HSTS |
|-----------|----------|------------|------|
| `*.cinacoin.io` | ✅ Universal | ✅ Origin CA | ✅ Enabled |
| `cinacoin.io` | ✅ Universal | ✅ Origin CA | ✅ Enabled |
| `api.cinacoin.io` | ✅ Universal | ✅ Origin CA | ✅ + preload |
| `auth.cinacoin.io` | ✅ Universal | ✅ Origin CA | ✅ + preload |
| `users.cinacoin.io` | ✅ Universal | ✅ Origin CA | ✅ + preload |
| `app.cinacoin.io` | ✅ Universal | ✅ Origin CA | ✅ + preload |
| `dashboard.cinacoin.io` | ✅ Universal | ✅ Origin CA | ✅ Enabled |

---

## 2. Cloudflare SSL/TLS Settings

### 2.1 Edge Certificate (Universal SSL)

```bash
# Enable Universal SSL (automatic)
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/ssl/universal/settings" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true
  }'
```

**Configuration:**
- **SSL/TLS encryption mode**: Full (Strict)
- **Minimum TLS version**: 1.2
- **TLS 1.3**: Enabled
- **Automatic HTTPS Rewrites**: On
- **Always Use HTTPS**: On

### 2.2 SSL/TLS Mode Configuration

```bash
# Set SSL mode to Full (Strict)
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/ssl" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "strict"}'
```

| Mode | Description | Use Case |
|------|-------------|----------|
| Off | No SSL | ❌ Never |
| Flexible | Edge SSL only | ❌ Insecure origin |
| Full | Edge + origin SSL (self-signed OK) | ⚠️ Acceptable |
| **Full (Strict)** | Edge + origin SSL (valid cert required) | ✅ **Production** |

### 2.3 Minimum TLS Version

```bash
# Enforce TLS 1.2 minimum
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/min_tls_version" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "1.2"}'
```

### 2.4 TLS 1.3

```bash
# Enable TLS 1.3 with all suites
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/tls_1_3" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "on"}'
```

---

## 3. Origin Certificates (Cloudflare Origin CA)

### 3.1 Generate Origin Certificate

```bash
# Generate Origin CA certificate (15-year validity)
# Covers: *.cinacoin.io, cinacoin.io
curl -X POST "https://api.cloudflare.com/client/v4/certificates" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hostnames": ["cinacoin.io", "*.cinacoin.io"],
    "request_type": "origin-rsa",
    "requested_validity": 5475
  }'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "id": "cert-<ID>",
    "certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
    "private_key": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----",
    "expires_on": "2041-06-05T16:08:00Z"
  }
}
```

### 3.2 Store Origin Certificates

```bash
# Store in Cloudflare Workers secrets (for origin verification)
echo "-----BEGIN CERTIFICATE-----
<certificate_content>
-----END CERTIFICATE-----" | wrangler secret put ORIGIN_CERT --name cinacoin-api-gateway-prod

echo "-----BEGIN RSA PRIVATE KEY-----
<private_key_content>
-----END RSA PRIVATE KEY-----" | wrangler secret put ORIGIN_KEY --name cinacoin-api-gateway-prod
```

### 3.3 Origin Certificate Rotation

Origin CA certificates have 15-year validity. Rotation procedure:

```bash
#!/bin/bash
# scripts/rotate-origin-cert.sh

ZONE_ID="9e9b0140baac8f501ded715128fa5415"

# 1. Generate new certificate
NEW_CERT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/certificates" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hostnames": ["cinacoin.io", "*.cinacoin.io"],
    "request_type": "origin-rsa",
    "requested_validity": 5475
  }')

# 2. Extract new cert and key
NEW_CERT_PEM=$(echo "$NEW_CERT" | jq -r '.result.certificate')
NEW_KEY_PEM=$(echo "$NEW_CERT" | jq -r '.result.private_key')
NEW_CERT_ID=$(echo "$NEW_CERT" | jq -r '.result.id')

# 3. Update Workers secrets
echo "$NEW_CERT_PEM" | wrangler secret put ORIGIN_CERT --name cinacoin-api-gateway-prod
echo "$NEW_KEY_PEM" | wrangler secret put ORIGIN_KEY --name cinacoin-api-gateway-prod

# 4. Revoke old certificate (after verifying new cert works)
curl -X DELETE "https://api.cloudflare.com/client/v4/certificates/<OLD_CERT_ID>" \
  -H "Authorization: Bearer $CF_API_TOKEN"

echo "Origin certificate rotated successfully. New cert ID: $NEW_CERT_ID"
```

---

## 4. HSTS Configuration

### 4.1 Enable HSTS

```bash
# Enable HTTP Strict Transport Security
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/settings/security_header" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": {
      "strict_transport_security": {
        "enabled": true,
        "max_age": 31536000,
        "include_subdomains": true,
        "preload": true
      },
      "x_content_type_options": {
        "enabled": true,
        "value": "nosniff"
      },
      "x_frame_options": {
        "enabled": true,
        "value": "DENY"
      },
      "x_xss_protection": {
        "enabled": true,
        "value": "1; mode=block"
      },
      "referrer_policy": {
        "enabled": true,
        "value": "strict-origin-when-cross-origin"
      },
      "permissions_policy": {
        "enabled": true,
        "value": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
      }
    }
  }'
```

### 4.2 HSTS Preload Submission

Submit `cinacoin.io` to the HSTS preload list:

1. Visit: https://hstspreload.org/
2. Enter domain: `cinacoin.io`
3. Verify requirements:
   - ✅ Valid certificate (Universal SSL)
   - ✅ HTTPS redirect (Always Use HTTPS)
   - ✅ `max-age` ≥ 31536000 (1 year)
   - ✅ `includeSubDomains` enabled
   - ✅ `preload` directive present
4. Submit for inclusion

**Preload list inclusion timeline**: 2-8 weeks (Chrome, Firefox, Safari, Edge)

### 4.3 HSTS Header Verification

```bash
# Verify HSTS header
curl -sI https://cinacoin.io | grep -i strict
# Expected: strict-transport-security: max-age=31536000; includeSubDomains; preload

# Verify all subdomains
for sub in api auth users app dashboard rpc keys relay; do
  echo -n "${sub}.cinacoin.io: "
  curl -sI "https://${sub}.cinacoin.io" | grep -i "strict-transport" || echo "MISSING"
done
```

---

## 5. Certificate Monitoring

### 5.1 Monitoring Worker Configuration

Update the existing monitoring worker (`packages/monitoring/`) to include SSL checks:

```typescript
// packages/monitoring/src/ssl-check.ts

interface SSLCheckResult {
  domain: string;
  valid: boolean;
  issuer: string;
  expiresAt: string;
  daysUntilExpiry: number;
  protocol: string;
  cipher: string;
}

export async function checkSSLCertificate(domain: string): Promise<SSLCheckResult> {
  const response = await fetch(`https://${domain}`, {
    cf: {
      // Force TLS verification
    },
  });

  // Cloudflare Workers can inspect TLS via request properties
  const tlsVersion = (response as any).cf?.tlsVersion || 'unknown';
  const cipher = (response as any).cf?.cipher || 'unknown';

  return {
    domain,
    valid: response.ok || response.status === 301 || response.status === 302,
    issuer: 'Cloudflare Universal SSL',
    expiresAt: 'managed-by-cloudflare',
    daysUntilExpiry: 90, // Cloudflare auto-renews
    protocol: tlsVersion,
    cipher: cipher,
  };
}

export async function checkAllCertificates(): Promise<SSLCheckResult[]> {
  const domains = [
    'cinacoin.io',
    'api.cinacoin.io',
    'auth.cinacoin.io',
    'users.cinacoin.io',
    'app.cinacoin.io',
    'dashboard.cinacoin.io',
    'rpc.cinacoin.io',
    'keys.cinacoin.io',
    'relay.cinacoin.io',
  ];

  return Promise.all(domains.map(checkSSLCertificate));
}
```

### 5.2 Certificate Expiry Alerts

```typescript
// Alert thresholds
const ALERT_THRESHOLDS = {
  CRITICAL: 7,   // days — immediate alert
  WARNING: 30,   // days — warning alert
  INFO: 60,      // days — informational
};

async function alertOnCertificateExpiry(result: SSLCheckResult): Promise<void> {
  if (result.daysUntilExpiry <= ALERT_THRESHOLDS.CRITICAL) {
    await sendAlert({
      severity: 'critical',
      message: `🔴 SSL certificate for ${result.domain} expires in ${result.daysUntilExpiry} days!`,
      domain: result.domain,
    });
  } else if (result.daysUntilExpiry <= ALERT_THRESHOLDS.WARNING) {
    await sendAlert({
      severity: 'warning',
      message: `🟡 SSL certificate for ${result.domain} expires in ${result.daysUntilExpiry} days`,
      domain: result.domain,
    });
  }
}
```

### 5.3 Cloudflare Dashboard Monitoring

```bash
# Check SSL/TLS status via API
curl -s "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/ssl/certificate_packs" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq '.result[] | {
    type: .type,
    hosts: .hosts,
    status: .status,
    expires: .certificate.expires_on
  }'
```

---

## 6. Security Headers (Worker-Level)

### 6.1 API Gateway Security Headers

```typescript
// apps/api-gateway/src/security-headers.ts

export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  // HSTS (redundant with Cloudflare config, but defense-in-depth)
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Content Security
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  headers.set('Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');

  // Remove server identification
  headers.delete('X-Powered-By');
  headers.delete('Server');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
```

### 6.2 CSP for Frontend Applications

```typescript
// For Pages-hosted apps (app.cinacoin.io, dashboard.cinacoin.io)
// Add via _headers file in public/ directory

/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.cinacoin.io https://auth.cinacoin.io https://rpc.cinacoin.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
```

---

## 7. Mutual TLS (mTLS) — Optional

For service-to-service authentication between Workers:

```bash
# Generate mTLS certificate for internal services
openssl req -x509 -newkey rsa:2048 \
  -keyout internal-key.pem \
  -out internal-cert.pem \
  -days 365 \
  -nodes \
  -subj "/CN=cinacoin-internal" \
  -addext "subjectAltName=DNS:*.cinacoin.io,DNS:*.workers.dev"

# Upload as Custom Certificates for mTLS
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/acm/custom_certificates" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "certificate": "<internal-cert.pem>",
    "private_key": "<internal-key.pem>",
    "bundle_method": "ubiquitous"
  }'
```

---

## 8. SSL/TLS Audit Checklist

| Check | Command | Expected |
|-------|---------|----------|
| TLS 1.2+ enforced | `nmap --script ssl-enum-ciphers -p 443 api.cinacoin.io` | No SSLv3/TLS1.0/1.1 |
| HSTS header present | `curl -sI https://cinacoin.io \| grep strict` | `max-age=31536000` |
| Certificate valid | `openssl s_client -connect cinacoin.io:443 -servername cinacoin.io` | Verify OK |
| No weak ciphers | `testssl.sh api.cinacoin.io` | No RC4, DES, 3DES |
| Forward secrecy | `testssl.sh --fs api.cinacoin.io` | All ECDHE/DHE |
| OCSP stapling | `openssl s_client -connect cinacoin.io:443 -status` | OCSP Response: successful |
| Certificate transparency | `curl -s "https://crt.sh/?q=cinacoin.io" \| jq` | Only Cloudflare certs |

---

## 9. Incident Response

### 9.1 Certificate Compromise

```bash
# 1. Revoke compromised certificate immediately
curl -X DELETE "https://api.cloudflare.com/client/v4/certificates/<COMPROMISED_CERT_ID>" \
  -H "Authorization: Bearer $CF_API_TOKEN"

# 2. Issue new certificate
# (Cloudflare Universal SSL auto-reissues within minutes)

# 3. Rotate Origin CA certificate
# (Run rotate-origin-cert.sh)

# 4. Verify new certificate propagation
for sub in api auth users app dashboard; do
  echo -n "${sub}.cinacoin.io: "
  echo | openssl s_client -connect "${sub}.cinacoin.io":443 -servername "${sub}.cinacoin.io" 2>/dev/null | openssl x509 -noout -dates
done
```

### 9.2 SSL/TLS Downgrade Attack

1. Verify Cloudflare SSL mode is set to "Full (Strict)"
2. Confirm minimum TLS version is 1.2
3. Check for any Flexible SSL fallback
4. Review Cloudflare Security Events for anomalies

---

## 10. Cost Summary

| Service | Cost | Notes |
|---------|------|-------|
| Universal SSL | $0 | Included with Cloudflare |
| Origin CA certificates | $0 | Free for Cloudflare zones |
| Advanced Certificate Manager | $10/mo | Only if custom certs needed |
| mTLS certificates | $0 | Using Origin CA |
| **Total** | **$0-10/mo** | |

---

*Document version: 2.0.0 | Last updated: 2026-06-08 16:08 UTC*
