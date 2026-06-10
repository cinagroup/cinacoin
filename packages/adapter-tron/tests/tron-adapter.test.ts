// eslint-disable @typescript-eslint/no-explicit-any
/**
 * TronChainAdapter unit tests.
 *
 * Validates address parsing, balance conversion, chain presets,
 * and adapter interface compliance.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TronChainAdapter,
  TRON_CHAINS,
  isValidTRONAddress,
  base58ToHex,
  hexToBase58,
  CinacoinError,
} from '../src/TronChainAdapter';

/* ------------------------------------------------------------------ */
/*  Address validation                                                  */
/* ------------------------------------------------------------------ */

describe('isValidTRONAddress', () => {
  it('accepts valid base58 TRON addresses', () => {
    expect(isValidTRONAddress('TNA2B5sM6bZ4sQjQXvqYz8kFqP3xRg7WdE')).toBe(true);
    // Standard TronLink address
    expect(isValidTRONAddress('TKHuVq1oKVruCGLvqVexFs6dawKv6fQgFs')).toBe(true);
  });

  it('rejects addresses not starting with T', () => {
    expect(isValidTRONAddress('1A2B5sM6bZ4sQjQXvqYz8kFqP3xRg7WdE')).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(isValidTRONAddress('TNA2B')).toBe(false);
    expect(isValidTRONAddress('TNA2B5sM6bZ4sQjQXvqYz8kFqP3xRg7WdExx')).toBe(false);
  });

  it('rejects invalid base58 characters', () => {
    // 0, O, I, l are not valid base58
    expect(isValidTRONAddress('TNA2B5sM6bZ4sQjQXvqYz8kFqP3xRg70dE')).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(isValidTRONAddress(123 as unknown as string)).toBe(false);
    expect(isValidTRONAddress(null as unknown as string)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  Base58 ↔ Hex conversion                                             */
/* ------------------------------------------------------------------ */

describe('base58ToHex / hexToBase58', () => {
  it('round-trips correctly', () => {
    const addr = 'TKHuVq1oKVruCGLvqVexFs6dawKv6fQgFs';
    const hex = base58ToHex(addr);
    expect(hex.length).toBeGreaterThan(0);
    const back = hexToBase58(hex);
    expect(back).toBe(addr);
  });

  it('encodes zero correctly', () => {
    expect(hexToBase58('00')).toBe('1');
  });

  it('throws on invalid base58', () => {
    expect(() => base58ToHex('TNA2B5sM6bZ4sQjQXvqYz8kFqP3xRg70dE')).toThrow(CinacoinError);
  });
});

/* ------------------------------------------------------------------ */
/*  Adapter interface compliance                                        */
/* ------------------------------------------------------------------ */

describe('TronChainAdapter', () => {
  let adapter: TronChainAdapter;

  beforeEach(() => {
    adapter = new TronChainAdapter();
  });

  it('has correct id and name', () => {
    expect(adapter.id).toBe('tron-adapter');
    expect(adapter.name).toBe('TRON Chain Adapter');
  });

  it('implements setConnector without throwing', () => {
    expect(() => adapter.setConnector({} as unknown)).not.toThrow();
  });

  it('registers chains', () => {
    adapter.registerChains(TRON_CHAINS);
    expect(adapter.findChain(0)).toBeDefined();
  });

  it('findChain returns first chain', () => {
    adapter.registerChains(TRON_CHAINS);
    const chain = adapter.findChain(999);
    expect(chain).toEqual(TRON_CHAINS[0]);
  });

  it('findChainById returns matching chain', () => {
    adapter.registerChains(TRON_CHAINS);
    const mainnet = adapter.findChainById('tron:mainnet');
    expect(mainnet?.name).toBe('TRON Mainnet');

    const shasta = adapter.findChainById('tron:shasta');
    expect(shasta?.name).toBe('TRON Shasta Testnet');

    const nile = adapter.findChainById('tron:nile');
    expect(nile?.name).toBe('TRON Nile Testnet');
  });

  it('getAccounts returns empty array before connection', async () => {
    const accounts = await adapter.getAccounts();
    expect(accounts).toEqual([]);
  });

  it('connect sets address and getAccounts returns it', async () => {
    await adapter.connect('TKHuVq1oKVruCGLvqVexFs6dawKv6fQgFs');
    const accounts = await adapter.getAccounts();
    expect(accounts.length).toBe(1);
    expect(accounts[0]).toBe('TKHuVq1oKVruCGLvqVexFs6dawKv6fQgFs');
  });

  it('disconnect clears address', async () => {
    await adapter.connect('TKHuVq1oKVruCGLvqVexFs6dawKv6fQgFs');
    await adapter.disconnect();
    const accounts = await adapter.getAccounts();
    expect(accounts).toEqual([]);
  });

  it('rejects invalid address on connect', async () => {
    await expect(adapter.connect('not-valid')).rejects.toThrow(CinacoinError);
  });

  it('accepts a TronWeb-like client via setClient', () => {
    const mockClient = {
      trx: {
        getBalance: async () => 0,
        getCurrentBlock: async () => ({ number: 100 }),
        sendTransaction: async () => ({ txid: 'abc123' }),
      },
      contract: () => ({
        at: () => ({
          methods: {
            balanceOf: () => ({ call: async () => '1000000' }),
          },
        }),
      }),
      address: {
        toHex: (addr: string) => '41' + '00'.repeat(20),
      },
      fullNode: { host: 'https://api.trongrid.io' },
      setPrivateKey: () => {},
    } as unknown;

    expect(() => adapter.setClient(mockClient)).not.toThrow();
    expect(adapter.getClient()).toBe(mockClient);
  });

  it('rejects non-TronWeb client', () => {
    expect(() => adapter.setClient({ foo: 'bar' })).toThrow(CinacoinError);
  });
});

/* ------------------------------------------------------------------ */
/*  Static utility methods                                              */
/* ------------------------------------------------------------------ */

describe('TronChainAdapter static utilities', () => {
  it('converts sun to TRX', () => {
    expect(TronChainAdapter.sunToTRX('1000000')).toBe('1');
    expect(TronChainAdapter.sunToTRX('1234567')).toBe('1.234567');
    expect(TronChainAdapter.sunToTRX('500000')).toBe('0.5');
  });

  it('converts TRX to sun', () => {
    expect(TronChainAdapter.trxToSun('1')).toBe('1000000');
    expect(TronChainAdapter.trxToSun('0.5')).toBe('500000');
    expect(TronChainAdapter.trxToSun(2.5)).toBe('2500000');
  });

  it('round-trips correctly', () => {
    const original = '12.345678';
    const sun = TronChainAdapter.trxToSun(original);
    const back = TronChainAdapter.sunToTRX(sun);
    expect(back).toBe(original);
  });
});

/* ------------------------------------------------------------------ */
/*  Chain presets                                                       */
/* ------------------------------------------------------------------ */

describe('TRON_CHAINS', () => {
  it('contains mainnet, shasta, and nile', () => {
    expect(TRON_CHAINS.length).toBeGreaterThanOrEqual(3);

    const mainnet = TRON_CHAINS.find((c) => c.id === 'tron:mainnet');
    expect(mainnet).toBeDefined();
    expect(mainnet?.rpcUrl).toContain('trongrid.io');

    const shasta = TRON_CHAINS.find((c) => c.id === 'tron:shasta');
    expect(shasta).toBeDefined();
    expect(shasta?.rpcUrl).toContain('shasta');

    const nile = TRON_CHAINS.find((c) => c.id === 'tron:nile');
    expect(nile).toBeDefined();
    expect(nile?.rpcUrl).toContain('nile');
  });

  it('mainnet has correct native currency', () => {
    const mainnet = TRON_CHAINS.find((c) => c.id === 'tron:mainnet')!;
    expect(mainnet.nativeCurrency.symbol).toBe('TRX');
    expect(mainnet.nativeCurrency.decimals).toBe(6);
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
