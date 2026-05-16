/**
 * Tests for wallet derivation from social identity.
 */

import { describe, it, expect } from 'vitest';
import {
  deriveSeedFromIdentity,
  deriveAddressFromSeed,
  deriveAddressFromEmail,
  deriveAddressFromProvider,
  generateRandomMnemonic,
} from '../../src/wallet-derivation.js';

describe('Wallet Derivation', () => {
  describe('deriveSeedFromIdentity', () => {
    it('should derive a 32-byte seed from provider ID and identifier', () => {
      const seed = deriveSeedFromIdentity('google:12345', 'user@example.com');
      expect(Buffer.isBuffer(seed)).toBe(true);
      expect(seed.length).toBe(32);
    });

    it('should produce deterministic seeds for the same input', () => {
      const seed1 = deriveSeedFromIdentity('google:12345', 'user@example.com');
      const seed2 = deriveSeedFromIdentity('google:12345', 'user@example.com');
      expect(seed1.toString('hex')).toBe(seed2.toString('hex'));
    });

    it('should produce different seeds for different provider IDs', () => {
      const seed1 = deriveSeedFromIdentity('google:12345', 'user@example.com');
      const seed2 = deriveSeedFromIdentity('apple:67890', 'user@example.com');
      expect(seed1.toString('hex')).not.toBe(seed2.toString('hex'));
    });

    it('should produce different seeds for different identifiers', () => {
      const seed1 = deriveSeedFromIdentity('google:12345', 'user1@example.com');
      const seed2 = deriveSeedFromIdentity('google:12345', 'user2@example.com');
      expect(seed1.toString('hex')).not.toBe(seed2.toString('hex'));
    });

    it('should use custom derivation key when provided', () => {
      const seed1 = deriveSeedFromIdentity('google:12345', 'user@example.com', 'custom-key');
      const seed2 = deriveSeedFromIdentity('google:12345', 'user@example.com', 'another-key');
      expect(seed1.toString('hex')).not.toBe(seed2.toString('hex'));
    });

    it('should use default salt when no derivation key is provided', () => {
      const seed = deriveSeedFromIdentity('google:12345', 'user@example.com');
      expect(Buffer.isBuffer(seed)).toBe(true);
    });
  });

  describe('deriveAddressFromSeed', () => {
    it('should derive an address from a seed', () => {
      const seed = Buffer.alloc(32, 0x42);
      const result = deriveAddressFromSeed(seed);

      expect(result.address).toBeDefined();
      expect(result.publicKey).toBeDefined();
      expect(typeof result.address).toBe('string');
      expect(typeof result.publicKey).toBe('string');
    });

    it('should produce a valid-looking Ethereum address (0x + 40 hex chars)', () => {
      const seed = Buffer.alloc(32, 0x42);
      const result = deriveAddressFromSeed(seed);

      expect(result.address).toMatch(/^0x[0-9a-f]{40}$/);
    });

    it('should produce deterministic addresses for the same seed', () => {
      const seed = Buffer.alloc(32, 0x42);
      const result1 = deriveAddressFromSeed(seed);
      const result2 = deriveAddressFromSeed(seed);
      expect(result1.address).toBe(result2.address);
      expect(result1.publicKey).toBe(result2.publicKey);
    });

    it('should produce different addresses for different seeds', () => {
      const seed1 = Buffer.alloc(32, 0x42);
      const seed2 = Buffer.alloc(32, 0x43);
      const result1 = deriveAddressFromSeed(seed1);
      const result2 = deriveAddressFromSeed(seed2);
      expect(result1.address).not.toBe(result2.address);
    });

    it('should produce a 64-byte hex public key', () => {
      const seed = Buffer.alloc(32, 0x42);
      const result = deriveAddressFromSeed(seed);
      expect(result.publicKey).toMatch(/^0x[0-9a-f]{64}$/);
    });
  });

  describe('deriveAddressFromEmail', () => {
    it('should derive an address from an email', () => {
      const result = deriveAddressFromEmail('user@example.com');
      expect(result.address).toMatch(/^0x[0-9a-f]{40}$/);
      expect(result.publicKey).toBeDefined();
    });

    it('should produce deterministic addresses for the same email', () => {
      const result1 = deriveAddressFromEmail('user@example.com');
      const result2 = deriveAddressFromEmail('user@example.com');
      expect(result1.address).toBe(result2.address);
    });

    it('should produce different addresses for different emails', () => {
      const result1 = deriveAddressFromEmail('alice@example.com');
      const result2 = deriveAddressFromEmail('bob@example.com');
      expect(result1.address).not.toBe(result2.address);
    });

    it('should normalize email to lowercase', () => {
      const result1 = deriveAddressFromEmail('User@Example.COM');
      const result2 = deriveAddressFromEmail('user@example.com');
      expect(result1.address).toBe(result2.address);
    });

    it('should trim whitespace from email', () => {
      const result1 = deriveAddressFromEmail('  user@example.com  ');
      const result2 = deriveAddressFromEmail('user@example.com');
      expect(result1.address).toBe(result2.address);
    });

    it('should accept custom salt', () => {
      const result1 = deriveAddressFromEmail('user@example.com', 'custom-salt');
      const result2 = deriveAddressFromEmail('user@example.com', 'other-salt');
      expect(result1.address).not.toBe(result2.address);
    });
  });

  describe('deriveAddressFromProvider', () => {
    it('should derive an address from provider identity', () => {
      const result = deriveAddressFromProvider('google', '12345');
      expect(result.address).toMatch(/^0x[0-9a-f]{40}$/);
    });

    it('should produce deterministic addresses for same identity', () => {
      const result1 = deriveAddressFromProvider('google', '12345');
      const result2 = deriveAddressFromProvider('google', '12345');
      expect(result1.address).toBe(result2.address);
    });

    it('should produce different addresses for different providers', () => {
      const result1 = deriveAddressFromProvider('google', '12345');
      const result2 = deriveAddressFromProvider('apple', '12345');
      expect(result1.address).not.toBe(result2.address);
    });

    it('should produce different addresses when email is included', () => {
      const result1 = deriveAddressFromProvider('google', '12345');
      const result2 = deriveAddressFromProvider('google', '12345', 'user@example.com');
      expect(result1.address).not.toBe(result2.address);
    });

    it('should work without email parameter', () => {
      const result = deriveAddressFromProvider('twitter', 'user:67890');
      expect(result.address).toMatch(/^0x[0-9a-f]{40}$/);
    });
  });

  describe('generateRandomMnemonic', () => {
    it('should generate a 128-bit mnemonic by default (32 hex chars)', () => {
      const mnemonic = generateRandomMnemonic();
      expect(typeof mnemonic).toBe('string');
      expect(mnemonic.length).toBe(32);
      expect(mnemonic).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate 128-bit mnemonic explicitly', () => {
      const mnemonic = generateRandomMnemonic(128);
      expect(mnemonic.length).toBe(32);
    });

    it('should generate 192-bit mnemonic (48 hex chars)', () => {
      const mnemonic = generateRandomMnemonic(192);
      expect(mnemonic.length).toBe(48);
    });

    it('should generate 256-bit mnemonic (64 hex chars)', () => {
      const mnemonic = generateRandomMnemonic(256);
      expect(mnemonic.length).toBe(64);
    });

    it('should generate different mnemonics each time', () => {
      const m1 = generateRandomMnemonic();
      const m2 = generateRandomMnemonic();
      expect(m1).not.toBe(m2);
    });

    it('should produce valid hex characters', () => {
      const mnemonic = generateRandomMnemonic(256);
      expect(mnemonic).toMatch(/^[0-9a-f]+$/);
    });
  });
});
