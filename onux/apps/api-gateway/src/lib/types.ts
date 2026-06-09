/**
 * Environment bindings for Cloudflare Workers
 */
export interface Env {
  // Database
  DB: D1Database;
  
  // KV Namespaces
  RATE_LIMIT_KV: KVNamespace;
  CACHE_KV: KVNamespace;
  
  // Environment
  ENVIRONMENT: 'development' | 'staging' | 'production';
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  
  // Secrets (set via wrangler secret put)
  JWT_SECRET: string;
  UPSTREAM_API_KEY?: string;
  
  // Optional: External service URLs
  PROJECT_REGISTRY_URL?: string;
  WALLET_EXPLORER_URL?: string;
}

/**
 * JWT Payload structure
 */
export interface JWTPayload {
  sub: string;           // Subject (user/project ID)
  iss: string;           // Issuer
  aud: string;           // Audience
  exp: number;           // Expiration time
  iat: number;           // Issued at
  scope?: string;        // OAuth-style scope
  permissions?: string[]; // Granular permissions
  project_id?: string;   // Project identifier
  api_key_id?: string;   // API key identifier
}

/**
 * API Key record from database
 */
export interface ApiKeyRecord {
  id: string;
  project_id: string;
  key_hash: string;
  label: string;
  permissions: string;
  is_active: number;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

/**
 * Standard API error response
 */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  request_id: string;
  timestamp: string;
}

/**
 * Standard API success response
 */
export interface ApiResponse<T = unknown> {
  data: T;
  meta?: {
    request_id: string;
    timestamp: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  limit: number;
  keyPrefix?: string;
}

/**
 * Request context variables
 */
export interface RequestContext {
  requestId: string;
  projectId?: string;
  apiKeyId?: string;
  permissions: string[];
  clientIp: string;
  userAgent?: string;
}
