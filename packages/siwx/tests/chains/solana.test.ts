/**
 * Tests for SIWX Solana chain adapter - Signature Verification.
 */

import { describe, it, expect } from 'vitest';
import { ed25519 } from '@noble/curves/ed25519';
import { bytesToHex } from '@noble/hashes/utils';
import {
  createSolanaSignInMessage,
  verifySolanaSignature,
  parseSolanaMessage,
} from '../../src/chains/solana.js';
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

describe('createSolanaSignInMessage', () => {
  it('should generate a sign-in message for Solana', () => {
    const message = createSolanaSignInMessage({
      domain: 'solapp.example.com',
      address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      uri: 'https://solapp.example.com/login',
      chainId: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      nonce: 'solana-nonce-456',
    });

    expect(message).toBeDefined();
    expect(typeof message).toBe('string');
    expect(message.length).toBeGreaterThan(0);
  });

  it('should include the Solana address', () => {
    const message = createSolanaSignInMessage({
      domain: 'example.com',
      address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      uri: 'https://example.com',
      chainId: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      nonce: 'nonce',
    });

    expect(message).toContain('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
  });
});

describe('parseSolanaMessage', () => {
  it('should parse a Solana sign-in message', () => {
    const message = createSolanaSignInMessage({
      domain: 'example.com',
      address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      uri: 'https://example.com',
      chainId: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      nonce: 'nonce',
    });

    const parsed = parseSolanaMessage(message);
    expect(parsed).toBeDefined();
  });
});

describe('verifySolanaSignature - Real Crypto', () => {
  it('should verify valid ed25519 signature', async () => {
    const privateKey = ed25519.utils.randomSecretKey();
    const publicKey = ed25519.getPublicKey(privateKey);
    const message = 'Test message for Solana verification';
    
    const messageBytes = new TextEncoder().encode(message);
    const signature = ed25519.sign(messageBytes, privateKey);
    
    // Solana address IS the base58-encoded public key
    const solanaAddress = base58Encode(publicKey);
    
    const result = await verifySolanaSignature({
      message,
      signature: bytesToHex(signature),
      address: solanaAddress,
      chainType: 'solana',
    });
    
    expect(result.valid).toBe(true);
    expect(result.chainType).toBe('solana');
  });

  it('should reject signature from wrong key', async () => {
    const privateKey = ed25519.utils.randomSecretKey();
    const publicKey = ed25519.getPublicKey(privateKey);
    const message = 'Test message';
    
    const wrongKey = ed25519.utils.randomSecretKey();
    const messageBytes = new TextEncoder().encode(message);
    const signature = ed25519.sign(messageBytes, wrongKey);
    
    const solanaAddress = base58Encode(publicKey);
    
    const result = await verifySolanaSignature({
      message,
      signature: bytesToHex(signature),
      address: solanaAddress,
      chainType: 'solana',
    });
    
    expect(result.valid).toBe(false);
  });
});
