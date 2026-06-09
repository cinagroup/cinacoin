import { describe, it, expect } from 'vitest';
import { chainIdToCaip2, caip2ToChainId, SUPPORTED_NAMESPACES } from '../src/registry.js';

// ---------------------------------------------------------------------------
// SUPPORTED_NAMESPACES
// ---------------------------------------------------------------------------

describe('SUPPORTED_NAMESPACES', () => {
  it('contains expected namespaces', () => {
    expect(SUPPORTED_NAMESPACES).toContain('eip155');
    expect(SUPPORTED_NAMESPACES).toContain('solana');
    expect(SUPPORTED_NAMESPACES).toContain('bip122');
    expect(SUPPORTED_NAMESPACES).toContain('cosmos');
    expect(SUPPORTED_NAMESPACES).toContain('polkadot');
    expect(SUPPORTED_NAMESPACES).toContain('tron');
    expect(SUPPORTED_NAMESPACES).toContain('hedera');
    expect(SUPPORTED_NAMESPACES).toContain('near');
    expect(SUPPORTED_NAMESPACES).toContain('stacks');
    expect(SUPPORTED_NAMESPACES).toContain('tezos');
  });

  it('has exactly 10 namespaces', () => {
    expect(SUPPORTED_NAMESPACES.length).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// chainIdToCaip2
// ---------------------------------------------------------------------------

describe('chainIdToCaip2', () => {
  it('converts eip155 chain ID 1', () => {
    const r = chainIdToCaip2(1);
    expect(r.namespace).toBe('eip155');
    expect(r.reference).toBe('1');
    expect(r.toString()).toBe('eip155:1');
  });

  it('converts eip155 chain ID 137 (Polygon)', () => {
    const r = chainIdToCaip2(137);
    expect(r.namespace).toBe('eip155');
    expect(r.reference).toBe('137');
    expect(r.toString()).toBe('eip155:137');
  });

  it('converts with custom namespace', () => {
    const r = chainIdToCaip2(42, 'cosmos');
    expect(r.namespace).toBe('cosmos');
    expect(r.reference).toBe('42');
    expect(r.toString()).toBe('cosmos:42');
  });

  it('handles chain ID 0', () => {
    const r = chainIdToCaip2(0);
    expect(r.reference).toBe('0');
    expect(r.toString()).toBe('eip155:0');
  });
});

// ---------------------------------------------------------------------------
// caip2ToChainId
// ---------------------------------------------------------------------------

describe('caip2ToChainId', () => {
  it('parses eip155:1', () => {
    const r = caip2ToChainId('eip155:1');
    expect(r.namespace).toBe('eip155');
    expect(r.chainId).toBe(1);
  });

  it('parses eip155:137', () => {
    const r = caip2ToChainId('eip155:137');
    expect(r.namespace).toBe('eip155');
    expect(r.chainId).toBe(137);
  });

  it('returns NaN for non-numeric references', () => {
    const r = caip2ToChainId('solana:5eykt4UsFv8PvFHTAq3z7JYnK9G');
    expect(r.namespace).toBe('solana');
    expect(r.chainId).toBeNaN();
  });

  it('round-trips with chainIdToCaip2', () => {
    const chainId = 56;
    const caip2 = chainIdToCaip2(chainId).toString();
    const parsed = caip2ToChainId(caip2);
    expect(parsed.chainId).toBe(chainId);
    expect(parsed.namespace).toBe('eip155');
  });
});
