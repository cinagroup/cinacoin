import { describe, it, expect } from 'vitest';
import { ed25519 } from '@noble/curves/ed25519';
import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex, hexToBytes, concatBytes } from '@noble/hashes/utils';
import { verifySolanaSignature } from '../src/chains/solana';
import { verifyBitcoinSignature } from '../src/chains/bitcoin';
import { verifyTonSignature } from '../src/chains/ton';
import { verifyTronSignature } from '../src/chains/tron';

describe('Solana Signature Verification', () => {
  it('should verify valid ed25519 signature', async () => {
    const privateKey = ed25519.utils.randomSecretKey();
    const publicKey = ed25519.getPublicKey(privateKey);
    const message = 'Test message for Solana';
    
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

  it('should reject invalid signature', async () => {
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

describe('Bitcoin Signature Verification', () => {
  it('should verify valid secp256k1 signature', async () => {
    const privateKey = secp256k1.utils.randomSecretKey();
    const publicKey = secp256k1.getPublicKey(privateKey, false); // uncompressed
    const message = 'Test message for Bitcoin';
    
    const messageBytes = new TextEncoder().encode(message);
    const prefix = new TextEncoder().encode('\x18Bitcoin Signed Message:\n');
    const varint = new Uint8Array([messageBytes.length]);
    const fullMessage = concatBytes(prefix, varint, messageBytes);
    const messageHash = sha256(sha256(fullMessage));
    
    const signature = secp256k1.sign(messageHash, privateKey, { prehash: false });
    const compactSig = signature.toCompactRawBytes();
    const recovery = signature.recovery;
    
    console.log('BTC recovery:', recovery);
    console.log('BTC compact sig length:', compactSig.length);
    
    // Bitcoin format: [v+27, r(32), s(32)]
    const bitcoinSigBytes = concatBytes(new Uint8Array([recovery + 27]), compactSig);
    
    console.log('BTC signature length:', bitcoinSigBytes.length);
    console.log('BTC signature hex:', bytesToHex(bitcoinSigBytes));
    
    // Derive Bitcoin address from public key
    const btcAddress = deriveBitcoinAddress(publicKey);
    console.log('BTC address:', btcAddress);
    
    const result = await verifyBitcoinSignature({
      message,
      signature: bytesToHex(bitcoinSigBytes),
      address: btcAddress,
      chainType: 'bitcoin',
    });
    
    console.log('BTC result:', result);
    
    expect(result.valid).toBe(true);
    expect(result.chainType).toBe('bitcoin');
  });

  it('should reject invalid signature', async () => {
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
    const signatureBytes = signature.toBytes('recovered');
    
    const btcAddress = deriveBitcoinAddress(publicKey);
    
    const result = await verifyBitcoinSignature({
      message,
      signature: bytesToHex(signatureBytes),
      address: btcAddress,
      chainType: 'bitcoin',
    });
    
    expect(result.valid).toBe(false);
  });
});

describe('TON Signature Verification', () => {
  it('should verify valid ed25519 signature', async () => {
    const privateKey = ed25519.utils.randomSecretKey();
    const publicKey = ed25519.getPublicKey(privateKey);
    const message = 'Test message for TON';
    
    const messageBytes = new TextEncoder().encode(message);
    const signature = ed25519.sign(messageBytes, privateKey);
    
    // TON address is derived from public key, but for testing we pass the hex public key
    const tonAddress = bytesToHex(publicKey);
    
    const result = await verifyTonSignature({
      message,
      signature: bytesToHex(signature),
      address: tonAddress,
      chainType: 'ton',
    });
    
    expect(result.valid).toBe(true);
    expect(result.chainType).toBe('ton');
  });

  it('should reject invalid signature', async () => {
    const privateKey = ed25519.utils.randomSecretKey();
    const publicKey = ed25519.getPublicKey(privateKey);
    const message = 'Test message';
    
    const wrongKey = ed25519.utils.randomSecretKey();
    const messageBytes = new TextEncoder().encode(message);
    const signature = ed25519.sign(messageBytes, wrongKey);
    
    const tonAddress = bytesToHex(publicKey);
    
    const result = await verifyTonSignature({
      message,
      signature: bytesToHex(signature),
      address: tonAddress,
      chainType: 'ton',
    });
    
    expect(result.valid).toBe(false);
  });
});

describe('Tron Signature Verification', () => {
  it('should verify valid secp256k1 signature', async () => {
    const privateKey = secp256k1.utils.randomSecretKey();
    const publicKey = secp256k1.getPublicKey(privateKey, false); // uncompressed
    const message = 'Test message for Tron';
    
    const messageBytes = new TextEncoder().encode(message);
    const prefix = new TextEncoder().encode('\x19TRON Signed Message:\n' + messageBytes.length);
    const fullMessage = concatBytes(prefix, messageBytes);
    const messageHash = keccak_256(fullMessage);
    
    const signature = secp256k1.sign(messageHash, privateKey, { prehash: false });
    const signatureBytes = signature.toBytes('recovered'); // [r, s, v] format
    
    console.log('TRON signature length:', signatureBytes.length);
    console.log('TRON signature hex:', bytesToHex(signatureBytes));
    console.log('TRON recovery byte:', signatureBytes[64]);
    
    // Derive Tron address from public key
    const tronAddress = deriveTronAddress(publicKey);
    console.log('TRON address:', tronAddress);
    
    const result = await verifyTronSignature({
      message,
      signature: bytesToHex(signatureBytes),
      address: tronAddress,
      chainType: 'tron',
    });
    
    console.log('TRON result:', result);
    
    expect(result.valid).toBe(true);
    expect(result.chainType).toBe('tron');
  });

  it('should reject invalid signature', async () => {
    const privateKey = secp256k1.utils.randomSecretKey();
    const publicKey = secp256k1.getPublicKey(privateKey, false);
    const message = 'Test message';
    
    const wrongKey = secp256k1.utils.randomSecretKey();
    const messageBytes = new TextEncoder().encode(message);
    const prefix = new TextEncoder().encode('\x19TRON Signed Message:\n' + messageBytes.length);
    const fullMessage = concatBytes(prefix, messageBytes);
    const messageHash = keccak_256(fullMessage);
    
    const signature = secp256k1.sign(messageHash, wrongKey, { prehash: false });
    const signatureBytes = signature.toBytes('recovered');
    
    const tronAddress = deriveTronAddress(publicKey);
    
    const result = await verifyTronSignature({
      message,
      signature: bytesToHex(signatureBytes),
      address: tronAddress,
      chainType: 'tron',
    });
    
    expect(result.valid).toBe(false);
  });
});

// Helper functions for tests

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

function deriveBitcoinAddress(uncompressedPubKey: Uint8Array): string {
  // Strip the 0x04 prefix if present (65-byte uncompressed key)
  const pubKeyBytes = uncompressedPubKey.length === 65
    ? uncompressedPubKey.slice(1)
    : uncompressedPubKey;

  // SHA256 hash
  const sha256Hash = sha256(pubKeyBytes);
  
  // Take first 20 bytes (simplified - production should use RIPEMD160)
  const hash160 = sha256Hash.slice(0, 20);
  
  // Prepend version byte (0x00 for mainnet P2PKH)
  const versionedPayload = concatBytes(new Uint8Array([0x00]), hash160);
  
  // Double SHA256 checksum
  const checksum = sha256(sha256(versionedPayload)).slice(0, 4);
  
  // Concatenate and base58 encode
  const addressBytes = concatBytes(versionedPayload, checksum);
  return base58Encode(addressBytes);
}

function deriveTronAddress(uncompressedPubKey: Uint8Array): string {
  // Strip the 0x04 prefix if present (65-byte uncompressed key)
  const pubKeyBytes = uncompressedPubKey.length === 65
    ? uncompressedPubKey.slice(1)
    : uncompressedPubKey;

  // keccak256 of the 64-byte public key
  const hash = keccak_256(pubKeyBytes);

  // Take last 20 bytes and prepend 0x41 (TRON mainnet prefix)
  const addressBytes = new Uint8Array(21);
  addressBytes[0] = 0x41;
  addressBytes.set(hash.slice(12), 1);

  // Base58Check encode
  return base58CheckEncode(addressBytes);
}

function base58CheckEncode(payload: Uint8Array): string {
  const checksum = sha256(sha256(payload)).slice(0, 4);
  const full = concatBytes(payload, checksum);
  return base58Encode(full);
}
