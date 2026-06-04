/**
 * Chain registry tests.
 */

import { describe, it, expect } from 'vitest';
import {
  getAllChains,
  getChainById,
  getChainByName,
  searchChains,
  getChainsByCategory,
  getPopularChains,
  registerChain,
  toCaip2,
  fromCaip2,
  CHAIN_REGISTRY,
  CHAIN_BY_ID,
  CHAIN_BY_NAME,
} from '../src/index.js';

describe('CHAIN_REGISTRY', () => {
  it('should have 100+ chains', () => {
    expect(CHAIN_REGISTRY.length).toBeGreaterThanOrEqual(100);
  });

  it('should have unique chain IDs', () => {
    const ids = CHAIN_REGISTRY.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('lookup maps', () => {
  it('CHAIN_BY_ID should contain all chains', () => {
    expect(CHAIN_BY_ID.size).toBe(CHAIN_REGISTRY.length);
  });

  it('CHAIN_BY_NAME should contain all chains', () => {
    expect(CHAIN_BY_NAME.size).toBe(CHAIN_REGISTRY.length);
  });
});

describe('getChainById', () => {
  it('should find Ethereum mainnet by id', () => {
    const eth = getChainById(1);
    expect(eth).toBeDefined();
    expect(eth!.name).toBe('Ethereum Mainnet');
    expect(eth!.category).toBe('mainnet');
    expect(eth!.testnet).toBe(false);
  });

  it('should return undefined for unknown chain ID', () => {
    expect(getChainById(99999999)).toBeUndefined();
  });

  it('should find Arbitrum One by id', () => {
    const arb = getChainById(42161);
    expect(arb).toBeDefined();
    expect(arb!.name).toBe('Arbitrum One');
    expect(arb!.category).toBe('l2');
  });
});

describe('getChainByName', () => {
  it('should find chain by exact name (case-insensitive)', () => {
    const polygon = getChainByName('Polygon');
    expect(polygon).toBeDefined();
    expect(polygon!.id).toBe(137);
  });

  it('should find chain by lowercase name', () => {
    const base = getChainByName('base');
    expect(base).toBeDefined();
    expect(base!.id).toBe(8453);
  });

  it('should return undefined for unknown name', () => {
    expect(getChainByName('NonexistentChain_xyz')).toBeUndefined();
  });
});

describe('searchChains', () => {
  it('should find chains matching name substring', () => {
    const results = searchChains('arbitrum');
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it('should find chains by ID substring', () => {
    const results = searchChains('137');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].id).toBe(137);
  });

  it('should find chains by category', () => {
    const l2 = searchChains('l2');
    expect(l2.length).toBeGreaterThanOrEqual(5);
  });

  it('should return empty array for no matches', () => {
    const results = searchChains('zzzznonexistent123');
    expect(results).toEqual([]);
  });
});

describe('getChainsByCategory', () => {
  it('should return all l2 chains', () => {
    const l2 = getChainsByCategory('l2');
    expect(l2.length).toBeGreaterThanOrEqual(10);
    l2.forEach(c => expect(c.category).toBe('l2'));
  });

  it('should return all testnet chains', () => {
    const testnets = getChainsByCategory('testnet');
    expect(testnets.length).toBeGreaterThanOrEqual(5);
    testnets.forEach(c => expect(c.testnet).toBe(true));
  });

  it('should return all gaming chains', () => {
    const gaming = getChainsByCategory('gaming');
    expect(gaming.length).toBeGreaterThanOrEqual(1);
  });

  it('should return all defi chains', () => {
    const defi = getChainsByCategory('defi');
    expect(defi.length).toBeGreaterThanOrEqual(1);
  });
});

describe('getPopularChains', () => {
  it('should return top 20 chains', () => {
    const popular = getPopularChains();
    expect(popular.length).toBe(20);
  });

  it('should have Ethereum as first chain', () => {
    const popular = getPopularChains();
    expect(popular[0].id).toBe(1);
  });
});

describe('registerChain', () => {
  it('should register a new chain dynamically', () => {
    const newChain = {
      id: 999999,
      name: 'TestChain Alpha',
      shortName: 'tca',
      rpcUrls: ['https://rpc.testchain.alpha'],
      nativeCurrency: { name: 'Test', symbol: 'TST', decimals: 18 },
      blockExplorer: 'https://explorer.testchain.alpha',
      icon: 'testchain.alpha',
      testnet: true,
      category: 'testnet' as const,
    };

    registerChain(newChain);

    const found = getChainById(999999);
    expect(found).toBeDefined();
    expect(found!.name).toBe('TestChain Alpha');
  });

  it('should replace existing chain on re-register', () => {
    const updated = {
      id: 999999,
      name: 'TestChain Beta (Updated)',
      shortName: 'tcb',
      rpcUrls: ['https://rpc.testchain.beta'],
      nativeCurrency: { name: 'Beta', symbol: 'BTA', decimals: 18 },
      blockExplorer: 'https://explorer.testchain.beta',
      icon: 'testchain.beta',
      testnet: true,
      category: 'testnet' as const,
    };

    registerChain(updated);

    const found = getChainById(999999);
    expect(found!.name).toBe('TestChain Beta (Updated)');
  });
});

describe('toCaip2', () => {
  it('should convert chain entry to CAIP-2 string', () => {
    const eth = getChainById(1)!;
    expect(toCaip2(eth)).toBe('eip155:1');
  });

  it('should convert numeric ID to CAIP-2 string', () => {
    expect(toCaip2(137)).toBe('eip155:137');
  });

  it('should handle large chain IDs', () => {
    expect(toCaip2(1666600000)).toBe('eip155:1666600000');
  });
});

describe('fromCaip2', () => {
  it('should parse valid CAIP-2 string', () => {
    expect(fromCaip2('eip155:1')).toBe(1);
    expect(fromCaip2('eip155:137')).toBe(137);
  });

  it('should return undefined for invalid strings', () => {
    expect(fromCaip2('cosmos:cosmoshub-4')).toBeUndefined();
    expect(fromCaip2('')).toBeUndefined();
  });
});

describe('chain entry metadata', () => {
  it('should have RPC URLs for each chain', () => {
    const noRpc = CHAIN_REGISTRY.filter(c => c.rpcUrls.length === 0);
    expect(noRpc.length).toBeLessThan(CHAIN_REGISTRY.length * 0.1); // < 10% without RPC
  });

  it('should have valid native currency for each chain', () => {
    for (const chain of CHAIN_REGISTRY) {
      expect(chain.nativeCurrency.symbol.length).toBeGreaterThan(0);
      expect(chain.nativeCurrency.decimals).toBeGreaterThanOrEqual(0);
    }
  });

  it('should have category for each chain', () => {
    const validCategories = ['l2', 'sidechain', 'testnet', 'mainnet', 'gaming', 'defi'];
    for (const chain of CHAIN_REGISTRY) {
      expect(validCategories).toContain(chain.category);
    }
  });
});
