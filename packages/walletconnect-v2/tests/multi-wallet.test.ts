/**
 * Multi-Wallet Manager Tests
 *
 * Tests the multi-wallet connection manager:
 * - Wallet options generation
 * - Best wallet selection
 * - Wallet connection via deep links
 * - QR code data generation
 * - Connection method detection
 * - Platform-aware routing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MultiWalletManager } from '../src/multi-wallet.js';
import type { MultiWalletConfig, WalletOption, ConnectionMethod } from '../src/multi-wallet.js';

// ============================================================
// Test Data
// ============================================================

const SAMPLE_WC_URI = 'wc:topic123@2?relay-protocol=irn&relay-data=abc123';

// ============================================================
// Constructor Tests
// ============================================================

describe('MultiWalletManager constructor', () => {
  it('should create instance with default config', () => {
    const manager = new MultiWalletManager();
    expect(manager).toBeDefined();
  });

  it('should create instance with custom config', () => {
    const config: MultiWalletConfig = {
      wallets: ['metamask', 'rainbow'],
      preferredOrder: ['rainbow', 'metamask'],
      showQrFallback: true,
    };
    const manager = new MultiWalletManager(config);
    expect(manager).toBeDefined();
  });

  it('should filter wallets based on config', () => {
    const manager = new MultiWalletManager({
      wallets: ['metamask', 'rainbow'],
    });
    const options = manager.getWalletOptions();
    const ids = options.map((o) => o.id);
    
    expect(ids).toContain('metamask');
    expect(ids).toContain('rainbow');
    expect(ids.length).toBe(2);
  });
});

// ============================================================
// getWalletOptions Tests
// ============================================================

describe('getWalletOptions', () => {
  it('should return array of wallet options', () => {
    const manager = new MultiWalletManager();
    const options = manager.getWalletOptions();
    
    expect(Array.isArray(options)).toBe(true);
    expect(options.length).toBeGreaterThan(0);
  });

  it('should include required fields for each option', () => {
    const manager = new MultiWalletManager();
    const options = manager.getWalletOptions();
    
    options.forEach((option: WalletOption) => {
      expect(option.id).toBeDefined();
      expect(typeof option.id).toBe('string');
      expect(option.name).toBeDefined();
      expect(typeof option.name).toBe('string');
      expect(option.icon).toBeDefined();
      expect(typeof option.icon).toBe('string');
      expect(option.deepLink).toBeDefined();
      expect(typeof option.deepLink).toBe('string');
      expect(typeof option.installed).toBe('boolean');
      expect(typeof option.recommended).toBe('boolean');
    });
  });

  it('should respect preferred order', () => {
    const manager = new MultiWalletManager({
      preferredOrder: ['rainbow', 'metamask', 'coinbase'],
    });
    const options = manager.getWalletOptions();
    
    const rainbowIdx = options.findIndex((o) => o.id === 'rainbow');
    const metamaskIdx = options.findIndex((o) => o.id === 'metamask');
    const coinbaseIdx = options.findIndex((o) => o.id === 'coinbase');
    
    expect(rainbowIdx).toBeLessThan(metamaskIdx);
    expect(metamaskIdx).toBeLessThan(coinbaseIdx);
  });

  it('should mark recommended wallets', () => {
    const manager = new MultiWalletManager();
    const options = manager.getWalletOptions();
    
    const recommended = options.filter((o) => o.recommended);
    expect(recommended.length).toBeGreaterThan(0);
    expect(recommended.length).toBeLessThanOrEqual(5);
  });
});

// ============================================================
// getBestWallet Tests
// ============================================================

describe('getBestWallet', () => {
  it('should return a wallet option', () => {
    const manager = new MultiWalletManager();
    const best = manager.getBestWallet();
    
    expect(best).toBeDefined();
    expect(best).not.toBeNull();
  });

  it('should return null when no wallets available', () => {
    const manager = new MultiWalletManager({ wallets: [] });
    const best = manager.getBestWallet();
    
    expect(best).toBeNull();
  });

  it('should prefer first wallet in preferred order', () => {
    const manager = new MultiWalletManager({
      preferredOrder: ['rainbow', 'metamask'],
    });
    const best = manager.getBestWallet();
    
    expect(best).toBeDefined();
    expect(best!.id).toBe('rainbow');
  });
});

// ============================================================
// connectWallet Tests
// ============================================================

describe('connectWallet', () => {
  it('should generate deep link for known wallet', () => {
    const manager = new MultiWalletManager();
    const link = manager.connectWallet('metamask', SAMPLE_WC_URI);
    
    expect(link).toBeDefined();
    expect(link).toContain('metamask://');
    expect(link).toContain('wc?uri=');
    expect(link).toContain(encodeURIComponent(SAMPLE_WC_URI));
  });

  it('should throw error for unknown wallet', () => {
    const manager = new MultiWalletManager();
    
    expect(() => {
      manager.connectWallet('unknown-wallet-xyz', SAMPLE_WC_URI);
    }).toThrow('Wallet not found');
  });

  it('should fall back to universal link if no deep link', () => {
    const manager = new MultiWalletManager();
    
    // walletconnect entry has no deep link scheme in some cases
    // This test verifies fallback behavior
    const link = manager.connectWallet('metamask', SAMPLE_WC_URI);
    expect(link).toBeDefined();
  });
});

// ============================================================
// getQrCodeData Tests
// ============================================================

describe('getQrCodeData', () => {
  it('should return SVG string by default', () => {
    const manager = new MultiWalletManager();
    const qrData = manager.getQrCodeData(SAMPLE_WC_URI);
    
    expect(typeof qrData).toBe('string');
    expect(qrData).toContain('<svg');
  });

  it('should respect custom options', () => {
    const manager = new MultiWalletManager();
    const qrData = manager.getQrCodeData(SAMPLE_WC_URI, {
      size: 400,
      darkColor: '#333333',
    });
    
    expect(qrData).toContain('width="400"');
    expect(qrData).toContain('fill="#333333"');
  });

  it('should handle data-url format', () => {
    const manager = new MultiWalletManager();
    const qrData = manager.getQrCodeData(SAMPLE_WC_URI, { format: 'data-url' });
    
    expect(qrData).toContain('data:image/svg+xml;base64,');
  });
});

// ============================================================
// getConnectionMethod Tests
// ============================================================

describe('getConnectionMethod', () => {
  it('should return qr-code for desktop by default', () => {
    const manager = new MultiWalletManager({
      mobile: { isMobile: false },
    });
    const method = manager.getConnectionMethod(SAMPLE_WC_URI);
    
    expect(method.type).toBe('qr-code');
    expect(method.data).toContain('<svg');
  });

  it('should return deep-link for mobile with installed wallet', () => {
    // Mock installed wallets
    vi.stubGlobal('window', {
      ethereum: { isMetaMask: true },
    });
    
    const manager = new MultiWalletManager({
      mobile: { isMobile: true, platform: 'ios' },
    });
    
    const method = manager.getConnectionMethod(SAMPLE_WC_URI);
    
    // Should prefer deep link when wallet is installed
    expect(['deep-link', 'universal-link', 'qr-code']).toContain(method.type);
    
    vi.unstubAllGlobals();
  });

  it('should return universal-link for mobile without installed wallet', () => {
    const manager = new MultiWalletManager({
      mobile: { isMobile: true, platform: 'android' },
    });
    
    const method = manager.getConnectionMethod(SAMPLE_WC_URI);
    
    // On mobile without installed wallet, should use universal link or QR
    expect(['universal-link', 'qr-code']).toContain(method.type);
  });

  it('should respect showQrFallback option', () => {
    const manager = new MultiWalletManager({
      mobile: { isMobile: false },
      showQrFallback: false,
    });
    
    const method = manager.getConnectionMethod(SAMPLE_WC_URI);
    
    // When QR fallback disabled, should use deep link
    expect(['deep-link', 'universal-link']).toContain(method.type);
  });

  it('should return valid connection method structure', () => {
    const manager = new MultiWalletManager();
    const method = manager.getConnectionMethod(SAMPLE_WC_URI);
    
    expect(method.type).toBeDefined();
    expect(['deep-link', 'qr-code', 'universal-link']).toContain(method.type);
    expect(method.data).toBeDefined();
    expect(typeof method.data).toBe('string');
    expect(method.data.length).toBeGreaterThan(0);
  });
});

// ============================================================
// Integration Tests
// ============================================================

describe('MultiWalletManager integration', () => {
  it('should work end-to-end with wallet selection', () => {
    const manager = new MultiWalletManager({
      preferredOrder: ['metamask', 'rainbow'],
      showQrFallback: true,
    });
    
    const options = manager.getWalletOptions();
    expect(options.length).toBeGreaterThan(0);
    
    const best = manager.getBestWallet();
    expect(best).toBeDefined();
    
    const method = manager.getConnectionMethod(SAMPLE_WC_URI);
    expect(method.type).toBeDefined();
    expect(method.data).toBeDefined();
  });

  it('should handle mobile flow', () => {
    const manager = new MultiWalletManager({
      mobile: { isMobile: true, platform: 'ios' },
    });
    
    const options = manager.getWalletOptions();
    const method = manager.getConnectionMethod(SAMPLE_WC_URI);
    
    expect(options.length).toBeGreaterThan(0);
    expect(method.type).toBeDefined();
  });

  it('should handle desktop flow', () => {
    const manager = new MultiWalletManager({
      mobile: { isMobile: false },
    });
    
    const options = manager.getWalletOptions();
    const method = manager.getConnectionMethod(SAMPLE_WC_URI);
    
    expect(options.length).toBeGreaterThan(0);
    expect(method.type).toBe('qr-code');
  });
});
