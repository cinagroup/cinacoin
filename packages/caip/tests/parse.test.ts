import { describe, it, expect } from 'vitest';
import { parseCaip2, parseCaip10, parseCaip19, formatCaip2, formatCaip10 } from '../src/parse.js';
import { isValidCaip2, isValidCaip10, isValidCaip19 } from '../src/validation.js';

// ---------------------------------------------------------------------------
// parseCaip2
// ---------------------------------------------------------------------------

describe('parseCaip2', () => {
  it('parses eip155:1', () => {
    const r = parseCaip2('eip155:1');
    expect(r.namespace).toBe('eip155');
    expect(r.reference).toBe('1');
    expect(r.toString()).toBe('eip155:1');
  });

  it('parses solana mainnet', () => {
    const r = parseCaip2('solana:5eykt4UsFv8PvFHTAq3z7JYnK9G');
    expect(r.namespace).toBe('solana');
    expect(r.reference).toBe('5eykt4UsFv8PvFHTAq3z7JYnK9G');
    expect(r.toString()).toBe('solana:5eykt4UsFv8PvFHTAq3z7JYnK9G');
  });

  it('parses bip122:000000000019d6689c085ae165831e93', () => {
    const r = parseCaip2('bip122:000000000019d6689c085ae165831e93');
    expect(r.namespace).toBe('bip122');
    expect(r.reference).toBe('000000000019d6689c085ae165831e93');
  });

  it('throws on invalid format', () => {
    expect(() => parseCaip2('invalid')).toThrow();
    expect(() => parseCaip2('')).toThrow();
    expect(() => parseCaip2(':123')).toThrow();
    expect(() => parseCaip2('eip155:')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// parseCaip10
// ---------------------------------------------------------------------------

describe('parseCaip10', () => {
  it('parses eip155:1:0xabc123', () => {
    const r = parseCaip10('eip155:1:0xabc123');
    expect(r.chainId.namespace).toBe('eip155');
    expect(r.chainId.reference).toBe('1');
    expect(r.address).toBe('0xabc123');
    expect(r.toString()).toBe('eip155:1:0xabc123');
  });

  it('parses bitcoin address', () => {
    const r = parseCaip10('bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6');
    expect(r.chainId.namespace).toBe('bip122');
    expect(r.address).toBe('128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6');
    expect(r.toString()).toBe('bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6');
  });

  it('throws on invalid format', () => {
    expect(() => parseCaip10('eip155:1')).toThrow();
    expect(() => parseCaip10('')).toThrow();
    expect(() => parseCaip10(':1:0xabc')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// parseCaip19
// ---------------------------------------------------------------------------

describe('parseCaip19', () => {
  it('parses erc20 token', () => {
    const r = parseCaip19('eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
    expect(r.chainId.namespace).toBe('eip155');
    expect(r.chainId.reference).toBe('1');
    expect(r.assetNamespace).toBe('erc20');
    expect(r.assetReference).toBe('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
    expect(r.toString()).toBe('eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
  });

  it('parses slip44 native asset', () => {
    const r = parseCaip19('eip155:1/slip44:60');
    expect(r.assetNamespace).toBe('slip44');
    expect(r.assetReference).toBe('60');
  });

  it('throws on invalid format', () => {
    expect(() => parseCaip19('eip155:1')).toThrow();
    expect(() => parseCaip19('')).toThrow();
    expect(() => parseCaip19('eip155:1/erc20')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// format helpers
// ---------------------------------------------------------------------------

describe('formatCaip2', () => {
  it('formats a Caip2ChainId', () => {
    const chainId = parseCaip2('eip155:137');
    expect(formatCaip2(chainId)).toBe('eip155:137');
  });
});

describe('formatCaip10', () => {
  it('formats a Caip10AccountId', () => {
    const account = parseCaip10('eip155:137:0xdeadbeef');
    expect(formatCaip10(account)).toBe('eip155:137:0xdeadbeef');
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('isValidCaip2', () => {
  it('returns true for valid CAIP-2', () => {
    expect(isValidCaip2('eip155:1')).toBe(true);
    expect(isValidCaip2('solana:5eykt4UsFv8PvFHTAq3z7JYnK9G')).toBe(true);
    expect(isValidCaip2('bip122:000000000019d6689c085ae165831e93')).toBe(true);
  });

  it('returns false for invalid CAIP-2', () => {
    expect(isValidCaip2('invalid')).toBe(false);
    expect(isValidCaip2('')).toBe(false);
    expect(isValidCaip2(':123')).toBe(false);
  });
});

describe('isValidCaip10', () => {
  it('returns true for valid CAIP-10', () => {
    expect(isValidCaip10('eip155:1:0xabc123')).toBe(true);
  });

  it('returns false for invalid CAIP-10', () => {
    expect(isValidCaip10('eip155:1')).toBe(false);
    expect(isValidCaip10('')).toBe(false);
  });
});

describe('isValidCaip19', () => {
  it('returns true for valid CAIP-19', () => {
    expect(isValidCaip19('eip155:1/erc20:0xabc123')).toBe(true);
    expect(isValidCaip19('eip155:1/slip44:60')).toBe(true);
  });

  it('returns false for invalid CAIP-19', () => {
    expect(isValidCaip19('eip155:1')).toBe(false);
    expect(isValidCaip19('eip155:1/erc20')).toBe(false);
    expect(isValidCaip19('')).toBe(false);
  });
});
