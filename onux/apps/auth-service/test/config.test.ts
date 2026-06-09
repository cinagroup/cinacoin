/**
 * Tests for configuration loading
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, resetConfig } from '../src/lib/config';

describe('Config', () => {
  beforeEach(() => {
    // Clear all auth-related env vars
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.JWT_REFRESH_EXPIRES_IN;
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.CORS_ORIGIN;
    delete process.env.DATABASE_POOL_MIN;
    delete process.env.DATABASE_POOL_MAX;
    resetConfig();
  });

  afterEach(() => {
    resetConfig();
  });

  it('should load default config when no env vars set', () => {
    const config = loadConfig();
    
    expect(config.database.url).toBe('postgresql://postgres:postgres@localhost:5432/cinacoin_auth');
    expect(config.database.poolMin).toBe(2);
    expect(config.database.poolMax).toBe(10);
    expect(config.jwt.secret).toBe('dev-jwt-secret-do-not-use-in-production');
    expect(config.jwt.expiresIn).toBe('15m');
    expect(config.jwt.refreshExpiresIn).toBe('7d');
    expect(config.server.port).toBe(3200);
    expect(config.server.nodeEnv).toBe('development');
  });

  it('should use env vars when set', () => {
    process.env.DATABASE_URL = 'postgresql://custom:pass@host:5432/db';
    process.env.JWT_SECRET = 'custom-secret';
    process.env.PORT = '8080';
    process.env.NODE_ENV = 'production';
    
    const config = loadConfig();
    
    expect(config.database.url).toBe('postgresql://custom:pass@host:5432/db');
    expect(config.jwt.secret).toBe('custom-secret');
    expect(config.server.port).toBe(8080);
    expect(config.server.nodeEnv).toBe('production');
  });

  it('should throw on invalid port number', () => {
    process.env.PORT = 'not-a-number';
    
    expect(() => loadConfig()).toThrow('must be a number');
  });

  it('should parse pool sizes correctly', () => {
    process.env.DATABASE_POOL_MIN = '5';
    process.env.DATABASE_POOL_MAX = '20';
    
    const config = loadConfig();
    
    expect(config.database.poolMin).toBe(5);
    expect(config.database.poolMax).toBe(20);
  });
});
