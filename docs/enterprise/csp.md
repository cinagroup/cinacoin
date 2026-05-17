# Content Security Policy (CSP) Guide for CinaConnect

## Overview

This guide covers Content Security Policy configuration for enterprise CinaConnect deployments.

## Required CSP Directives

### Minimum Required

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.cinaconnect.com;
  style-src 'self' 'unsafe-inline' https://cdn.cinaconnect.com;
  connect-src 'self' https://*.cinaconnect.com wss://*.cinaconnect.com;
  img-src 'self' data: https:;
  frame-src 'self' https://walletconnect.com https://verify.walletconnect.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

### Nginx Configuration

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.cinaconnect.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.cinaconnect.com wss://*.cinaconnect.com; img-src 'self' data: https:; frame-src 'self' https://walletconnect.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;
```

### Apache Configuration

```apache
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.cinaconnect.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.cinaconnect.com wss://*.cinaconnect.com; img-src 'self' data: https:; frame-src 'self' https://walletconnect.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
```

### Cloudflare Workers

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const response = await fetch(request);
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.cinaconnect.com; ...");
  return new Response(response.body, { status: response.status, headers: newHeaders });
}
```

## WebRTC Policy

For video call features:

```
media-src 'self' blob:;
```

## Trusted Types

For secure DOM manipulation:

```
trusted-types cinaconnect-dom-purify;
require-trusted-types-for 'script';
```

## Full Enterprise Template

```
default-src 'self';
script-src 'self' 'sha256-xxx' https://cdn.cinaconnect.com;
style-src 'self' 'sha256-yyy' https://cdn.cinaconnect.com;
connect-src 'self' https://relay.cinaconnect.com wss://relay.cinaconnect.com https://*.cinaconnect.com;
img-src 'self' data: https: blob:;
font-src 'self' https://fonts.cinaconnect.com;
frame-src 'self' https://walletconnect.com https://verify.walletconnect.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
worker-src 'self' blob:;
manifest-src 'self';
upgrade-insecure-requests;
block-all-mixed-content;
```
