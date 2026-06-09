import type { Env } from './types';

/**
 * Configuration manager for the API Gateway
 * Centralizes environment-specific settings and validation
 */
export class Config {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.validate();
  }

  private validate(): void {
    // Validate required secrets in production
    if (this.isProduction && !this.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is required in production');
    }
  }

  get environment(): string {
    return this.env.ENVIRONMENT || 'development';
  }

  get isProduction(): boolean {
    return this.environment === 'production';
  }

  get isStaging(): boolean {
    return this.environment === 'staging';
  }

  get isDevelopment(): boolean {
    return this.environment === 'development';
  }

  get logLevel(): string {
    return this.env.LOG_LEVEL || (this.isDevelopment ? 'debug' : 'info');
  }

  get jwtSecret(): string {
    return this.env.JWT_SECRET;
  }

  get database(): D1Database {
    return this.env.DB;
  }

  get rateLimitKV(): KVNamespace {
    return this.env.RATE_LIMIT_KV;
  }

  get cacheKV(): KVNamespace {
    return this.env.CACHE_KV;
  }

  /**
   * Get upstream service URLs with fallbacks
   */
  get upstreamServices() {
    return {
      projectRegistry: this.env.PROJECT_REGISTRY_URL || 'https://project-registry-api.cinacoin.com',
      walletExplorer: this.env.WALLET_EXPLORER_URL || 'https://wallet-explorer-api.cinacoin.com',
    };
  }

  /**
   * Rate limit defaults per tier
   */
  get rateLimits() {
    return {
      default: { windowMs: 60_000, limit: 100 },      // 100 req/min
      authenticated: { windowMs: 60_000, limit: 500 }, // 500 req/min
      premium: { windowMs: 60_000, limit: 2000 },      // 2000 req/min
    };
  }

  /**
   * CORS configuration
   */
  get cors() {
    const allowedOrigins = this.isProduction
      ? ['https://cinacoin.com', 'https://www.cinacoin.com']
      : ['http://localhost:3000', 'http://localhost:5173', 'https://cinacoin.com'];

    return {
      allowedOrigins,
      allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-API-Key'],
      maxAge: 86400, // 24 hours
    };
  }
}

/**
 * Create a validated config instance
 */
export function createConfig(env: Env): Config {
  return new Config(env);
}
