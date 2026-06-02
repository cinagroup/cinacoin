/**
 * Wallet Standard connector for Solana.
 *
 * Connects via the @solana/wallet-standard interface, which provides
 * a unified API for discovering and interacting with any wallet that
 * implements the standard (Phantom, Solflare, Backpack, etc.).
 *
 * @module connectors/wallet-standard
 */

import type {
  SolanaConnector,
  SolanaPlatform,
  SolanaFeature,
  SolanaWalletProvider,
  SolanaTransactionLike,
} from '../types.js';

/**
 * Minimal Wallet Standard interfaces (simplified to avoid runtime dependency
 * on @solana/wallet-standard). In a full implementation, consumers would
 * install the official package for complete type coverage.
 */

interface WalletStandardAccount {
  address: string;
  publicKey: Uint8Array;
  chains: string[];
  features: string[];
}

interface WalletStandardSignTransaction {
  version: string;
  signTransaction(input: {
    transaction: Uint8Array;
    account: WalletStandardAccount;
  }): Promise<{ signedTransaction: Uint8Array }>;
}

interface WalletStandardSignMessage {
  version: string;
  signMessage(input: {
    message: Uint8Array;
    account: WalletStandardAccount;
  }): Promise<{ signedMessage: Uint8Array }>;
}

interface WalletStandardConnect {
  version: string;
  connect(): Promise<{ accounts: WalletStandardAccount[] }>;
}

interface WalletStandardDisconnect {
  version: string;
  disconnect(): Promise<void>;
}

interface WalletStandardWallet {
  name: string;
  icon: Uint8Array;
  version: string;
  chains: string[];
  features: Record<string, unknown>;
  accounts: WalletStandardAccount[];
}

interface WalletStandardWindow {
  navigator?: {
    wallet?: {
      getWallets(): WalletStandardWallet[];
      on(event: 'register', handler: (wallet: WalletStandardWallet) => void): void;
    };
  };
}

/**
 * Generic Wallet Standard connector for Solana.
 *
 * Discovers wallets registered with the Wallet Standard API
 * (`window.navigator.wallet`) and provides a unified interface.
 *
 * When instantiated without a wallet name, auto-discovers the first
 * available standard-compliant wallet.
 *
 * @example
 * ```ts
 * // Auto-discover
 * const connector = new WalletStandardConnector();
 *
 * // Specific wallet
 * const connector = new WalletStandardConnector('Phantom');
 *
 * if (connector.isAvailable()) {
 *   const { publicKey } = await connector.connect();
 * }
 * ```
 */
export class WalletStandardConnector implements SolanaConnector {
  readonly platforms: SolanaPlatform[] = ['browser', 'extension', 'mobile', 'desktop'];
  readonly supportedFeatures: SolanaFeature[] = [
    'solana:connect',
    'solana:signTransaction',
    'solana:signAllTransactions',
    'solana:signMessage',
  ];

  private provider: SolanaWalletProvider | null = null;
  private wallet: WalletStandardWallet | null = null;
  private account: WalletStandardAccount | null = null;
  private _walletName?: string;
  private _id: string;
  private _name: string;
  private _icon: string;

  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get icon(): string { return this._icon; }

  /**
   * @param walletName - Optional specific wallet name to target.
   *   If omitted, auto-discovers the first available standard wallet.
   */
  constructor(walletName?: string) {
    this._walletName = walletName;
    this._id = walletName ? `wallet-standard-${walletName.toLowerCase()}` : 'wallet-standard';
    this._name = walletName ?? 'Wallet Standard';
    this._icon = '';
  }

  /**
   * Discover Wallet Standard wallets registered in the browser.
   */
  private _discoverWallets(): WalletStandardWallet[] {
    if (typeof window === 'undefined') return [];
    const win = window as unknown as WalletStandardWindow;

    if (!win.navigator?.wallet) return [];
    return win.navigator.wallet.getWallets();
  }

  /**
   * Resolve the target wallet from the Wallet Standard registry.
   */
  private _resolveWallet(): WalletStandardWallet | null {
    const wallets = this._discoverWallets();

    if (this._walletName) {
      return wallets.find((w) => w.name === this._walletName) ?? null;
    }

    // Auto-discover: return first available Solana wallet
    return wallets.find((w) =>
      w.chains.some((c) => c.startsWith('solana:')),
    ) ?? null;
  }

  isAvailable(): boolean {
    return this._resolveWallet() !== null;
  }

  getAddress(): string | null {
    return this.account?.address ?? null;
  }

  getProvider(): SolanaWalletProvider | null {
    return this.provider;
  }

  /**
   * Connect via Wallet Standard.
   */
  async connect(): Promise<{ publicKey: string }> {
    const wallet = this._resolveWallet();
    if (!wallet) {
      throw new Error(
        this._walletName
          ? `Wallet "${this._walletName}" not found via Wallet Standard.`
          : 'No Wallet Standard-compatible wallet found.',
      );
    }

    const connectFeature = wallet.features['solana:connect'] as WalletStandardConnect | undefined;
    if (!connectFeature?.connect) {
      throw new Error(`Wallet "${wallet.name}" does not support solana:connect`);
    }

    const result = await connectFeature.connect();
    if (!result.accounts.length) {
      throw new Error(`No accounts returned from "${wallet.name}"`);
    }

    this.wallet = wallet;
    this.account = result.accounts[0];

    // Build a minimal provider adapter
    this.provider = this._buildProvider(wallet, this.account);

    return { publicKey: this.account.address };
  }

  /**
   * Disconnect from the wallet.
   */
  async disconnect(): Promise<void> {
    if (this.wallet) {
      const disconnectFeature = this.wallet.features['solana:disconnect'] as WalletStandardDisconnect | undefined;
      if (disconnectFeature?.disconnect) {
        await disconnectFeature.disconnect();
      }
    }
    this.wallet = null;
    this.account = null;
    this.provider = null;
  }

  async signTransaction(tx: SolanaTransactionLike): Promise<SolanaTransactionLike> {
    if (!this.wallet || !this.account) throw new Error('Not connected. Call connect() first.');

    const signFeature = this.wallet.features['solana:signTransaction'] as WalletStandardSignTransaction | undefined;
    if (!signFeature?.signTransaction) {
      throw new Error('Connected wallet does not support signTransaction');
    }

    // Serialize the tx to Uint8Array
    let txBytes: Uint8Array;
    if (tx instanceof Uint8Array) {
      txBytes = tx;
    } else if (typeof (tx as { serialize?: () => Uint8Array }).serialize === 'function') {
      txBytes = (tx as { serialize: () => Uint8Array }).serialize();
    } else {
      throw new Error('Cannot serialize transaction for Wallet Standard signing');
    }

    const result = await signFeature.signTransaction({
      transaction: txBytes,
      account: this.account,
    });

    // Return a transaction-like wrapper
    return {
      ...tx,
      serialize: () => result.signedTransaction,
    } as SolanaTransactionLike;
  }

  async signAllTransactions(txs: SolanaTransactionLike[]): Promise<SolanaTransactionLike[]> {
    if (!this.wallet || !this.account) throw new Error('Not connected. Call connect() first.');

    const signFeature = this.wallet.features['solana:signTransaction'] as WalletStandardSignTransaction | undefined;
    if (!signFeature?.signTransaction) {
      throw new Error('Connected wallet does not support signTransaction');
    }

    const results: SolanaTransactionLike[] = [];
    for (const tx of txs) {
      let txBytes: Uint8Array;
      if (tx instanceof Uint8Array) {
        txBytes = tx;
      } else if (typeof (tx as { serialize?: () => Uint8Array }).serialize === 'function') {
        txBytes = (tx as { serialize: () => Uint8Array }).serialize();
      } else {
        throw new Error('Cannot serialize transaction for Wallet Standard signing');
      }

      const result = await signFeature.signTransaction({
        transaction: txBytes,
        account: this.account,
      });

      results.push({
        ...tx,
        serialize: () => result.signedTransaction,
      } as SolanaTransactionLike);
    }

    return results;
  }

  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }> {
    if (!this.wallet || !this.account) throw new Error('Not connected. Call connect() first.');

    const signFeature = this.wallet.features['solana:signMessage'] as WalletStandardSignMessage | undefined;
    if (!signFeature?.signMessage) {
      throw new Error('Connected wallet does not support signMessage');
    }

    const result = await signFeature.signMessage({
      message,
      account: this.account,
    });

    return { signature: result.signedMessage };
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

  /**
   * Build a minimal SolanaWalletProvider adapter around the Wallet Standard wallet.
   */
  private _buildProvider(
    wallet: WalletStandardWallet,
    account: WalletStandardAccount,
  ): SolanaWalletProvider {
    const self = this;
    const publicKey = {
      toBase58: () => account.address,
    };

    return {
      get publicKey() { return self.account ? publicKey : null; },
      get isConnected() { return self.account !== null; },

      async connect() {
        return { publicKey };
      },

      async disconnect() {
        await self.disconnect();
      },

      async signTransaction(tx: SolanaTransactionLike) {
        return self.signTransaction(tx);
      },

      async signAllTransactions(txs: SolanaTransactionLike[]) {
        return self.signAllTransactions(txs);
      },

      async signMessage(message: Uint8Array) {
        return self.signMessage(message);
      },

      on(event: string, handler: (...args: unknown[]) => void) {
        // Wallet Standard doesn't have a direct event system;
        // we track the account state for disconnect events
        if (event === 'disconnect') {
          const originalDisconnect = self.disconnect.bind(self);
          self.disconnect = async () => {
            await originalDisconnect();
            handler();
          };
        }
      },

      off() {
        // No-op for Wallet Standard
      },
    };
  }
}
