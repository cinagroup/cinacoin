import { describe, it, expect } from 'vitest';

describe('@cinacoin/relay-server', () => {
  it('should export RelayServer class', async () => {
    const { RelayServer } = await import('./RelayServer');
    expect(RelayServer).toBeDefined();
  });

  it('should export all from index', async () => {
    const mod = await import('./index');
    expect(mod.RelayServer).toBeDefined();
  });
});
