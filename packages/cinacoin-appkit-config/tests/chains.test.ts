import { describe, it, expect } from 'vitest';

import {
  EVM_CHAINS,
  CHAIN_METADATA,
  getChainMetadata,
  getSupportedChainIds,
  isChainSupported,
  DEFAULT_CHAIN,
} from '../src/chains';

describe('Cinacoin Chains', () => {
  it('should define EVM chains', () => {
    expect(EVM_CHAINS).toBeDefined();
    expect(EVM_CHAINS.length).toBeGreaterThan(0);
  });

  it('should have default chain', () => {
    expect(DEFAULT_CHAIN).toBeDefined();
  });

  it('should define chain metadata', () => {
    expect(CHAIN_METADATA['eip155:1']).toBeDefined();
    expect(CHAIN_METADATA['eip155:1'].name).toBe('Ethereum');
  });

  it('should get chain metadata by ID', () => {
    const ethMetadata = getChainMetadata('eip155:1');
    expect(ethMetadata).toBeDefined();
    expect(ethMetadata?.name).toBe('Ethereum');
  });

  it('should return undefined for unknown chain', () => {
    const unknown = getChainMetadata('eip155:999999');
    expect(unknown).toBeUndefined();
  });

  it('should get all supported chain IDs', () => {
    const chainIds = getSupportedChainIds();
    expect(chainIds).toContain('eip155:1');
    expect(chainIds.length).toBeGreaterThan(0);
  });

  it('should check if chain is supported', () => {
    expect(isChainSupported('eip155:1')).toBe(true);
    expect(isChainSupported('eip155:999999')).toBe(false);
  });
});
