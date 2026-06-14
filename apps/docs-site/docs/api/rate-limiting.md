---
sidebar_position: 3
title: Rate Limiting
description: Understanding Cinacoin API rate limits and best practices
---

# Rate limiting.

The Cinacoin API enforces rate limits to ensure fair usage and protect against abuse. This document explains the rate limiting strategy, limits per endpoint, and how to handle rate limit responses.

## Rate limit strategy.

Cinacoin uses a **sliding window** rate limiting algorithm implemented via Cloudflare KV storage. Limits are enforced at multiple levels:

1. **Global** — Per-IP address across all endpoints
2. **Endpoint-specific** — Stricter limits on sensitive operations
3. **Per-user** — Limits tied to authenticated user identity

## Global rate limits.

All requests through the API Gateway are subject to global rate limiting:

| Tier | Requests | Window | Notes |
|------|----------|--------|-------|
| Standard | 1,000 | 1 hour | Per IP address |
| Authenticated | 5,000 | 1 hour | With valid Bearer token |

## Endpoint-specific limits.

### Authentication endpoints.

Stricter limits on auth endpoints to prevent brute-force attacks:

| Endpoint | Method | Limit | Window | Purpose |
|----------|--------|-------|--------|---------|
| `/auth/login` | POST | 10 | 15 minutes | Prevent password guessing |
| `/auth/register` | POST | 5 | 15 minutes | Prevent mass registration |
| `/auth/refresh` | POST | 30 | 15 minutes | Prevent token abuse |
| `/auth/password-reset` | POST | 5 | 1 hour | Prevent spam |
| `/auth/mfa/verify` | POST | 10 | 15 minutes | Prevent MFA bypass |
| `/auth/oauth/*` | * | 20 | 15 minutes | Prevent OAuth abuse |

### User service endpoints.

| Scope | Limit | Window |
|-------|-------|--------|
| `/api/users/*` | 100 | 15 minutes |
| `/api/teams/*` | 200 | 15 minutes |
| `/api/api-keys/*` | 50 | 15 minutes |

## Rate limit headers.

When rate limited, the API returns a `429 Too Many Requests` response with these headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed in the window |
| `X-RateLimit-Remaining` | Requests remaining in the current window |
| `X-RateLimit-Reset` | Unix timestamp when the current window resets |
| `Retry-After` | Seconds to wait before retrying |

### Example response.

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1718000900
Retry-After: 847
Content-Type: application/json

{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again later."
}
```

## Best practices.

### 1. Implement exponential backoff.

```javascript
async function apiRequestWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter 
        ? parseInt(retryAfter) * 1000 
        : Math.pow(2, attempt) * 1000; // Exponential backoff
      
      console.log(`Rate limited. Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }
    
    return response;
  }
  
  throw new Error(`Failed after ${maxRetries} retries`);
}
```

### 2. Monitor rate limit headers.

Check rate limit headers before hitting the limit:

```javascript
async function apiRequest(url, options) {
  const response = await fetch(url, options);
  
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  
  if (remaining && parseInt(remaining) < 10) {
    console.warn(`Only ${remaining} requests remaining. Resets at ${reset}`);
    // Implement cooldown to avoid hitting the limit
  }
  
  return response;
}
```

### 3. Cache responses.

Reduce API calls by caching responses:

```javascript
const cache = new Map();

async function getCachedData(url, ttl = 300000) { // 5 min TTL
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const response = await fetch(url);
  const data = await response.json();
  
  cache.set(url, { data, timestamp: Date.now() });
  return data;
}
```

### 4. Use bulk endpoints.

When available, use bulk/batch endpoints to reduce the number of API calls:

```javascript
// ❌ Bad: Individual requests
for (const userId of userIds) {
  await fetch(`/api/users/${userId}`);
}

// ✅ Good: Batch request (if supported)
await fetch('/api/users/batch', {
  method: 'POST',
  body: JSON.stringify({ ids: userIds }),
});
```

### 5. Implement request queuing.

Queue requests to stay within rate limits:

```javascript
class RequestQueue {
  constructor(maxConcurrent = 5, delayMs = 200) {
    this.queue = [];
    this.active = 0;
    this.maxConcurrent = maxConcurrent;
    this.delayMs = delayMs;
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  async process() {
    while (this.queue.length > 0 && this.active < this.maxConcurrent) {
      const { fn, resolve, reject } = this.queue.shift();
      this.active++;
      
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        this.active--;
        await new Promise(r => setTimeout(r, this.delayMs));
        this.process();
      }
    }
  }
}
```

## Rate limit bypasses.

### API keys.

API keys have higher rate limits than standard authenticated requests:

| Tier | Requests | Window |
|------|----------|--------|
| Standard API Key | 10,000 | 1 hour |
| Premium API Key | 50,000 | 1 hour |
| Enterprise API Key | Unlimited | N/A |

To use an API key, include it in the `Authorization` header:

```bash
curl https://api.cinacoin.com/api/users \
  -H "Authorization: Bearer ck_your_api_key_here"
```

### Contact sales.

If you need higher rate limits for your application, contact our sales team at [sales@cinacoin.com](mailto:sales@cinacoin.com).

## Troubleshooting.

### "I'm getting 429 errors but I shouldn't be rate limited".

1. **Check shared IP**: If you're behind a NAT (corporate network, cloud provider), other users may be consuming the shared IP's rate limit.
2. **Use API keys**: API keys have higher limits and are not affected by shared IP issues.
3. **Check for infinite loops**: Ensure your code isn't accidentally making repeated requests.
4. **Check token refresh loops**: A misconfigured token refresh can cause rapid-fire refresh requests.

### "My rate limit counters seem wrong".

Rate limits are tracked per-IP (for unauthenticated requests) or per-user (for authenticated requests). If you're using multiple devices or IPs, each has its own limit.

## Next steps.

- [Error Codes](./errors.md) — Complete error reference
- [Authentication](./authentication.md) — Authentication guide
- [API Overview](./overview.md) — Back to API overview
