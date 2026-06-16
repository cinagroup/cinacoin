import { describe, it, expect } from 'vitest';

describe('@cinacoin/wallet-registry', () => {
  it('should export registry data', async () => {
    const { WALLET_REGISTRY, WALLET_COUNT } = await import('./registry.js');
    expect(Array.isArray(WALLET_REGISTRY)).toBe(true);
    expect(WALLET_COUNT).toBeGreaterThan(0);
  });

  it('should export query API functions', async () => {
    const mod = await import('./api.js');
    expect(typeof mod.getAllWallets).toBe('function');
    expect(typeof mod.getWalletById).toBe('function');
    expect(typeof mod.searchWallets).toBe('function');
    expect(typeof mod.filterWallets).toBe('function');
  });

  it('should return wallets from getAllWallets', async () => {
    const { getAllWallets } = await import('./api.js');
    const wallets = getAllWallets();
    expect(Array.isArray(wallets)).toBe(true);
    expect(wallets.length).toBeGreaterThan(0);
  });

  it('should look up wallet by id', async () => {
    const { getWalletById } = await import('./api.js');
    const mm = getWalletById('metamask');
    expect(mm).toBeDefined();
    expect(mm?.id).toBe('metamask');
  });

  it('should search wallets by name', async () => {
    const { searchWallets } = await import('./api.js');
    const results = searchWallets('phantom');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should filter wallets by chain family', async () => {
    const { filterWallets } = await import('./api.js');
    const evmWallets = filterWallets({ chainFamily: 'evm' });
    expect(Array.isArray(evmWallets)).toBe(true);
    expect(evmWallets.length).toBeGreaterThan(0);
  });
});
