/**
 * Cinacoin consolidation router (Phase 3 — Multi-Zone subpath consolidation).
 *
 * Two jobs:
 *  1. Canonical host (cinacoin.com): proxy /<zone>/* to the matching Cloudflare
 *     Pages project — the way vercel.com stitches marketing, docs, and
 *     dashboard under one origin. Unmatched paths fall through to the website.
 *  2. Retired subdomains (demo/wallet/cloud/analytics/docs.cinacoin.com):
 *     301-redirect EVERY path to its canonical cinacoin.com/<zone>/ home so the
 *     old hosts are pure redirectors — no demo.cinacoin.com/demo/ double-paths,
 *     no stale content. Worker routes take precedence over the Pages custom
 *     domain on these hosts, while the proxy in (1) targets the *.pages.dev
 *     origin directly (not the subdomain), so the two never conflict.
 */

const CANONICAL_HOST = 'cinacoin.com';

const ZONES = [
  { prefix: '/wallets', origin: 'https://cinacoin-wallet-explorer.pages.dev' },
  { prefix: '/docs', origin: 'https://cinacoin-docs.pages.dev' },
  { prefix: '/demo', origin: 'https://cinacoin-demo.pages.dev' },
  { prefix: '/dashboard', origin: 'https://cinacoin-cloud-dashboard.pages.dev' },
  { prefix: '/analytics', origin: 'https://cinacoin-analytics.pages.dev' },
];

const FALLBACK_ORIGIN = 'https://cinacoin-website.pages.dev';

// Retired subdomain host -> canonical subpath prefix.
const RETIRED_SUBDOMAINS = {
  'demo.cinacoin.com': '/demo',
  'wallet.cinacoin.com': '/wallets',
  'cloud.cinacoin.com': '/dashboard',
  'analytics.cinacoin.com': '/analytics',
  'docs.cinacoin.com': '/docs',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const host = url.hostname;

    // (2) Retired subdomain -> 301 every path to the canonical subpath.
    const prefix = RETIRED_SUBDOMAINS[host];
    if (prefix) {
      let rest = url.pathname;
      // Drop a duplicated leading prefix (old demo.cinacoin.com/demo/x links).
      if (rest === prefix || rest.startsWith(prefix + '/')) {
        rest = rest.slice(prefix.length);
      }
      if (!rest.startsWith('/')) rest = '/' + rest;
      const tail = rest === '/' ? '/' : rest;
      return Response.redirect(
        `https://${CANONICAL_HOST}${prefix}${tail}${url.search}`,
        301,
      );
    }

    // (1) Canonical host: prefix-proxy to the matching zone, else the website.
    const path = url.pathname;
    const zone = ZONES.find(
      (z) => path === z.prefix || path.startsWith(z.prefix + '/'),
    );

    const origin = zone ? zone.origin : FALLBACK_ORIGIN;
    const target = new URL(url.pathname + url.search, origin);

    const proxied = new Request(target, request);
    proxied.headers.set('Host', new URL(origin).host);

    const resp = await fetch(proxied, { redirect: 'manual' });
    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: resp.headers,
    });
  },
};
