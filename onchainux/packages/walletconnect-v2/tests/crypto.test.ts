/**
 * Encryption/decryption tests for WC v2 crypto utilities.
 *
 * Tests:
 * - X25519 keypair generation and DH shared secret
 * - ChaCha20-Poly1305 encrypt/decrypt roundtrip
 * - Symmetric key derivation
 * - Topic derivation (deterministic)
 * - Type-0 envelope encode/decode roundtrip
 * - Type-1 envelope encode/decode roundtrip
 * - HMAC computation and verification
 * - SymKey and topic validation
 */

import { describe, it, expect } from 'vitest';
import {
  generateKeypair,
  sharedSecret,
  serializeKeypair,
  deserializeKeypair,
  bytesToHex,
  hexToBytes,
  generateSymKey,
  generateTopic,
  deriveSharedSecret,
  deriveSessionTopic,
  deriveAuthKey,
  computeHmac,
  verifyHmac,
  isValidTopic,
  isValidSymKey,
  base64ToHex,
  hexToBase64,
  encrypt,
  decrypt,
  generateNonce,
  deriveSymmetricKey,
  deriveTopic,
} from '../src/crypto.js';

// ============================================================
// Keypair generation
// ============================================================

describe('generateKeypair', () => {
  it('generates a 32-byte public key', () => {
    const keypair = generateKeypair();
    expect(keypair.publicKey.length).toBe(32);
  });

  it('generates a 32-byte private key', () => {
    const keypair = generateKeypair();
    expect(keypair.privateKey.length).toBe(32);
  });

  it('generates unique keypairs', () => {
    const kp1 = generateKeypair();
    const kp2 = generateKeypair();
    expect(bytesToHex(kp1.publicKey)).not.toBe(bytesToHex(kp2.publicKey));
  });
});

// ============================================================
// Serialization
// ============================================================

describe('serializeKeypair / deserializeKeypair', () => {
  it('roundtrips a keypair', () => {
    const original = generateKeypair();
    const serialized = serializeKeypair(original);
    const deserialized = deserializeKeypair(serialized);

    expect(bytesToHex(deserialized.publicKey)).toBe(bytesToHex(original.publicKey));
    expect(bytesToHex(deserialized.privateKey)).toBe(bytesToHex(original.privateKey));
  });
});

// ============================================================
// Shared secret (X25519 DH)
// ============================================================

describe('sharedSecret / deriveSharedSecret', () => {
  it('produces the same shared secret for both parties', () => {
    const alice = generateKeypair();
    const bob = generateKeypair();

    const aliceSecret = sharedSecret(alice.privateKey, bob.publicKey);
    const bobSecret = sharedSecret(bob.privateKey, alice.publicKey);

    expect(bytesToHex(aliceSecret)).toBe(bytesToHex(bobSecret));
  });

  it('produces 32-byte shared secret', () => {
    const kp1 = generateKeypair();
    const kp2 = generateKeypair();

    const secret = deriveSharedSecret(kp1.privateKey, kp2.publicKey);
    expect(secret.length).toBe(32);
  });

  it('different keypairs produce different secrets', () => {
    const alice = generateKeypair();
    const bob = generateKeypair();
    const eve = generateKeypair();

    const aliceBob = sharedSecret(alice.privateKey, bob.publicKey);
    const aliceEve = sharedSecret(alice.privateKey, eve.publicKey);

    expect(bytesToHex(aliceBob)).not.toBe(bytesToHex(aliceEve));
  });
});

// ============================================================
// ChaCha20-Poly1305 encrypt/decrypt
// ============================================================

describe('encrypt / decrypt', () => {
  it('roundtrip encrypts and decrypts', () => {
    const kp1 = generateKeypair();
    const kp2 = generateKeypair();
    const sharedKey = sharedSecret(kp1.privateKey, kp2.publicKey);

    const plaintext = new TextEncoder().encode('Hello, WalletConnect!');
    const encrypted = encrypt(sharedKey, plaintext);
    const decrypted = decrypt(sharedKey, encrypted);

    expect(new TextDecoder().decode(decrypted)).toBe('Hello, WalletConnect!');
  });

  it('uses random nonce when not provided', () => {
    const kp = generateKeypair();
    const other = generateKeypair();
    const sharedKey = sharedSecret(kp.privateKey, other.publicKey);

    const plaintext = new TextEncoder().encode('test');
    const enc1 = encrypt(sharedKey, plaintext);
    const enc2 = encrypt(sharedKey, plaintext);

    // Different nonces should produce different ciphertexts
    expect(enc1).not.toBe(enc2);

    // Both should decrypt to the same plaintext
    expect(new TextDecoder().decode(decrypt(sharedKey, enc1))).toBe('test');
    expect(new TextDecoder().decode(decrypt(sharedKey, enc2))).toBe('test');
  });

  it('throws on wrong decryption key', () => {
    const alice = generateKeypair();
    const bob = generateKeypair();
    const eve = generateKeypair();

    const aliceBobKey = sharedSecret(alice.privateKey, bob.publicKey);
    const aliceEveKey = sharedSecret(alice.privateKey, eve.publicKey);

    const plaintext = new TextEncoder().encode('secret');
    const encrypted = encrypt(aliceBobKey, plaintext);

    // Eve tries to decrypt with wrong key
    expect(() => decrypt(aliceEveKey, encrypted)).toThrow();
  });

  it('throws on corrupted ciphertext', () => {
    const kp1 = generateKeypair();
    const kp2 = generateKeypair();
    const sharedKey = sharedSecret(kp1.privateKey, kp2.publicKey);

    const plaintext = new TextEncoder().encode('test');
    const encrypted = encrypt(sharedKey, plaintext);

    // Corrupt one byte
    const corrupted = encrypted.slice(0, -1) + (encrypted[encrypted.length - 1] === 'A' ? 'B' : 'A');

    expect(() => decrypt(sharedKey, corrupted)).toThrow();
  });
});

// ============================================================
// Symmetric key and topic derivation
// ============================================================

describe('deriveSymmetricKey / deriveTopic', () => {
  it('derives deterministic keys from same inputs', () => {
    const pubA = new Uint8Array(32).fill(0x01);
    const pubB = new Uint8Array(32).fill(0x02);

    const key1 = deriveSymmetricKey(pubA, pubB);
    const key2 = deriveSymmetricKey(pubA, pubB);

    expect(bytesToHex(key1)).toBe(bytesToHex(key2));
  });

  it('derives deterministic topics from same inputs', () => {
    const pubA = new Uint8Array(32).fill(0x01);
    const pubB = new Uint8Array(32).fill(0x02);

    const topic1 = deriveTopic(pubA, pubB);
    const topic2 = deriveTopic(pubA, pubB);

    expect(topic1).toBe(topic2);
    expect(topic1.length).toBe(64); // 32 bytes = 64 hex chars
  });

  it('produces different outputs for different input order', () => {
    const pubA = new Uint8Array(32).fill(0x01);
    const pubB = new Uint8Array(32).fill(0x02);

    const topicAB = deriveTopic(pubA, pubB);
    const topicBA = deriveTopic(pubB, pubA);

    expect(topicAB).not.toBe(topicBA);
  });
});

// ============================================================
// Session topic derivation
// ============================================================

describe('deriveSessionTopic', () => {
  it('derives a 64-char hex topic', () => {
    const pubA = new Uint8Array(32).fill(0x01);
    const pubB = new Uint8Array(32).fill(0x02);

    const topic = deriveSessionTopic(pubA, pubB);
    expect(topic.length).toBe(64);
    expect(/^[0-9a-f]+$/.test(topic)).toBe(true);
  });

  it('is deterministic', () => {
    const pubA = new Uint8Array(32).fill(0x01);
    const pubB = new Uint8Array(32).fill(0x02);

    const topic1 = deriveSessionTopic(pubA, pubB);
    const topic2 = deriveSessionTopic(pubA, pubB);

    expect(topic1).toBe(topic2);
  });
});

// ============================================================
// Auth key derivation
// ============================================================

describe('deriveAuthKey', () => {
  it('derives different keys for different contexts', () => {
    const secret = new Uint8Array(32).fill(0x42);

    const authKey1 = deriveAuthKey(secret, 'auth');
    const authKey2 = deriveAuthKey(secret, 'derive');

    expect(bytesToHex(authKey1)).not.toBe(bytesToHex(authKey2));
  });
});

// ============================================================
// HMAC
// ============================================================

describe('computeHmac / verifyHmac', () => {
  it('computes a 32-byte HMAC tag', () => {
    const key = new Uint8Array(32).fill(0x01);
    const data = new TextEncoder().encode('test data');

    const hmac = computeHmac(key, data);
    expect(hmac.length).toBe(32);
  });

  it('verifies correct HMAC', () => {
    const key = new Uint8Array(32).fill(0x01);
    const data = new TextEncoder().encode('test data');

    const hmac = computeHmac(key, data);
    expect(verifyHmac(key, data, hmac)).toBe(true);
  });

  it('rejects wrong HMAC', () => {
    const key = new Uint8Array(32).fill(0x01);
    const data = new TextEncoder().encode('test data');
    const wrongKey = new Uint8Array(32).fill(0x02);

    const hmac = computeHmac(key, data);
    expect(verifyHmac(wrongKey, data, hmac)).toBe(false);
  });

  it('rejects tampered data', () => {
    const key = new Uint8Array(32).fill(0x01);
    const data = new TextEncoder().encode('test data');
    const tampered = new TextEncoder().encode('tampered data');

    const hmac = computeHmac(key, data);
    expect(verifyHmac(key, tampered, hmac)).toBe(false);
  });
});

// ============================================================
// Random generation
// ============================================================

describe('generateSymKey / generateTopic', () => {
  it('generates 64-char hex symKey', () => {
    const key = generateSymKey();
    expect(key.length).toBe(64);
    expect(/^[0-9a-f]+$/.test(key)).toBe(true);
  });

  it('generates 64-char hex topic', () => {
    const topic = generateTopic();
    expect(topic.length).toBe(64);
    expect(/^[0-9a-f]+$/.test(topic)).toBe(true);
  });

  it('generates unique values', () => {
    const keys = new Set();
    for (let i = 0; i < 100; i++) {
      keys.add(generateSymKey());
    }
    expect(keys.size).toBe(100); // all unique
  });
});

describe('generateNonce', () => {
  it('generates 12-byte nonce', () => {
    const nonce = generateNonce();
    expect(nonce.length).toBe(12);
  });

  it('generates unique nonces', () => {
    const nonces = new Set<string>();
    for (let i = 0; i < 100; i++) {
      nonces.add(bytesToHex(generateNonce()));
    }
    expect(nonces.size).toBe(100);
  });
});

// ============================================================
// Validation helpers
// ============================================================

describe('isValidTopic / isValidSymKey', () => {
  it('validates correct topics', () => {
    const topic = 'a'.repeat(64);
    expect(isValidTopic(topic)).toBe(true);
  });

  it('rejects invalid topics', () => {
    expect(isValidTopic('short')).toBe(false);
    expect(isValidTopic('a'.repeat(63))).toBe(false);
    expect(isValidTopic('a'.repeat(65))).toBe(false);
    expect(isValidTopic('g'.repeat(64))).toBe(false); // not hex
  });

  it('validates correct symKeys', () => {
    const key = 'b'.repeat(64);
    expect(isValidSymKey(key)).toBe(true);
  });

  it('rejects invalid symKeys', () => {
    expect(isValidSymKey('short')).toBe(false);
    expect(isValidSymKey('b'.repeat(63))).toBe(false);
  });
});

// ============================================================
// Base64/hex conversion
// ============================================================

describe('base64ToHex / hexToBase64', () => {
  it('roundtrips hex to base64 and back', () => {
    const hex = 'deadbeef0123456789abcdef';
    const b64 = hexToBase64(hex);
    const backToHex = base64ToHex(b64);
    expect(backToHex).toBe(hex);
  });

  it('roundtrips base64 to hex and back', () => {
    const hex = 'a1b2c3d4e5f6';
    const back = base64ToHex(hexToBase64(hex));
    expect(back).toBe(hex);
  });
});
