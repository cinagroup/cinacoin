/**
 * Tests for JWT token generation and verification
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
} from '../src/lib/jwt';
import { resetConfig } from '../src/lib/config';

// Mock environment variables before any imports
beforeEach(() => {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  resetConfig();
});

afterEach(() => {
  resetConfig();
});

describe('JWT Library', () => {
  const testPayload = {
    sub: 'test-user-id',
    email: 'test@example.com',
    role: 'user',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid JWT string', () => {
      const token = generateAccessToken(testPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include correct payload data', () => {
      const token = generateAccessToken(testPayload);
      const decoded = decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded!.sub).toBe(testPayload.sub);
      expect(decoded!.email).toBe(testPayload.email);
      expect(decoded!.role).toBe(testPayload.role);
      expect(decoded!.type).toBe('access');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT string', () => {
      const token = generateRefreshToken(testPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include type: refresh', () => {
      const token = generateRefreshToken(testPayload);
      const decoded = decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded!.type).toBe('refresh');
    });
  });

  describe('generateTokenPair', () => {
    it('should return access and refresh tokens', () => {
      const pair = generateTokenPair(testPayload);
      
      expect(pair.accessToken).toBeDefined();
      expect(pair.refreshToken).toBeDefined();
      expect(pair.expiresIn).toBeGreaterThan(0);
    });

    it('should have different tokens for access and refresh', () => {
      const pair = generateTokenPair(testPayload);
      
      expect(pair.accessToken).not.toBe(pair.refreshToken);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(testPayload);
      const payload = verifyAccessToken(token);
      
      expect(payload.sub).toBe(testPayload.sub);
      expect(payload.email).toBe(testPayload.email);
      expect(payload.role).toBe(testPayload.role);
      expect(payload.type).toBe('access');
    });

    it('should throw on invalid token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow();
    });

    it('should throw on refresh token used as access token', () => {
      const refreshToken = generateRefreshToken(testPayload);
      // Refresh tokens are signed with a different secret, so signature verification fails first
      expect(() => verifyAccessToken(refreshToken)).toThrow();
    });

    it('should throw on tampered token', () => {
      const token = generateAccessToken(testPayload);
      const tampered = token.slice(0, -5) + 'xxxxx';
      expect(() => verifyAccessToken(tampered)).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(testPayload);
      const payload = verifyRefreshToken(token);
      
      expect(payload.sub).toBe(testPayload.sub);
      expect(payload.type).toBe('refresh');
    });

    it('should throw on access token used as refresh token', () => {
      const accessToken = generateAccessToken(testPayload);
      // Access tokens are signed with a different secret, so signature verification fails first
      expect(() => verifyRefreshToken(accessToken)).toThrow();
    });
  });

  describe('decodeToken', () => {
    it('should decode without verification', () => {
      const token = generateAccessToken(testPayload);
      const decoded = decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded!.sub).toBe(testPayload.sub);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('not-a-token');
      expect(decoded).toBeNull();
    });
  });
});
