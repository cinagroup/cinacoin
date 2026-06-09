import { describe, it, expect } from 'vitest';
import { Config, createConfig } from '../lib/config';
import type { Env } from '../lib/types';

describe('Config', () => {
  const createMockEnv = (overrides: Partial<Env> = {}): Env => ({
    DB: {} as D1Database,
    RATE_LIMIT_KV: {} as KVNamespace,
    CACHE_KV: {} as KVNamespace,
    ENVIRONMENT: 'development',
    LOG_LEVEL: 'debug',
    JWT_SECRET: 'test-secret',
    ...overrides,
  });

  describe('createConfig', () => {
    it('should create a config instance', () => {
      const env = createMockEnv();
      const config = createConfig(env);
      expect(config).toBeInstanceOf(Config);
    });
  });

  describe('environment', () => {
    it('should return development by default', () => {
      const config = createConfig(createMockEnv());
      expect(config.environment).toBe('development');
      expect(config.isDevelopment).toBe(true);
    });

    it('should return production when set', () => {
      const config = createConfig(createMockEnv({ ENVIRONMENT: 'production' }));
      expect(config.environment).toBe('production');
      expect(config.isProduction).toBe(true);
    });

    it('should return staging when set', () => {
      const config = createConfig(createMockEnv({ ENVIRONMENT: 'staging' }));
      expect(config.environment).toBe('staging');
      expect(config.isStaging).toBe(true);
    });
  });

  describe('logLevel', () => {
    it('should return configured log level', () => {
      const config = createConfig(createMockEnv({ LOG_LEVEL: 'error' }));
      expect(config.logLevel).toBe('error');
    });

    it('should default to debug in development', () => {
      const config = createConfig(createMockEnv({ LOG_LEVEL: undefined as any }));
      expect(config.logLevel).toBe('debug');
    });
  });

  describe('rateLimits', () => {
    it('should return rate limit configurations', () => {
      const config = createConfig(createMockEnv());
      expect(config.rateLimits).toHaveProperty('default');
      expect(config.rateLimits).toHaveProperty('authenticated');
      expect(config.rateLimits).toHaveProperty('premium');
      expect(config.rateLimits.default.limit).toBe(100);
      expect(config.rateLimits.authenticated.limit).toBe(500);
    });
  });

  describe('cors', () => {
    it('should return production CORS config in production', () => {
      const config = createConfig(createMockEnv({ ENVIRONMENT: 'production' }));
      expect(config.cors.allowedOrigins).toContain('https://cinacoin.com');
    });

    it('should return development CORS config in development', () => {
      const config = createConfig(createMockEnv({ ENVIRONMENT: 'development' }));
      expect(config.cors.allowedOrigins).toContain('http://localhost:3000');
    });
  });

  describe('upstreamServices', () => {
    it('should return default upstream URLs', () => {
      const config = createConfig(createMockEnv());
      expect(config.upstreamServices.projectRegistry).toContain('project-registry-api');
      expect(config.upstreamServices.walletExplorer).toContain('wallet-explorer-api');
    });

    it('should use custom URLs when provided', () => {
      const config = createConfig(
        createMockEnv({
          PROJECT_REGISTRY_URL: 'https://custom-registry.example.com',
          WALLET_EXPLORER_URL: 'https://custom-wallets.example.com',
        })
      );
      expect(config.upstreamServices.projectRegistry).toBe('https://custom-registry.example.com');
      expect(config.upstreamServices.walletExplorer).toBe('https://custom-wallets.example.com');
    });
  });
});
