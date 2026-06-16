import { describe, it, expect } from 'vitest';

describe('@cinacoin/safe-decoder', () => {
  it('should export SafeDecoder class', async () => {
    const { SafeDecoder } = await import('./decoder.js');
    expect(SafeDecoder).toBeDefined();
  });

  it('should export type definitions', async () => {
    const mod = await import('./index');
    expect(mod.SafeDecoder).toBeDefined();
  });

  it('should be instantiable', async () => {
    const { SafeDecoder } = await import('./decoder.js');
    const decoder = new SafeDecoder();
    expect(decoder).toBeDefined();
  });
});
