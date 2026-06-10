/**
 * Secure CORS (Cross-Origin Resource Sharing) Middleware
 * 
 * Implements allowlist-based CORS with:
 * - Strict origin validation (no wildcards)
 * - Credentials handling
 * - Preflight caching
 * - Method restrictions per origin
 */
import { Context, Next } from 'hono';

// ============================================================================
// Types
// ============================================================================

export interface CORSOriginConfig {
  /** Allowed HTTP methods for this origin */
  methods: string[];
  /** Allowed headers for this origin */
  allowedHeaders?: string[];
  /** Exposed headers in response */
  exposeHeaders?: string[];
  /** Whether credentials are allowed */
  credentials?: boolean;
  /** Max age for preflight cache (seconds) */
  maxAge?: number;
}

export interface CORSConfig {
  /** Map of allowed origins to their configuration */
  origins: Record<string, CORSOriginConfig>;
  /** Default configuration for all allowed origins (merged with origin-specific) */
  defaults?: Partial<CORSOriginConfig>;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_METHODS = ['GET', 'POST', 'OPTIONS'];
const DEFAULT_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Request-ID',
  'X-CSRF-Token',
  'X-API-Key',
];
const DEFAULT_EXPOSE_HEADERS = [
  'X-Request-ID',
  'X-RateLimit-Limit',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
  'X-RateLimit-IP-Limit',
  'X-RateLimit-IP-Remaining',
  'X-RateLimit-IP-Reset',
];
const DEFAULT_MAX_AGE = 86400; // 24 hours

/**
 * Production CORS configuration
 * Allowlist-based: only explicitly allowed origins can access the API
 */
export const CORS_CONFIG: CORSConfig = {
  origins: {
    // Main website
    'https://cinacoin.com': {
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      maxAge: DEFAULT_MAX_AGE,
    },
    // Wallet subdomain
    'https://wallet.cinacoin.com': {
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      maxAge: DEFAULT_MAX_AGE,
    },
    // Backend dashboard
    'https://backend.cinacoin.com': {
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      maxAge: DEFAULT_MAX_AGE,
    },
    // Cloud dashboard
    'https://cloud.cinacoin.com': {
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      maxAge: DEFAULT_MAX_AGE,
    },
    // Analytics dashboard
    'https://analytics.cinacoin.com': {
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
      maxAge: DEFAULT_MAX_AGE,
    },
    // Documentation site (read-only)
    'https://docs.cinacoin.com': {
      methods: ['GET', 'OPTIONS'],
      credentials: false,
      maxAge: DEFAULT_MAX_AGE,
    },
  },

  defaults: {
    allowedHeaders: DEFAULT_ALLOWED_HEADERS,
    exposeHeaders: DEFAULT_EXPOSE_HEADERS,
    maxAge: DEFAULT_MAX_AGE,
  },
};

/**
 * Development CORS configuration (more permissive)
 */
export const CORS_CONFIG_DEV: CORSConfig = {
  origins: {
    ...CORS_CONFIG.origins,
    'http://localhost:3000': {
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      maxAge: 3600,
    },
    'http://localhost:5173': {
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      maxAge: 3600,
    },
    'http://localhost:8080': {
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      maxAge: 3600,
    },
    'http://127.0.0.1:3000': {
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      maxAge: 3600,
    },
  },
  defaults: CORS_CONFIG.defaults,
};

// ============================================================================
// CORS Middleware
// ============================================================================

/**
 * Get origin configuration if allowed
 */
function getAllowedOriginConfig(
  origin: string | undefined,
  config: CORSConfig
): CORSOriginConfig | null {
  if (!origin) return null;

  const originConfig = config.origins[origin];
  if (!originConfig) return null;

  // Merge with defaults
  return {
    methods: originConfig.methods,
    allowedHeaders: originConfig.allowedHeaders ?? config.defaults?.allowedHeaders ?? DEFAULT_ALLOWED_HEADERS,
    exposeHeaders: originConfig.exposeHeaders ?? config.defaults?.exposeHeaders ?? DEFAULT_EXPOSE_HEADERS,
    credentials: originConfig.credentials ?? config.defaults?.credentials ?? false,
    maxAge: originConfig.maxAge ?? config.defaults?.maxAge ?? DEFAULT_MAX_AGE,
  };
}

/**
 * Handle preflight (OPTIONS) requests
 */
function handlePreflight(
  c: Context,
  origin: string,
  config: CORSOriginConfig
): Response {
  const requestMethod = c.req.header('Access-Control-Request-Method');
  const requestHeaders = c.req.header('Access-Control-Request-Headers');

  // Validate requested method
  if (requestMethod && !config.methods.includes(requestMethod)) {
    return c.json(
      { error: 'Method not allowed', message: `${requestMethod} is not allowed for this origin` },
      403
    );
  }

  // Validate requested headers
  if (requestHeaders) {
    const requested = requestHeaders.split(',').map((h) => h.trim().toLowerCase());
    const allowed = (config.allowedHeaders ?? []).map((h) => h.toLowerCase());
    const disallowed = requested.filter((h) => !allowed.includes(h));

    if (disallowed.length > 0) {
      return c.json(
        { error: 'Headers not allowed', message: `Headers not permitted: ${disallowed.join(', ')}` },
        403
      );
    }
  }

  // Return preflight response
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': config.methods.join(', '),
    'Access-Control-Allow-Headers': (config.allowedHeaders ?? DEFAULT_ALLOWED_HEADERS).join(', '),
    'Access-Control-Max-Age': (config.maxAge ?? DEFAULT_MAX_AGE).toString(),
    'Vary': 'Origin',
  };

  if (config.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return new Response(null, { status: 204, headers });
}

/**
 * Apply CORS headers to a response
 */
function applyCORSHeaders(
  c: Context,
  origin: string,
  config: CORSOriginConfig
) {
  c.header('Access-Control-Allow-Origin', origin);
  c.header('Vary', 'Origin');

  if (config.credentials) {
    c.header('Access-Control-Allow-Credentials', 'true');
  }

  if (config.exposeHeaders && config.exposeHeaders.length > 0) {
    c.header('Access-Control-Expose-Headers', config.exposeHeaders.join(', '));
  }
}

/**
 * Create CORS middleware with the given configuration
 */
export function corsMiddleware(config: CORSConfig = CORS_CONFIG) {
  return async (c: Context, next: Next) => {
    const origin = c.req.header('Origin');
    const originConfig = getAllowedOriginConfig(origin, config);

    // If origin is not in allowlist, don't add CORS headers
    if (!originConfig) {
      // For non-OPTIONS requests without valid origin, proceed normally
      // (same-origin requests don't need CORS headers)
      if (c.req.method !== 'OPTIONS') {
        await next();
        return;
      }

      // Reject preflight for unknown origins
      return c.json(
        { error: 'Origin not allowed', message: 'The request origin is not in the allowed list' },
        403
      );
    }

    // Handle preflight requests
    if (c.req.method === 'OPTIONS') {
      return handlePreflight(c, origin!, originConfig);
    }

    // Apply CORS headers to actual request
    applyCORSHeaders(c, origin!, originConfig);

    await next();
  };
}

/**
 * Environment-aware CORS middleware
 * Uses dev config in development, production config otherwise
 */
export function envCorsMiddleware(environment?: string) {
  const isDev = environment === 'development' || environment === 'local' || environment === 'staging';
  return corsMiddleware(isDev ? CORS_CONFIG_DEV : CORS_CONFIG);
}

/**
 * Get list of allowed origins (for documentation/debugging)
 */
export function getAllowedOrigins(config: CORSConfig = CORS_CONFIG): string[] {
  return Object.keys(config.origins);
}

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string, config: CORSConfig = CORS_CONFIG): boolean {
  return origin in config.origins;
}
