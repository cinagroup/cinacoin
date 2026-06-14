/**
 * Solflare Wallet connector for Solana.
 *
 * Connects via the `window.solflare` injected object provided by
 * the Solflare browser extension or in-app browser.
 *
 * @module connectors/solflare
 */

import type {
import { logger } from '@cinacoin/logger';
  SolanaConnector,
  SolanaPlatform,
  SolanaFeature,
  SolanaWalletProvider,
  SolanaTransactionLike,
} from '../types.js';

/**
 * Connector for the Solflare Solana wallet.
 *
 * @example
 * ```ts
 * const connector = new SolflareCinacoinor();
 * if (connector.isAvailable()) {
 *   const { publicKey } = await connector.connect();
 *   logger.info('Connected:', publicKey);
 * }
 * ```
 */
export class SolflareCinacoinor implements SolanaConnector {
  readonly id = 'solflare';
  readonly name = 'Solflare';
  readonly icon = 'https://solflare.com/icon.svg';
  readonly platforms: SolanaPlatform[] = ['browser', 'extension', 'mobile'];
  readonly supportedFeatures: SolanaFeature[] = [
    'solana:connect',
    'solana:signTransaction',
    'solana:signAllTransactions',
    'solana:signMessage',
  ];

  private provider: SolanaWalletProvider | null = null;

  /**
   * Resolve the injected Solflare provider.
   */
  private _resolveProvider(): SolanaWalletProvider | null {
    if (typeof window === 'undefined') return null;
    const win = window as unknown as Record<string, unknown>;

    return (win.solflare as SolanaWalletProvider) ?? null;
  }

  isAvailable(): boolean {
    return this._resolveProvider() !== null;
  }

  getAddress(): string | null {
    return this.provider?.publicKey?.toBase58() ?? null;
  }

  getProvider(): SolanaWalletProvider | null {
    return this.provider;
  }

  /**
   * Connect to Solflare wallet.
   * Opens the wallet approval UI if not already connected.
   */
  async connect(): Promise<{ publicKey: string }> {
    const provider = this._resolveProvider();
    if (!provider) {
      throw new Error('Solflare wallet not found. Install the Solflare browser extension or mobile app.');
    }

    const result = await provider.connect();
    this.provider = provider;
    this._bindEvents(provider);

    return { publicKey: result.publicKey.toBase58() };
  }

  /**
   * Disconnect from Solflare wallet.
   */
  async disconnect(): Promise<void> {
    if (this.provider) {
      await this.provider.disconnect();
      this.provider = null;
    }
  }

  async signTransaction(tx: SolanaTransactionLike): Promise<SolanaTransactionLike> {
    if (!this.provider) throw new Error('Not connected. Call connect() first.');
    return this.provider.signTransaction(tx);
  }

  async signAllTransactions(txs: SolanaTransactionLike[]): Promise<SolanaTransactionLike[]> {
    if (!this.provider) throw new Error('Not connected. Call connect() first.');
    if (!this.provider.signAllTransactions) {
      throw new Error('Connected wallet does not support signAllTransactions');
    }
    return this.provider.signAllTransactions(txs);
  }

  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }> {
    if (!this.provider) throw new Error('Not connected. Call connect() first.');
    if (!this.provider.signMessage) {
      throw new Error('Connected wallet does not support message signing');
    }
    return this.provider.signMessage(message);
  }

  /**
   * Subscribe to connector events.
   */
  on(event: string, handler: (...args: unknown[]) => void): void {
    if (this.provider) {
      this.provider.on(event as 'connect' | 'disconnect' | 'accountChanged', handler);
    }
  }

  /**
   * Unsubscribe from connector events.
   */
  off(event: string, handler: (...args: unknown[]) => void): void {
    if (this.provider) {
      this.provider.off(event as 'connect' | 'disconnect' | 'accountChanged', handler);
    }
  }

  private _bindEvents(provider: SolanaWalletProvider): void {
    provider.on('disconnect', () => {
      this.provider = null;
    });
  }
}
