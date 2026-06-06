/**
 * Cinacoin consolidation router (Phase 3 — Multi-Zone subpath consolidation).
 *
 * Serves multiple Cloudflare Pages projects under a single domain
 * (cinacoin.com) by path prefix, the way vercel.com stitches marketing,
 * docs, and dashboard under one origin.
 *
 * Each downstream app sets `basePath` to its prefix so asset + route URLs
 * resolve correctly when proxied here.
 *
 * Routing table: longest-prefix match wins; unmatched paths fall through to
 * the marketing website.
 */

const ZONES = [
  { prefix: '/wallets', origin: 'https://cinacoin-wallet-explorer.pages.dev' },
  { prefix: '/docs', origin: 'https://cinacoin-docs.pages.dev' },
  { prefix: '/demo', origin: 'https://cinacoin-demo.pages.dev' },
  // Future zones (enable after each app sets its basePath + add the route in
  // wrangler.toml):
  // { prefix: '/dashboard', origin: 'https://cinacoin-cloud-dashboard.pages.dev' },
  // { prefix: '/analytics', origin: 'https://cinacoin-analytics.pages.dev' },
];

const FALLBACK_ORIGIN = 'https://cinacoin-website.pages.dev';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Longest-prefix match: a request to /wallets or /wallets/anything
    // goes to the wallet zone; /wallets-foo does NOT.
    const zone = ZONES.find(
      (z) => path === z.prefix || path.startsWith(z.prefix + '/'),
    );

    const origin = zone ? zone.origin : FALLBACK_ORIGIN;
    const target = new URL(url.pathname + url.search, origin);

    // Preserve method, headers, and body; set Host to the target origin.
    const proxied = new Request(target, request);
    proxied.headers.set('Host', new URL(origin).host);

    const resp = await fetch(proxied, { redirect: 'manual' });

    // Pass the response through unchanged.
    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: resp.headers,
    });
  },
};
