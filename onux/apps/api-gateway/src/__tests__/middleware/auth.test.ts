import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as jose from 'jose';
import { jwtAuth, apiKeyAuth, requirePermission, authMiddleware } from '../../middleware/auth';

/**
 * Unit tests for authentication middleware
 */
describe('Auth Middleware', () => {
  const mockEnv = {
    JWT_SECRET: 'test-secret-key-for-jwt-signing',
    DB: {
      prepare: vi.fn(),
    },
  } as any;

  const mockContext = {
    env: mockEnv,
    req: {
      header: vi.fn(),
    },
    set: vi.fn(),
    get: vi.fn(),
  } as any;

  const mockNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('jwtAuth', () => {
    it('should reject requests without Authorization header', async () => {
      mockContext.req.header.mockReturnValue(null);

      await expect(jwtAuth(mockContext, mockNext)).rejects.toThrow('Missing or invalid Authorization header');
    });

    it('should reject requests with invalid Authorization format', async () => {
      mockContext.req.header.mockReturnValue('InvalidFormat');

      await expect(jwtAuth(mockContext, mockNext)).rejects.toThrow('Missing or invalid Authorization header');
    });

    it('should reject expired JWT tokens', async () => {
      const expiredToken = await new jose.SignJWT({ 
        sub: 'user123',
        permissions: ['read'],
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1s ago')
        .setIssuer('cinacoin-api')
        .setAudience('cinacoin-services')
        .sign(new TextEncoder().encode(mockEnv.JWT_SECRET));

      mockContext.req.header.mockReturnValue(`Bearer ${expiredToken}`);

      await expect(jwtAuth(mockContext, mockNext)).rejects.toThrow('Token has expired');
    });

    it('should accept valid JWT tokens', async () => {
      const validToken = await new jose.SignJWT({ 
        sub: 'user123',
        project_id: 'proj456',
        permissions: ['read', 'write'],
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .setIssuer('cinacoin-api')
        .setAudience('cinacoin-services')
        .sign(new TextEncoder().encode(mockEnv.JWT_SECRET));

      mockContext.req.header.mockReturnValue(`Bearer ${validToken}`);
      mockContext.get.mockReturnValue({ requestId: 'test-id', permissions: [] });

      await jwtAuth(mockContext, mockNext);

      expect(mockContext.set).toHaveBeenCalledWith('jwtPayload', expect.objectContaining({
        sub: 'user123',
        project_id: 'proj456',
        permissions: ['read', 'write'],
      }));
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    it('should allow access when user has required permission', async () => {
      const middleware = requirePermission('read');
      mockContext.get.mockReturnValue({ permissions: ['read', 'write'] });

      await middleware(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access when user lacks required permission', async () => {
      const middleware = requirePermission('admin');
      mockContext.get.mockReturnValue({ permissions: ['read', 'write'] });

      await expect(middleware(mockContext, mockNext)).rejects.toThrow('Insufficient permissions');
    });

    it('should check multiple permissions', async () => {
      const middleware = requirePermission(['read', 'write']);
      mockContext.get.mockReturnValue({ permissions: ['read', 'write', 'admin'] });

      await middleware(mockContext, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny if any required permission is missing', async () => {
      const middleware = requirePermission(['read', 'admin']);
      mockContext.get.mockReturnValue({ permissions: ['read', 'write'] });

      await expect(middleware(mockContext, mockNext)).rejects.toThrow('Insufficient permissions');
    });
  });
});
