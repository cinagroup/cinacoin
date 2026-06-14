import { describe, it, expect } from 'vitest';

import {
  RECOMMENDED_WALLETS,
  getRecommendedWalletIds,
  getWalletMetadata,
  isWalletRecommended,
} from '../src/wallets';

describe('Cinacoin Wallets', () => {
  it('should define recommended wallets', () => {
    expect(RECOMMENDED_WALLETS).toBeDefined();
    expect(RECOMMENDED_WALLETS.length).toBeGreaterThan(0);
  });

  it('should include MetaMask', () => {
    const metamask = RECOMMENDED_WALLETS.find((w) => w.id === 'metamask');
    expect(metamask).toBeDefined();
    expect(metamask?.name).toBe('MetaMask');
  });

  it('should get recommended wallet IDs', () => {
    const ids = getRecommendedWalletIds();
    expect(ids).toContain('metamask');
    expect(ids).toContain('rainbow');
    expect(ids.length).toBe(RECOMMENDED_WALLETS.length);
  });

  it('should get wallet metadata by ID', () => {
    const metamask = getWalletMetadata('metamask');
    expect(metamask).toBeDefined();
    expect(metamask?.name).toBe('MetaMask');
    expect(metamask?.rdns).toBe('io.metamask');
  });

  it('should return undefined for unknown wallet', () => {
    const unknown = getWalletMetadata('unknown-wallet');
    expect(unknown).toBeUndefined();
  });

  it('should check if wallet is recommended', () => {
    expect(isWalletRecommended('metamask')).toBe(true);
    expect(isWalletRecommended('unknown-wallet')).toBe(false);
  });
});
