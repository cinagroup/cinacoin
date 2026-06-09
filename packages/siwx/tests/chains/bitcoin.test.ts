/**
 * Tests for SIWX Bitcoin chain adapter - Signature Verification.
 */

import { describe, it, expect } from 'vitest';
import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { bytesToHex, concatBytes } from '@noble/hashes/utils';
import {
  createBitcoinSignInMessage,
  verifyBitcoinSignature,
  parseBitcoinMessage,
} from '../../src/chains/bitcoin.js';
import type { SIWXVerifyInput } from '../../src/types.js';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(bytes: Uint8Array): string {
  let leadingZeros = 0;
  for (const b of bytes) {
    if (b !== 0) break;
    leadingZeros++;
  }

  let num = 0n;
  for (const b of bytes) {
    num = num * 256n + BigInt(b);
  }

  const chars: string[] = [];
  while (num > 0n) {
    const remainder = Number(num % 58n);
    chars.unshift(BASE58_ALPHABET[remainder]);
    num = num / 58n;
  }

  for (let i = 0; i < leadingZeros; i++) {
    chars.unshift('1');
  }

  return chars.join('');
}

function hash160(data: Uint8Array): Uint8Array {
  return ripemd160(sha256(data));
}

function deriveBitcoinP2PKHAddress(uncompressedPubKey: Uint8Array): string {
  // Strip the 0x04 prefix if present (65-byte uncompressed key)
  const pubKeyBytes = uncompressedPubKey.length === 65
    ? uncompressedPubKey.slice(1)
    : uncompressedPubKey;

  const pubKeyHash = hash160(pubKeyBytes);
  
  // Prepend version byte (0x00 for mainnet P2PKH)
  const versionedPayload = concatBytes(new Uint8Array([0x00]), pubKeyHash);
  
  // Double SHA256 checksum
  const checksum = sha256(sha256(versionedPayload)).slice(0, 4);
  
  // Concatenate and base58 encode
  const addressBytes = concatBytes(versionedPayload, checksum);
  return base58Encode(addressBytes);
}

describe('createBitcoinSignInMessage', () => {
  it('should generate a sign-in message for Bitcoin', () => {
    const message = createBitcoinSignInMessage({
      domain: 'btcapp.example.com',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      uri: 'https://btcapp.example.com/login',
      chainId: '000000000019d6689c085ae165831e93',
      nonce: 'bitcoin-nonce-789',
    });

    expect(message).toBeDefined();
    expect(typeof message).toBe('string');
    expect(message.length).toBeGreaterThan(0);
  });

  it('should include the Bitcoin address', () => {
    const message = createBitcoinSignInMessage({
      domain: 'example.com',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      uri: 'https://example.com',
      chainId: '000000000019d6689c085ae165831e93',
      nonce: 'nonce',
    });

    expect(message).toContain('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
  });
});

describe('parseBitcoinMessage', () => {
  it('should parse a Bitcoin sign-in message', () => {
    const message = createBitcoinSignInMessage({
      domain: 'example.com',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      uri: 'https://example.com',
      chainId: '000000000019d6689c085ae165831e93',
      nonce: 'nonce',
    });

    const parsed = parseBitcoinMessage(message);
    expect(parsed).toBeDefined();
  });
});

describe('verifyBitcoinSignature - Real Crypto', () => {
  it('should verify valid secp256k1 signature', async () => {
    const privateKey = secp256k1.utils.randomSecretKey();
    const publicKey = secp256k1.getPublicKey(privateKey, false); // uncompressed
    const message = 'Test message for Bitcoin verification';
    
    const messageBytes = new TextEncoder().encode(message);
    const prefix = new TextEncoder().encode('\x18Bitcoin Signed Message:\n');
    const varint = new Uint8Array([messageBytes.length]);
    const fullMessage = concatBytes(prefix, varint, messageBytes);
    const messageHash = sha256(sha256(fullMessage));
    
    const signature = secp256k1.sign(messageHash, privateKey, { prehash: false });
    const compactSig = signature.toCompactRawBytes();
    const recovery = signature.recovery;
    
    // Bitcoin legacy format: [v+27, r(32), s(32)]
    // For uncompressed public keys, use recovery flag 31-34 (add 31 instead of 27)
    const bitcoinSigBytes = concatBytes(new Uint8Array([recovery + 31]), compactSig);
    
    // Derive Bitcoin address from public key
    const btcAddress = deriveBitcoinP2PKHAddress(publicKey);
    
    const result = await verifyBitcoinSignature({
      message,
      signature: bytesToHex(bitcoinSigBytes),
      address: btcAddress,
      chainType: 'bitcoin',
    });
    
    expect(result.valid).toBe(true);
    expect(result.chainType).toBe('bitcoin');
  });

  it('should reject signature from wrong key', async () => {
    const privateKey = secp256k1.utils.randomSecretKey();
    const publicKey = secp256k1.getPublicKey(privateKey, false);
    const message = 'Test message';
    
    const wrongKey = secp256k1.utils.randomSecretKey();
    const messageBytes = new TextEncoder().encode(message);
    const prefix = new TextEncoder().encode('\x18Bitcoin Signed Message:\n');
    const varint = new Uint8Array([messageBytes.length]);
    const fullMessage = concatBytes(prefix, varint, messageBytes);
    const messageHash = sha256(sha256(fullMessage));
    
    const signature = secp256k1.sign(messageHash, wrongKey, { prehash: false });
    const compactSig = signature.toCompactRawBytes();
    const recovery = signature.recovery;
    
    const bitcoinSigBytes = concatBytes(new Uint8Array([recovery + 27]), compactSig);
    
    const btcAddress = deriveBitcoinP2PKHAddress(publicKey);
    
    const result = await verifyBitcoinSignature({
      message,
      signature: bytesToHex(bitcoinSigBytes),
      address: btcAddress,
      chainType: 'bitcoin',
    });
    
    expect(result.valid).toBe(false);
  });
});
