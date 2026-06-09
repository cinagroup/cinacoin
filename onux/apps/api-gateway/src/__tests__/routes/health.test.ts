import { describe, it, expect, beforeEach } from 'vitest';
import app from '../../index';

/**
 * Integration tests for health check routes
 * Tests public endpoints for monitoring and readiness
 */
describe('Health Routes', () => {
  describe('GET /health', () => {
    it('should return basic health check', async () => {
      const res = await app.request('/health', {}, {
        ENVIRONMENT: 'development',
        LOG_LEVEL: 'debug',
        DB: createMockDB(),
        RATE_LIMIT_KV: createMockKV(),
        CACHE_KV: createMockKV(),
        JWT_SECRET: 'test-secret',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('ok');
      expect(body.service).toBe('cinacoin-api-gateway');
      expect(body.version).toBe('1.0.0');
      expect(body.environment).toBe('development');
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready status when all dependencies are healthy', async () => {
      const mockDB = createMockDB({ healthy: true });
      const mockKV = createMockKV({ healthy: true });

      const res = await app.request('/health/ready', {}, {
        ENVIRONMENT: 'development',
        LOG_LEVEL: 'debug',
        DB: mockDB,
        RATE_LIMIT_KV: mockKV,
        CACHE_KV: mockKV,
        JWT_SECRET: 'test-secret',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('ready');
      expect(body.checks.database.status).toBe('ok');
      expect(body.checks.kv.status).toBe('ok');
    });

    it('should return degraded status when database is unhealthy', async () => {
      const mockDB = createMockDB({ healthy: false });
      const mockKV = createMockKV({ healthy: true });

      const res = await app.request('/health/ready', {}, {
        ENVIRONMENT: 'development',
        LOG_LEVEL: 'debug',
        DB: mockDB,
        RATE_LIMIT_KV: mockKV,
        CACHE_KV: mockKV,
        JWT_SECRET: 'test-secret',
      });

      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.status).toBe('degraded');
      expect(body.checks.database.status).toBe('error');
    });
  });

  describe('GET /health/live', () => {
    it('should return alive status', async () => {
      const res = await app.request('/health/live', {}, {
        ENVIRONMENT: 'development',
        LOG_LEVEL: 'debug',
        DB: createMockDB(),
        RATE_LIMIT_KV: createMockKV(),
        CACHE_KV: createMockKV(),
        JWT_SECRET: 'test-secret',
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('alive');
      expect(body.timestamp).toBeDefined();
    });
  });
});

// Mock helpers
function createMockDB(options: { healthy?: boolean } = {}): D1Database {
  const { healthy = true } = options;
  
  return {
    prepare: (query: string) => ({
      bind: (...args: any[]) => ({
        run: async () => {
          if (!healthy) throw new Error('Database unavailable');
          return { success: true, meta: {} };
        },
        first: async (col?: string) => {
          if (!healthy) throw new Error('Database unavailable');
          return col === '1' ? { '1': 1 } : null;
        },
        all: async () => {
          if (!healthy) throw new Error('Database unavailable');
          return { results: [], success: true, meta: {} };
        },
      }),
      run: async () => {
        if (!healthy) throw new Error('Database unavailable');
        return { success: true, meta: {} };
      },
      first: async (col?: string) => {
        if (!healthy) throw new Error('Database unavailable');
        return null;
      },
      all: async () => {
        if (!healthy) throw new Error('Database unavailable');
        return { results: [], success: true, meta: {} };
      },
    }),
  } as D1Database;
}

function createMockKV(options: { healthy?: boolean } = {}): KVNamespace {
  const { healthy = true } = options;
  
  return {
    get: async (key: string, type?: string) => {
      if (!healthy) throw new Error('KV unavailable');
      return null;
    },
    put: async (key: string, value: string, options?: any) => {
      if (!healthy) throw new Error('KV unavailable');
    },
    delete: async (key: string) => {
      if (!healthy) throw new Error('KV unavailable');
    },
    list: async (options?: any) => {
      if (!healthy) throw new Error('KV unavailable');
      return { keys: [], list_complete: true, cacheStatus: null };
    },
  } as KVNamespace;
}
