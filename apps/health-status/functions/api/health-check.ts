/**
 * Health-check proxy endpoint.
 * SECURITY: Validates target URLs to prevent SSRF attacks.
 * - Only allows HTTPS
 * - Blocks private/reserved IP ranges
 * - Restricts to an allowlist of known health-check domains
 */

// Allowlist of domains permitted for health checks
const ALLOWED_DOMAINS = new Set([
  'api.cinacoin.com',
  'rpc.cinacoin.com',
  'analytics.cinacoin.com',
  'backend.cinacoin.com',
  'health.cinacoin.com',
  'status.cinacoin.com',
  'cloud.cinacoin.com',
  'wallet.cinacoin.com',
]);

// Allowed CORS origins
const ALLOWED_ORIGINS = [
  'https://cinacoin.com',
  'https://www.cinacoin.com',
  'https://status.cinacoin.com',
  'https://health.cinacoin.com',
];

/**
 * Check if a hostname resolves to a private/reserved IP range.
 * Blocks: 10.x, 172.16-31.x, 192.168.x, 169.254.x, 127.x, 0.x, ::1, fc00::/7
 */
function isPrivateHost(hostname: string): boolean {
  // Block localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return true;
  }

  // Block IP-like hostnames in private ranges
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    // 10.0.0.0/8
    if (a === 10) return true;
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (link-local / metadata)
    if (a === 169 && b === 254) return true;
    // 127.0.0.0/8
    if (a === 127) return true;
    // 0.0.0.0
    if (a === 0) return true;
  }

  // Block IPv6 private
  if (hostname.startsWith('[') || hostname.includes(':')) {
    const lower = hostname.toLowerCase().replace(/[\[\]]/g, '');
    if (lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80')) {
      return true;
    }
  }

  return false;
}

/**
 * Validate the target URL for SSRF safety.
 */
function validateTargetUrl(rawUrl: string): { valid: true; url: URL } | { valid: false; error: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Only allow HTTPS
  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTPS URLs are allowed' };
  }

  // Block private/reserved IPs
  if (isPrivateHost(parsed.hostname)) {
    return { valid: false, error: 'Requests to private/internal addresses are not allowed' };
  }

  // Enforce domain allowlist
  if (!ALLOWED_DOMAINS.has(parsed.hostname)) {
    return { valid: false, error: `Domain "${parsed.hostname}" is not in the health-check allowlist` };
  }

  return { valid: true, url: parsed };
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Vary': 'Origin',
  };
}

export const onRequest: PagesFunction = async (context) => {
  const requestUrl = new URL(context.request.url);
  const targetParam = requestUrl.searchParams.get('url');
  const origin = context.request.headers.get('origin');

  if (!targetParam) {
    return new Response('Missing url parameter', {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  const validation = validateTargetUrl(targetParam);
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }

  try {
    const resp = await fetch(validation.url.toString(), {
      cf: { cacheTtl: 30, cacheEverything: true },
    });
    const body = await resp.text();
    return new Response(body, {
      status: resp.status,
      headers: {
        'Content-Type': resp.headers.get('Content-Type') || 'application/json',
        ...corsHeaders(origin),
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
  }
};

export const onRequestOptions: PagesFunction = async (context) => {
  const origin = context.request.headers.get('origin');
  return new Response(null, {
    headers: {
      ...corsHeaders(origin),
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
