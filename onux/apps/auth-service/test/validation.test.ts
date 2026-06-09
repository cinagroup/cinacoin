/**
 * Tests for input validation schemas
 */
import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  updateProfileSchema,
  validate,
} from '../src/lib/validation';

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const result = validate(registerSchema, {
        email: 'test@example.com',
        password: 'TestPass123',
        username: 'testuser',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid data with optional displayName', () => {
      const result = validate(registerSchema, {
        email: 'test@example.com',
        password: 'TestPass123',
        username: 'testuser',
        displayName: 'Test User',
      });
      expect(result.success).toBe(true);
    });

    it('should normalize email to lowercase', () => {
      const result = validate(registerSchema, {
        email: 'TEST@Example.COM',
        password: 'TestPass123',
        username: 'testuser',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should reject invalid email', () => {
      const result = validate(registerSchema, {
        email: 'not-an-email',
        password: 'TestPass123',
        username: 'testuser',
      });
      expect(result.success).toBe(false);
    });

    it('should reject weak password (no uppercase)', () => {
      const result = validate(registerSchema, {
        email: 'test@example.com',
        password: 'testpass123',
        username: 'testuser',
      });
      expect(result.success).toBe(false);
    });

    it('should reject weak password (no digit)', () => {
      const result = validate(registerSchema, {
        email: 'test@example.com',
        password: 'TestPassword',
        username: 'testuser',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = validate(registerSchema, {
        email: 'test@example.com',
        password: 'Ab1',
        username: 'testuser',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid username', () => {
      const result = validate(registerSchema, {
        email: 'test@example.com',
        password: 'TestPass123',
        username: 'test user!',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short username', () => {
      const result = validate(registerSchema, {
        email: 'test@example.com',
        password: 'TestPass123',
        username: 'ab',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing fields', () => {
      const result = validate(registerSchema, {
        email: 'test@example.com',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const result = validate(loginSchema, {
        email: 'test@example.com',
        password: 'TestPass123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const result = validate(loginSchema, {
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing email', () => {
      const result = validate(loginSchema, {
        password: 'TestPass123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('refreshSchema', () => {
    it('should accept valid refresh token', () => {
      const result = validate(refreshSchema, {
        refreshToken: 'some.jwt.token',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty refresh token', () => {
      const result = validate(refreshSchema, {
        refreshToken: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('should accept valid password change', () => {
      const result = validate(changePasswordSchema, {
        currentPassword: 'OldPass123',
        newPassword: 'NewPass456',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty current password', () => {
      const result = validate(changePasswordSchema, {
        currentPassword: '',
        newPassword: 'NewPass456',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateProfileSchema', () => {
    it('should accept partial updates', () => {
      const result = validate(updateProfileSchema, {
        username: 'newname',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty update', () => {
      const result = validate(updateProfileSchema, {});
      expect(result.success).toBe(true);
    });
  });
});
