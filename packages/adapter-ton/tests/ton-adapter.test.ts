// eslint-disable @typescript-eslint/no-explicit-any
/**
 * TonChainAdapter unit tests.
 *
 * Validates address parsing, balance conversion, chain presets,
 * and adapter interface compliance.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TonChainAdapter,
  TON_CHAINS,
  isValidTONAddress,
  normalizeTONAddress,
  isBounceable,
  isNonBounceable,
  CinacoinError,
} from '../src/TonChainAdapter';

/* ------------------------------------------------------------------ */
/*  Address validation                                                  */
/* ------------------------------------------------------------------ */

describe('isValidTONAddress', () => {
  it('accepts valid friendly addresses', () => {
    expect(isValidTONAddress('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N')).toBe(true);
  });

  it('accepts valid raw addresses', () => {
    expect(isValidTONAddress('0:a4db3f1e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c')).toBe(true);
  });

  it('rejects invalid strings', () => {
    expect(isValidTONAddress('not-an-address')).toBe(false);
    expect(isValidTONAddress('')).toBe(false);
    expect(isValidTONAddress(123 as unknown as string)).toBe(false);
  });

  it('rejects addresses that are too short', () => {
    expect(isValidTONAddress('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB')).toBe(false);
  });
});

describe('normalizeTONAddress', () => {
  it('normalises a valid address', () => {
    const result = normalizeTONAddress('0:83dfd552e63729b472fcbcc8c45ebcc6691702558b68ec7527e1ba403a0f31a8');
    // Result should be a valid TON address
    expect(isValidTONAddress(result)).toBe(true);
  });

  it('throws on invalid input', () => {
    expect(() => normalizeTONAddress('garbage')).toThrow();
  });
});

describe('bounceable checks', () => {
  it('detects bounceable address', () => {
    expect(isBounceable('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N')).toBe(true);
  });

  it('detects non-bounceable address', () => {
    expect(isNonBounceable('UQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N')).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  Adapter interface compliance                                        */
/* ------------------------------------------------------------------ */

describe('TonChainAdapter', () => {
  let adapter: TonChainAdapter;

  beforeEach(() => {
    adapter = new TonChainAdapter();
  });

  it('has correct id and name', () => {
    expect(adapter.id).toBe('ton-adapter');
    expect(adapter.name).toBe('TON Chain Adapter');
  });

  it('implements setConnector without throwing', () => {
    expect(() => adapter.setConnector({} as unknown)).not.toThrow();
  });

  it('registers chains', () => {
    adapter.registerChains(TON_CHAINS);
    expect(adapter.findChain(0)).toBeDefined();
  });

  it('findChain returns first chain (TON has no numeric IDs)', () => {
    adapter.registerChains(TON_CHAINS);
    const chain = adapter.findChain(999);
    expect(chain).toEqual(TON_CHAINS[0]);
  });

  it('findChainById returns matching chain', () => {
    adapter.registerChains(TON_CHAINS);
    const mainnet = adapter.findChainById('ton:mainnet');
    expect(mainnet?.name).toBe('TON Mainnet');

    const testnet = adapter.findChainById('ton:testnet');
    expect(testnet?.name).toBe('TON Testnet');
  });

  it('getAccounts returns empty array before connection', async () => {
    const accounts = await adapter.getAccounts();
    expect(accounts).toEqual([]);
  });

  it('connect sets address and getAccounts returns it', async () => {
    await adapter.connect('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N');
    const accounts = await adapter.getAccounts();
    expect(accounts.length).toBe(1);
    expect(accounts[0]).toBeDefined();
  });

  it('disconnect clears address', async () => {
    await adapter.connect('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N');
    await adapter.disconnect();
    const accounts = await adapter.getAccounts();
    expect(accounts).toEqual([]);
  });

  it('rejects invalid address on connect', async () => {
    await expect(adapter.connect('not-valid')).rejects.toThrow(CinacoinError);
  });
});

/* ------------------------------------------------------------------ */
/*  Static utility methods                                              */
/* ------------------------------------------------------------------ */

describe('TonChainAdapter static utilities', () => {
  it('converts nanotons to TON', () => {
    expect(TonChainAdapter.nanotonsToTON('1000000000')).toBe('1');
    expect(TonChainAdapter.nanotonsToTON('1234567890')).toBe('1.23456789');
    expect(TonChainAdapter.nanotonsToTON('500000000')).toBe('0.5');
  });

  it('converts TON to nanotons', () => {
    expect(TonChainAdapter.tonToNanotons('1')).toBe('1000000000');
    expect(TonChainAdapter.tonToNanotons('0.5')).toBe('500000000');
    expect(TonChainAdapter.tonToNanotons(2.5)).toBe('2500000000');
  });

  it('round-trips correctly', () => {
    const original = '12.345678901';
    const nanotons = TonChainAdapter.tonToNanotons(original);
    const back = TonChainAdapter.nanotonsToTON(nanotons);
    expect(back).toBe(original);
  });
});

/* ------------------------------------------------------------------ */
/*  Chain presets                                                       */
/* ------------------------------------------------------------------ */

describe('TON_CHAINS', () => {
  it('contains mainnet and testnet', () => {
    expect(TON_CHAINS.length).toBeGreaterThanOrEqual(2);
    const mainnet = TON_CHAINS.find((c) => c.id === 'ton:mainnet');
    expect(mainnet).toBeDefined();
    expect(mainnet?.rpcUrl).toContain('toncenter.com');

    const testnet = TON_CHAINS.find((c) => c.id === 'ton:testnet');
    expect(testnet).toBeDefined();
    expect(testnet?.rpcUrl).toContain('testnet');
  });

  it('mainnet has correct native currency', () => {
    const mainnet = TON_CHAINS.find((c) => c.id === 'ton:mainnet')!;
    expect(mainnet.nativeCurrency.symbol).toBe('TON');
    expect(mainnet.nativeCurrency.decimals).toBe(9);
  });
});

/* ------------------------------------------------------------------ */
/*  Error class                                                         */
/* ------------------------------------------------------------------ */

describe('CinacoinError', () => {
  it('creates an error with message and optional code', () => {
    const err = new CinacoinError('Test error', 'TEST_CODE');
    expect(err.message).toBe('Test error');
    expect(err.code).toBe('TEST_CODE');
    expect(err.name).toBe('CinacoinError');
  });

  it('works without a code', () => {
    const err = new CinacoinError('Just a message');
    expect(err.message).toBe('Just a message');
    expect(err.code).toBeUndefined();
  });
});
