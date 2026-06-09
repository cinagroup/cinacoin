/**
 * Tests for password hashing and verification
 */
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, needsRehash } from '../src/lib/password';

describe('Password Library', () => {
  describe('hashPassword', () => {
    it('should hash a valid password', async () => {
      const hash = await hashPassword('TestPass123');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      // Argon2 hashes start with $argon2
      expect(hash.startsWith('$argon2')).toBe(true);
    });

    it('should produce different hashes for same password (salted)', async () => {
      const hash1 = await hashPassword('TestPass123');
      const hash2 = await hashPassword('TestPass123');
      expect(hash1).not.toBe(hash2);
    });

    it('should reject short passwords', async () => {
      await expect(hashPassword('short')).rejects.toThrow('at least 8 characters');
    });

    it('should reject empty passwords', async () => {
      await expect(hashPassword('')).rejects.toThrow('at least 8 characters');
    });

    it('should reject very long passwords', async () => {
      const longPassword = 'a'.repeat(129);
      await expect(hashPassword(longPassword)).rejects.toThrow('must not exceed 128');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'SecurePass456';
      const hash = await hashPassword(password);
      const result = await verifyPassword(hash, password);
      expect(result).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await hashPassword('CorrectPass789');
      const result = await verifyPassword(hash, 'WrongPass000');
      expect(result).toBe(false);
    });

    it('should return false for invalid hash format', async () => {
      const result = await verifyPassword('not-a-hash', 'TestPass123');
      expect(result).toBe(false);
    });
  });

  describe('needsRehash', () => {
    it('should not need rehash for freshly hashed password', async () => {
      const hash = await hashPassword('TestPass123');
      const result = await needsRehash(hash);
      expect(result).toBe(false);
    });
  });
});
