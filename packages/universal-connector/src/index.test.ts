import { describe, it, expect } from 'vitest';

describe('@cinacoin/universal-connector', () => {
  it('should export UniversalConnector', async () => {
    const mod = await import('./index');
    expect(mod.UniversalConnector).toBeDefined();
  });

  it('should export BaseAdapter', async () => {
    const { BaseAdapter } = await import('./adapters/BaseAdapter');
    expect(BaseAdapter).toBeDefined();
  });

  it('should export ChainManager', async () => {
    const { ChainManager } = await import('./chains/ChainManager');
    expect(ChainManager).toBeDefined();
  });

  it('should export adapter registry functions', async () => {
    const { registerAdapter, getAdapter, listAdapters } = await import('./adapters');
    expect(typeof registerAdapter).toBe('function');
    expect(typeof getAdapter).toBe('function');
    expect(typeof listAdapters).toBe('function');
  });

  it('should export chain query functions', async () => {
    const { getAllChains, getChainById, getChainsByCategory } = await import('./chains');
    expect(typeof getAllChains).toBe('function');
    expect(typeof getChainById).toBe('function');
    expect(typeof getChainsByCategory).toBe('function');
  });

  it('should export LazyAdapterRegistry', async () => {
    const { LazyAdapterRegistry, createLazyAdapterRegistry } = await import('./adapters/lazy.js');
    expect(LazyAdapterRegistry).toBeDefined();
    expect(typeof createLazyAdapterRegistry).toBe('function');
  });
});
