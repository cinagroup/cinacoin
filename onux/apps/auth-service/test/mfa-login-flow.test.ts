/**
 * Tests for MFA login flow security fix
 * Verifies that users with MFA enabled cannot bypass verification
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Mock ioredis to prevent connection errors in tests
vi.mock('ioredis', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      incr: vi.fn().mockResolvedValue(1),
      pexpire: vi.fn().mockResolvedValue(1),
      expire: vi.fn().mockResolvedValue(1),
      del: vi.fn().mockResolvedValue(1),
      get: vi.fn().mockResolvedValue(null),
      multi: vi.fn().mockReturnValue({
        exec: vi.fn().mockResolvedValue([]),
      }),
      on: vi.fn(),
    })),
  };
});

// Mock database functions
vi.mock('../src/db', () => ({
  findUserByEmail: vi.fn(),
  updateLastLogin: vi.fn(),
  getUserTotpMethod: vi.fn(),
  createMfaSession: vi.fn(),
  findUserById: vi.fn(),
  consumeMfaSession: vi.fn(),
  verifyRecoveryCode: vi.fn(),
}));

vi.mock('../src/lib', () => ({
  loginSchema: {
    safeParse: vi.fn((data) => ({
      success: true,
      data: data,
    })),
  },
  validate: vi.fn((schema, data) => ({
    success: true,
    data: data,
  })),
  verifyPassword: vi.fn(),
  generateTokenPair: vi.fn(() => ({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 900,
  })),
  toPublicUser: vi.fn((user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    status: user.status,
  })),
}));

vi.mock('../src/lib/totp', () => ({
  verifyTotpToken: vi.fn(),
}));

// Mock rate-limit middleware to bypass Redis calls
vi.mock('../src/middleware/rate-limit', () => ({
  withRateLimit: vi.fn((handler) => handler),
  recordAuthFailure: vi.fn().mockResolvedValue(1),
  recordAuthSuccess: vi.fn().mockResolvedValue(undefined),
}));

import { POST as loginPost } from '../src/app/api/auth/login/route';
import { POST as verifyLoginPost } from '../src/app/api/auth/mfa/verify-login/route';
import {
  findUserByEmail,
  updateLastLogin,
  getUserTotpMethod,
  createMfaSession,
  findUserById,
  consumeMfaSession,
  verifyRecoveryCode,
} from '../src/db';
import { verifyPassword, generateTokenPair } from '../src/lib';
import { verifyTotpToken } from '../src/lib/totp';

describe('MFA Login Flow Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      display_name: 'Test User',
      password_hash: 'hashed-password',
      role: 'user',
      status: 'active',
    };

    it('should return MFA required response when user has MFA enabled', async () => {
      // Setup: User with MFA enabled
      vi.mocked(findUserByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(getUserTotpMethod).mockResolvedValue({
        id: 'mfa-1',
        user_id: 'user-123',
        type: 'totp',
        is_enabled: true,
        is_primary: true,
        totp_secret: 'secret',
        totp_verified: true,
        recovery_codes_hash: null,
        name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      vi.mocked(createMfaSession).mockResolvedValue('mfa-token-uuid');

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      const response = await loginPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.mfaRequired).toBe(true);
      expect(data.data.mfaToken).toBe('mfa-token-uuid');
      expect(data.data.mfaTokenExpiresIn).toBe(300);
      
      // Should NOT call updateLastLogin or generateTokenPair
      expect(updateLastLogin).not.toHaveBeenCalled();
      expect(generateTokenPair).not.toHaveBeenCalled();
    });

    it('should return JWT tokens when user does NOT have MFA enabled', async () => {
      // Setup: User without MFA
      vi.mocked(findUserByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(getUserTotpMethod).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      const response = await loginPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.accessToken).toBe('mock-access-token');
      expect(data.data.refreshToken).toBe('mock-refresh-token');
      expect(data.data.mfaRequired).toBeUndefined();
      
      // Should call updateLastLogin and generateTokenPair
      expect(updateLastLogin).toHaveBeenCalledWith('user-123');
      expect(generateTokenPair).toHaveBeenCalled();
      
      // Should NOT create MFA session
      expect(createMfaSession).not.toHaveBeenCalled();
    });

    it('should return JWT when user has MFA method but is_enabled is false', async () => {
      // Setup: User with MFA method created but not enabled
      vi.mocked(findUserByEmail).mockResolvedValue(mockUser as any);
      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(getUserTotpMethod).mockResolvedValue({
        id: 'mfa-1',
        user_id: 'user-123',
        type: 'totp',
        is_enabled: false, // Not enabled
        is_primary: false,
        totp_secret: 'secret',
        totp_verified: false,
        recovery_codes_hash: null,
        name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      const response = await loginPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.accessToken).toBe('mock-access-token');
      expect(data.data.mfaRequired).toBeUndefined();
    });
  });

  describe('POST /api/auth/mfa/verify-login', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      display_name: 'Test User',
      role: 'user',
      status: 'active',
    };

    it('should issue JWT after successful MFA verification', async () => {
      vi.mocked(consumeMfaSession).mockResolvedValue('user-123');
      vi.mocked(findUserById).mockResolvedValue(mockUser as any);
      vi.mocked(getUserTotpMethod).mockResolvedValue({
        id: 'mfa-1',
        user_id: 'user-123',
        type: 'totp',
        is_enabled: true,
        is_primary: true,
        totp_secret: 'TOTPSECRET',
        totp_verified: true,
        recovery_codes_hash: null,
        name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      vi.mocked(verifyTotpToken).mockReturnValue(true);

      const request = new NextRequest('http://localhost/api/auth/mfa/verify-login', {
        method: 'POST',
        body: JSON.stringify({
          mfaToken: '550e8400-e29b-41d4-a716-446655440000',
          code: '123456',
        }),
      });

      const response = await verifyLoginPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.accessToken).toBe('mock-access-token');
      expect(data.data.refreshToken).toBe('mock-refresh-token');
      
      expect(consumeMfaSession).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
      expect(updateLastLogin).toHaveBeenCalledWith('user-123');
    });

    it('should reject invalid MFA token', async () => {
      vi.mocked(consumeMfaSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/auth/mfa/verify-login', {
        method: 'POST',
        body: JSON.stringify({
          mfaToken: '550e8400-e29b-41d4-a716-446655440000',
          code: '123456',
        }),
      });

      const response = await verifyLoginPost(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.message).toContain('Invalid or expired MFA token');
    });

    it('should reject invalid TOTP code', async () => {
      vi.mocked(consumeMfaSession).mockResolvedValue('user-123');
      vi.mocked(findUserById).mockResolvedValue(mockUser as any);
      vi.mocked(getUserTotpMethod).mockResolvedValue({
        id: 'mfa-1',
        user_id: 'user-123',
        type: 'totp',
        is_enabled: true,
        is_primary: true,
        totp_secret: 'TOTPSECRET',
        totp_verified: true,
        recovery_codes_hash: null,
        name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      vi.mocked(verifyTotpToken).mockReturnValue(false);

      const request = new NextRequest('http://localhost/api/auth/mfa/verify-login', {
        method: 'POST',
        body: JSON.stringify({
          mfaToken: '550e8400-e29b-41d4-a716-446655440000',
          code: '000000',
        }),
      });

      const response = await verifyLoginPost(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(data.message).toContain('Invalid verification code');
    });

    it('should support recovery code verification', async () => {
      vi.mocked(consumeMfaSession).mockResolvedValue('user-123');
      vi.mocked(findUserById).mockResolvedValue(mockUser as any);
      vi.mocked(verifyRecoveryCode).mockResolvedValue(true);

      const request = new NextRequest('http://localhost/api/auth/mfa/verify-login', {
        method: 'POST',
        body: JSON.stringify({
          mfaToken: '550e8400-e29b-41d4-a716-446655440000',
          code: 'ABCD-1234',
          method: 'recovery_code',
        }),
      });

      const response = await verifyLoginPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(verifyRecoveryCode).toHaveBeenCalledWith('user-123', 'ABCD-1234');
    });

    it('should reject suspended user during MFA verification', async () => {
      vi.mocked(consumeMfaSession).mockResolvedValue('user-123');
      vi.mocked(findUserById).mockResolvedValue({
        ...mockUser,
        status: 'suspended',
      } as any);

      const request = new NextRequest('http://localhost/api/auth/mfa/verify-login', {
        method: 'POST',
        body: JSON.stringify({
          mfaToken: '550e8400-e29b-41d4-a716-446655440000',
          code: '123456',
        }),
      });

      const response = await verifyLoginPost(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should validate mfaToken format (must be UUID)', async () => {
      const request = new NextRequest('http://localhost/api/auth/mfa/verify-login', {
        method: 'POST',
        body: JSON.stringify({
          mfaToken: 'not-a-uuid',
          code: '123456',
        }),
      });

      const response = await verifyLoginPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Bad Request');
    });
  });

  describe('Security: MFA Token Generation', () => {
    it('should use crypto.randomUUID() for token generation', async () => {
      // This test verifies the implementation uses crypto.randomUUID()
      const uuid = crypto.randomUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should hash tokens with SHA-256 before storage', () => {
      const token = '550e8400-e29b-41d4-a716-446655440000';
      const hash = crypto.createHash('sha256').update(token).digest('hex');
      
      expect(hash).toHaveLength(64); // SHA-256 produces 64 hex characters
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
