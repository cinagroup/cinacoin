import { describe, it, expect } from 'vitest';
import {
  isERC6492Signature,
  encodeValidation,
  decodeValidation,
  validateSignature,
} from '../src/erc6492';

describe('ERC-6492 Signature Detection', () => {
  it('should detect ERC-6492 magic suffix', () => {
    const magicSuffix =
      '0x6492649264926492649264926492649264926492649264926492649264926492';
    const fakeSig = '0xabcdef' + magicSuffix.slice(2);
    expect(isERC6492Signature(fakeSig)).toBe(true);
  });

  it('should reject non-ERC-6492 signatures', () => {
    expect(isERC6492Signature('0xabcdef')).toBe(false);
    expect(isERC6492Signature('not-hex')).toBe(false);
    expect(isERC6492Signature('')).toBe(false);
  });

  it('should reject non-string inputs', () => {
    expect(isERC6492Signature(null as unknown as string)).toBe(false);
    expect(isERC6492Signature(undefined as unknown as string)).toBe(false);
  });
});

describe('ERC-6492 Encode/Decode', () => {
  it('should encode and decode a signature round-trip', () => {
    const deployer = '0x1234567890abcdef1234567890abcdef12345678' as const;
    const factoryData = '0xdeadbeef' as const;
    const signature = '0xcafebabe' as const;

    const encoded = encodeValidation({
      deployer,
      factoryData,
      signature,
    });

    expect(isERC6492Signature(encoded)).toBe(true);

    const decoded = decodeValidation(encoded);
    expect(decoded.deployer.toLowerCase()).toBe(deployer.toLowerCase());
    expect(decoded.factoryData.toLowerCase()).toBe(factoryData.toLowerCase());
    expect(decoded.signature.toLowerCase()).toBe(signature.toLowerCase());
  });

  it('should throw on decoding non-ERC-6492 signature', () => {
    expect(() => decodeValidation('0xabcdef')).toThrow();
  });
});

describe('validateSignature', () => {
  it('should reject invalid signer address', async () => {
    const result = await validateSignature({
      signer: 'invalid' as `0x${string}`,
      hash: '0x1234',
      signature: '0x5678',
    });
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('signer');
  });

  it('should reject invalid hash', async () => {
    const result = await validateSignature({
      signer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as `0x${string}`,
      hash: 'invalid',
      signature: '0x5678',
    });
    expect(result.isValid).toBe(false);
  });

  it('should accept standard (non-ERC-6492) signature format', async () => {
    const result = await validateSignature({
      signer: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as `0x${string}`,
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      signature: '0xdeadbeef',
    });
    expect(result.isValid).toBe(true);
  });
});
