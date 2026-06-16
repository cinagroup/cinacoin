import { describe, it, expect } from 'vitest';

describe('@cinacoin/keys-server', () => {
  it('should export KeyManager class', async () => {
    const { KeyManager } = await import('./KeyManager');
    expect(KeyManager).toBeDefined();
  });

  it('should export getEnv function', async () => {
    const { getEnv } = await import('./env');
    expect(getEnv).toBeDefined();
    expect(typeof getEnv).toBe('function');
  });

  it('should export types', async () => {
    const mod = await import('./index');
    expect(mod.KeyManager).toBeDefined();
    expect(mod.getEnv).toBeDefined();
  });
});
