import { describe, it, expect } from 'vitest';

describe('@cinacoin/nft-display', () => {
  it('should export NftFetcher class', async () => {
    const { NftFetcher } = await import('./fetcher.js');
    expect(NftFetcher).toBeDefined();
  });

  it('should export IPFS resolution utilities', async () => {
    const { resolveIpfsUri, resolveIpfsUriSync } = await import('./fetcher.js');
    expect(typeof resolveIpfsUri).toBe('function');
    expect(typeof resolveIpfsUriSync).toBe('function');
  });

  it('should export chain info constants', async () => {
    const { CHAIN_INFO } = await import('./types.js');
    expect(CHAIN_INFO).toBeDefined();
    expect(typeof CHAIN_INFO).toBe('object');
  });

  it('should resolve IPFS URIs synchronously', async () => {
    const { resolveIpfsUriSync } = await import('./fetcher.js');
    const result = resolveIpfsUriSync('ipfs://QmTest123');
    expect(result).toContain('QmTest123');
  });
});
