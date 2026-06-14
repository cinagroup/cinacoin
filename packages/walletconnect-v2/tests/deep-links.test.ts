/**
 * Deep Links Tests
 *
 * Tests the deep link utilities:
 * - Building wallet deep links
 * - Universal link generation
 * - Wallet installation detection
 * - WalletDeepLink interface methods
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildWalletDeepLinks,
  buildUniversalLink,
  detectInstalledWallets,
} from '../src/deep-links.js';
import type { WalletDeepLink } from '../src/deep-links.js';

// ============================================================
// Test Data
// ============================================================

const SAMPLE_WC_URI = 'wc:topic123@2?relay-protocol=irn&relay-data=abc123';

// ============================================================
// buildWalletDeepLinks Tests
// ============================================================

describe('buildWalletDeepLinks', () => {
  it('should return an array of WalletDeepLink objects', () => {
    const links = buildWalletDeepLinks(SAMPLE_WC_URI);
    expect(Array.isArray(links)).toBe(true);
    expect(links.length).toBeGreaterThan(0);
  });

  it('should include required fields for each wallet', () => {
    const links = buildWalletDeepLinks(SAMPLE_WC_URI);
    
    links.forEach((link: WalletDeepLink) => {
      expect(link.id).toBeDefined();
      expect(typeof link.id).toBe('string');
      expect(link.name).toBeDefined();
      expect(typeof link.name).toBe('string');
      expect(link.icon).toBeDefined();
      expect(typeof link.icon).toBe('string');
      expect(typeof link.buildLink).toBe('function');
      expect(typeof link.isInstalled).toBe('function');
    });
  });

  it('should include known wallets', () => {
    const links = buildWalletDeepLinks(SAMPLE_WC_URI);
    const ids = links.map((l) => l.id);
    
    expect(ids).toContain('metamask');
    expect(ids).toContain('rainbow');
    expect(ids).toContain('coinbase');
  });

  it('should generate correct deep links via buildLink', () => {
    const links = buildWalletDeepLinks(SAMPLE_WC_URI);
    const metamask = links.find((l) => l.id === 'metamask');
    
    expect(metamask).toBeDefined();
    const deepLink = metamask!.buildLink(SAMPLE_WC_URI);
    expect(deepLink).toContain('metamask://');
    expect(deepLink).toContain('wc?uri=');
    expect(deepLink).toContain(encodeURIComponent(SAMPLE_WC_URI));
  });

  it('should handle wallets without deep link schemes', () => {
    const links = buildWalletDeepLinks(SAMPLE_WC_URI);
    
    // All wallets should still generate a link
    links.forEach((link) => {
      const generated = link.buildLink(SAMPLE_WC_URI);
      expect(generated).toBeDefined();
      expect(typeof generated).toBe('string');
      expect(generated.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================
// buildUniversalLink Tests
// ============================================================

describe('buildUniversalLink', () => {
  it('should build universal link for known wallet', () => {
    const link = buildUniversalLink(SAMPLE_WC_URI, 'metamask');
    expect(link).toBeDefined();
    expect(link).toContain('https://metamask.app.link');
    expect(link).toContain('wc?uri=');
    expect(link).toContain(encodeURIComponent(SAMPLE_WC_URI));
  });

  it('should build universal link for rainbow', () => {
    const link = buildUniversalLink(SAMPLE_WC_URI, 'rainbow');
    expect(link).toBeDefined();
    expect(link).toContain('https://rnbwapp.com');
  });

  it('should return undefined for unknown wallet', () => {
    const link = buildUniversalLink(SAMPLE_WC_URI, 'unknown-wallet-xyz');
    expect(link).toBeUndefined();
  });

  it('should encode URI properly', () => {
    const link = buildUniversalLink(SAMPLE_WC_URI, 'metamask');
    expect(link).toBeDefined();
    
    // Extract the uri parameter
    const uriParam = link!.split('uri=')[1];
    expect(uriParam).toBeDefined();
    
    // Should be URL encoded
    const decoded = decodeURIComponent(uriParam);
    expect(decoded).toBe(SAMPLE_WC_URI);
  });
});

// ============================================================
// detectInstalledWallets Tests
// ============================================================

describe('detectInstalledWallets', () => {
  beforeEach(() => {
    // Reset window object
    vi.stubGlobal('window', undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return empty array in non-browser environment', () => {
    const installed = detectInstalledWallets();
    expect(Array.isArray(installed)).toBe(true);
    expect(installed.length).toBe(0);
  });

  it('should detect MetaMask when ethereum.isMetaMask is true', () => {
    vi.stubGlobal('window', {
      ethereum: { isMetaMask: true },
    });
    
    const installed = detectInstalledWallets();
    expect(installed).toContain('metamask');
  });

  it('should detect Coinbase Wallet', () => {
    vi.stubGlobal('window', {
      ethereum: { isCoinbaseWallet: true },
    });
    
    const installed = detectInstalledWallets();
    expect(installed).toContain('coinbase');
  });

  it('should detect Trust Wallet', () => {
    vi.stubGlobal('window', {
      trustwallet: {},
    });
    
    const installed = detectInstalledWallets();
    expect(installed).toContain('trust');
  });

  it('should detect Phantom', () => {
    vi.stubGlobal('window', {
      phantom: { solana: { isPhantom: true } },
    });
    
    const installed = detectInstalledWallets();
    expect(installed).toContain('phantom');
  });

  it('should detect multiple wallets', () => {
    vi.stubGlobal('window', {
      ethereum: { isMetaMask: true, isCoinbaseWallet: true },
      trustwallet: {},
    });
    
    const installed = detectInstalledWallets();
    expect(installed).toContain('metamask');
    expect(installed).toContain('coinbase');
    expect(installed).toContain('trust');
  });

  it('should return empty array when no wallets detected', () => {
    vi.stubGlobal('window', {
      ethereum: {},
    });
    
    const installed = detectInstalledWallets();
    expect(installed.length).toBe(0);
  });
});

// ============================================================
// WalletDeepLink Interface Tests
// ============================================================

describe('WalletDeepLink interface', () => {
  it('should have correct wallet metadata', () => {
    const links = buildWalletDeepLinks(SAMPLE_WC_URI);
    const metamask = links.find((l) => l.id === 'metamask');
    
    expect(metamask).toBeDefined();
    expect(metamask!.name).toBe('MetaMask');
    expect(metamask!.icon).toContain('metamask');
  });

  it('should generate different links for different URIs', () => {
    const links1 = buildWalletDeepLinks('wc:uri1@2');
    const links2 = buildWalletDeepLinks('wc:uri2@2');
    
    const metamask1 = links1.find((l) => l.id === 'metamask');
    const metamask2 = links2.find((l) => l.id === 'metamask');
    
    expect(metamask1!.buildLink('wc:uri1@2')).not.toBe(metamask2!.buildLink('wc:uri2@2'));
  });

  it('isInstalled should return false in non-browser environment', () => {
    const links = buildWalletDeepLinks(SAMPLE_WC_URI);
    const metamask = links.find((l) => l.id === 'metamask');
    
    expect(metamask!.isInstalled()).toBe(false);
  });
});
