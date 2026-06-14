/**
 * Multi-Wallet Connection Manager — Wallet selection and routing.
 *
 * Provides wallet selection UI data, deep link routing,
 * QR code fallback, and platform-aware connection methods.
 *
 * @packageDocumentation
 */

import { WALLET_REGISTRY, getWalletById, getRecommendedWalletOrder } from './wallets.js';
import { buildWalletDeepLinks, buildUniversalLink, detectInstalledWallets } from './deep-links.js';
import { generateQrCode, generateQrCodeSvg } from './qr-code.js';
import type { QrCodeOptions } from './qr-code.js';
import type { WalletRegistryEntry } from './types.js';

// ============================================================
// Types
// ============================================================

/** Configuration for MultiWalletManager. */
export interface MultiWalletConfig {
  /** Wallets to support (defaults to all known). */
  wallets?: string[];
  /** Preferred wallet order. */
  preferredOrder?: string[];
  /** Whether to show QR code fallback. */
  showQrFallback?: boolean;
  /** Mobile detection. */
  mobile?: {
    /** Whether running on mobile. */
    isMobile?: boolean;
    /** Platform: 'ios' | 'android'. */
    platform?: 'ios' | 'android';
  };
}

/** Wallet option for connection UI. */
export interface WalletOption {
  id: string;
  name: string;
  icon: string;
  deepLink: string;
  installed: boolean;
  recommended: boolean;
}

/** Connection method result. */
export interface ConnectionMethod {
  type: 'deep-link' | 'qr-code' | 'universal-link';
  data: string;
}

// ============================================================
// MultiWalletManager
// ============================================================

/**
 * Multi-wallet connection manager.
 * Provides wallet selection UI data and deep link routing.
 *
 * @example
 * ```ts
 * const manager = new MultiWalletManager({
 *   preferredOrder: ['metamask', 'rainbow', 'coinbase'],
 *   showQrFallback: true,
 * });
 *
 * const options = manager.getWalletOptions();
 * const best = manager.getBestWallet();
 * const method = manager.getConnectionMethod(wcUri);
 * ```
 */
export class MultiWalletManager {
  private config: MultiWalletConfig;
  private walletEntries: WalletRegistryEntry[];
  private installedWallets: string[];

  constructor(config?: MultiWalletConfig) {
    this.config = config ?? {};
    
    // Filter wallets based on config
    if (config?.wallets !== undefined) {
      this.walletEntries = WALLET_REGISTRY.filter((w) => config.wallets!.includes(w.id));
    } else {
      this.walletEntries = [...WALLET_REGISTRY];
    }
    
    // Detect installed wallets
    this.installedWallets = detectInstalledWallets();
  }

  /**
   * Get available wallet options for connection.
   *
   * Returns wallet options sorted by preferred order,
   * with installed wallets first.
   *
   * @returns Array of WalletOption objects.
   */
  getWalletOptions(): WalletOption[] {
    const preferredOrder = this.config.preferredOrder ?? [];
    const recommendedOrder = getRecommendedWalletOrder().map((w) => w.id);
    
    // Sort wallets by: preferred order > installed > recommended
    const sorted = [...this.walletEntries].sort((a, b) => {
      // Preferred order takes priority
      const aPrefIdx = preferredOrder.indexOf(a.id);
      const bPrefIdx = preferredOrder.indexOf(b.id);
      if (aPrefIdx !== -1 && bPrefIdx !== -1) return aPrefIdx - bPrefIdx;
      if (aPrefIdx !== -1) return -1;
      if (bPrefIdx !== -1) return 1;
      
      // Installed wallets next
      const aInstalled = this.installedWallets.includes(a.id);
      const bInstalled = this.installedWallets.includes(b.id);
      if (aInstalled && !bInstalled) return -1;
      if (!aInstalled && bInstalled) return 1;
      
      // Then by recommended order
      const aRecIdx = recommendedOrder.indexOf(a.id);
      const bRecIdx = recommendedOrder.indexOf(b.id);
      return aRecIdx - bRecIdx;
    });
    
    return sorted.map((wallet) => ({
      id: wallet.id,
      name: wallet.name,
      icon: wallet.imageUrl,
      deepLink: wallet.deepLink ?? '',
      installed: this.installedWallets.includes(wallet.id),
      recommended: recommendedOrder.slice(0, 5).includes(wallet.id),
    }));
  }

  /**
   * Get the best wallet option based on platform and installation.
   *
   * Priority:
   * 1. Installed wallet with highest preference
   * 2. First wallet in preferred order
   * 3. First recommended wallet
   * 4. First available wallet
   *
   * @returns Best WalletOption or null if no wallets available.
   */
  getBestWallet(): WalletOption | null {
    const options = this.getWalletOptions();
    if (options.length === 0) return null;
    
    // Prefer installed wallets
    const installed = options.find((o) => o.installed);
    if (installed) return installed;
    
    // Fall back to first option (already sorted by preference)
    return options[0];
  }

  /**
   * Connect to a specific wallet via deep link.
   *
   * @param walletId - The wallet ID to connect to.
   * @param wcUri - The WC v2 URI to encode.
   * @returns Deep link URL for the wallet.
   * @throws Error if wallet not found or has no deep link.
   */
  connectWallet(walletId: string, wcUri: string): string {
    const wallet = getWalletById(walletId);
    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`);
    }
    
    // Build deep link
    if (wallet.deepLink) {
      return `${wallet.deepLink}wc?uri=${encodeURIComponent(wcUri)}`;
    }
    
    // Fall back to universal link
    if (wallet.universalLink) {
      return `${wallet.universalLink}/wc?uri=${encodeURIComponent(wcUri)}`;
    }
    
    throw new Error(`Wallet ${walletId} has no deep link or universal link`);
  }

  /**
   * Get QR code data for the current pairing.
   *
   * @param wcUri - The WC v2 URI to encode.
   * @param options - QR code generation options.
   * @returns QR code as SVG string (default format).
   */
  getQrCodeData(wcUri: string, options?: QrCodeOptions): string {
    const format = options?.format ?? 'svg';
    
    if (format === 'svg') {
      return generateQrCodeSvg(wcUri, options);
    }
    
    // For other formats, use generateQrCode
    const result = generateQrCode(wcUri, options);
    return typeof result === 'string' ? result : result.toString('base64');
  }

  /**
   * Detect platform and return appropriate connection method.
   *
   * Strategy:
   * - Mobile + installed wallet → deep-link
   * - Mobile + no installed wallet → universal-link
   * - Desktop → qr-code (with deep-link fallback if showQrFallback is false)
   *
   * @param wcUri - The WC v2 URI to encode.
   * @returns ConnectionMethod with type and data.
   */
  getConnectionMethod(wcUri: string): ConnectionMethod {
    const isMobile = this.config.mobile?.isMobile ?? this.detectMobile();
    
    if (isMobile) {
      // On mobile, prefer deep links
      const best = this.getBestWallet();
      
      if (best?.installed) {
        // Installed wallet: use deep link
        return {
          type: 'deep-link',
          data: this.connectWallet(best.id, wcUri),
        };
      }
      
      // No installed wallet: use universal link
      if (best) {
        const universal = buildUniversalLink(wcUri, best.id);
        if (universal) {
          return {
            type: 'universal-link',
            data: universal,
          };
        }
      }
    }
    
    // Desktop or fallback: QR code
    if (this.config.showQrFallback !== false) {
      return {
        type: 'qr-code',
        data: this.getQrCodeData(wcUri),
      };
    }
    
    // If QR fallback disabled, use deep link anyway
    const best = this.getBestWallet();
    if (best) {
      return {
        type: 'deep-link',
        data: this.connectWallet(best.id, wcUri),
      };
    }
    
    // Last resort: QR code
    return {
      type: 'qr-code',
      data: this.getQrCodeData(wcUri),
    };
  }

  // ============================================================
  // Internal Helpers
  // ============================================================

  /**
   * Detect if running on mobile (basic heuristic).
   */
  private detectMobile(): boolean {
    if (typeof navigator === 'undefined') {
      return false;
    }
    
    const ua = navigator.userAgent || '';
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  }
}
