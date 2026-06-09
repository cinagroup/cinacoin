/**
 * Tests for types and utility functions
 */
import { describe, it, expect } from 'vitest';
import { toPublicUser } from '../src/lib/types';
import type { UserRecord } from '../src/lib/types';

describe('Types', () => {
  describe('toPublicUser', () => {
    const mockUserRecord: UserRecord = {
      id: 'test-id-123',
      email: 'test@example.com',
      username: 'testuser',
      display_name: 'Test User',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$...',
      role: 'user',
      status: 'active',
      email_verified_at: '2026-01-01T00:00:00Z',
      last_login_at: '2026-06-08T12:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-06-08T12:00:00Z',
    };

    it('should convert user record to public user', () => {
      const publicUser = toPublicUser(mockUserRecord);
      
      expect(publicUser.id).toBe('test-id-123');
      expect(publicUser.email).toBe('test@example.com');
      expect(publicUser.username).toBe('testuser');
      expect(publicUser.displayName).toBe('Test User');
      expect(publicUser.role).toBe('user');
      expect(publicUser.status).toBe('active');
      expect(publicUser.emailVerified).toBe(true);
      expect(publicUser.lastLoginAt).toBe('2026-06-08T12:00:00Z');
      expect(publicUser.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('should not include password_hash in public user', () => {
      const publicUser = toPublicUser(mockUserRecord);
      expect((publicUser as any).password_hash).toBeUndefined();
    });

    it('should set emailVerified to false when email_verified_at is null', () => {
      const unverifiedUser: UserRecord = {
        ...mockUserRecord,
        email_verified_at: null,
      };
      const publicUser = toPublicUser(unverifiedUser);
      expect(publicUser.emailVerified).toBe(false);
    });

    it('should handle null display_name', () => {
      const noDisplayName: UserRecord = {
        ...mockUserRecord,
        display_name: null,
      };
      const publicUser = toPublicUser(noDisplayName);
      expect(publicUser.displayName).toBeNull();
    });

    it('should handle null last_login_at', () => {
      const noLogin: UserRecord = {
        ...mockUserRecord,
        last_login_at: null,
      };
      const publicUser = toPublicUser(noLogin);
      expect(publicUser.lastLoginAt).toBeNull();
    });
  });
});
