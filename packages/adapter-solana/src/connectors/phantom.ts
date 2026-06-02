/**
 * Phantom Wallet connector for Solana.
 *
 * Connects via the `window.phantom.solana` or `window.solana`
 * injected object provided by the Phantom browser extension.
 *
 * @module connectors/phantom
 */

import type {
  SolanaConnector,
  SolanaPlatform,
  SolanaFeature,
  SolanaWalletProvider,
  SolanaTransactionLike,
} from '../types.js';

/**
 * Connector for the Phantom Solana wallet.
 *
 * @example
 * ```ts
 * const connector = new PhantomWalletConnector();
 * if (connector.isAvailable()) {
 *   const { publicKey } = await connector.connect();
 *   console.log('Connected:', publicKey);
 * }
 * ```
 */
export class PhantomWalletConnector implements SolanaConnector {
  readonly id = 'phantom';
  readonly name = 'Phantom';
  readonly icon = 'https://phantom.app/img/phantom-icon.svg';
  readonly platforms: SolanaPlatform[] = ['browser', 'extension', 'mobile'];
  readonly supportedFeatures: SolanaFeature[] = [
    'solana:connect',
    'solana:signTransaction',
    'solana:signAllTransactions',
    'solana:signMessage',
    'solana:signIn',
  ];

  private provider: SolanaWalletProvider | null = null;

  /**
   * Resolve the injected Phantom provider.
   * Phantom exposes itself as `window.phantom?.solana` and also
   * as `window.solana` (for legacy compatibility).
   */
  private _resolveProvider(): SolanaWalletProvider | null {
    if (typeof window === 'undefined') return null;
    const win = window as unknown as Record<string, unknown>;

    // Preferred: window.phantom.solana
    const phantom = win.phantom as Record<string, unknown> | undefined;
    if (phantom?.solana) {
      return phantom.solana as SolanaWalletProvider;
    }

    // Legacy: window.solana (may be Phantom or another wallet)
    const solana = win.solana as (SolanaWalletProvider & { isPhantom?: boolean }) | undefined;
    if (solana) {
      // Check if it's Phantom by looking for isPhantom flag
      if (solana.isPhantom === true) {
        return solana;
      }
    }

    return null;
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
   * Connect to Phantom wallet.
   * Opens the wallet approval UI if not already connected.
   */
  async connect(): Promise<{ publicKey: string }> {
    const provider = this._resolveProvider();
    if (!provider) {
      throw new Error('Phantom wallet not found. Install the Phantom browser extension or mobile app.');
    }

    const result = await provider.connect();
    this.provider = provider;
    this._bindEvents(provider);

    return { publicKey: result.publicKey.toBase58() };
  }

  /**
   * Disconnect from Phantom wallet.
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
