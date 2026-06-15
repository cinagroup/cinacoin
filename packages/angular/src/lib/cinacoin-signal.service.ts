/**
 * @cinacoin/angular — Angular Signals-based state management
 *
 * Provides signal-based reactive state for Angular 17+.
 * Uses `signal()`, `computed()`, and `effect()` from `@angular/core`.
 *
 * This is the modern replacement for RxJS-based state management
 * in Angular applications.
 *
 * @example
 * ```ts
 * @Component({
 *   selector: 'app-wallet',
 *   template: `
 *     <p>Address: {{ account().address }}</p>
 *     <p>Connected: {{ isConnected() }}</p>
 *   `,
 * })
 * export class WalletComponent {
 *   private cina = inject(CinacoinSignalService);
 *   account = this.cina.account;
 *   isConnected = this.cina.isConnected;
 * }
 * ```
 */

import {
  Injectable,
  Inject,
  signal,
  computed,
  effect,
  untracked,
  DestroyRef,
  inject,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { Connector, Chain, TransactionRequest } from '@cinacoin/core-sdk';
import {
  CINA_CONNECT_INSTANCE,
  CINA_CONNECT_OPTIONS,
  type CinacoinAngularConfig,
} from './cinacoin.tokens.js';

/** Account state for signals. */
export interface SignalAccount {
  /** Connected wallet address. */
  address: string | null;
  /** Current chain ID. */
  chainId: number | null;
  /** Account balance (in smallest unit / wei). */
  balance: string | null;
  /** Native currency symbol. */
  chainSymbol: string | null;
}

/** Network state for signals. */
export interface SignalNetwork {
  /** Chain ID. */
  chainId: number | null;
  /** Chain name. */
  name: string | null;
  /** Native currency symbol. */
  symbol: string | null;
  /** Whether a connection is active. */
  connected: boolean;
}

/** Initial account state. */
const INITIAL_ACCOUNT: SignalAccount = {
  address: null,
  chainId: null,
  balance: null,
  chainSymbol: null,
};

/** Initial network state. */
const INITIAL_NETWORK: SignalNetwork = {
  chainId: null,
  name: null,
  symbol: null,
  connected: false,
};

/**
 * Angular Signals-based service for Cinacoin SDK.
 *
 * Uses Angular 17+ signals for reactive state management instead of RxJS.
 * Provides a cleaner API with automatic change detection.
 *
 * @example
 * ```ts
 * @Injectable({ providedIn: 'root' })
 * export class MyComponent {
 *   private cina = inject(CinacoinSignalService);
 *
 *   // Read-only signals
 *   account = this.cina.account;
 *   network = this.cina.network;
 *   isConnected = this.cina.isConnected;
 *   shortAddress = this.cina.shortAddress;
 *
 *   // Imperative methods
 *   async connect() {
 *     await this.cina.connect();
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class CinacoinSignalService {
  // ── Writable Signals (internal state) ──────────────────────────────────
  private _account: WritableSignal<SignalAccount> = signal(INITIAL_ACCOUNT);
  private _network: WritableSignal<SignalNetwork> = signal(INITIAL_NETWORK);
  private _isOpen: WritableSignal<boolean> = signal(false);
  private _isConnecting: WritableSignal<boolean> = signal(false);
  private _error: WritableSignal<string | null> = signal(null);

  // ── Read-only Signals (public API) ─────────────────────────────────────

  /** Current account state signal. */
  readonly account: Signal<SignalAccount> = this._account.asReadonly();

  /** Current network state signal. */
  readonly network: Signal<SignalNetwork> = this._network.asReadonly();

  /** Whether the connection modal is open. */
  readonly isOpen: Signal<boolean> = this._isOpen.asReadonly();

  /** Whether a connection attempt is in progress. */
  readonly isConnecting: Signal<boolean> = this._isConnecting.asReadonly();

  /** Last error message, or null if no error. */
  readonly error: Signal<string | null> = this._error.asReadonly();

  // ── Computed Signals (derived state) ───────────────────────────────────

  /** Whether a wallet is connected. */
  readonly isConnected: Signal<boolean> = computed(() => {
    return this._account().address !== null;
  });

  /** Shortened wallet address (0x1234...5678). */
  readonly shortAddress: Signal<string | null> = computed(() => {
    const address = this._account().address;
    if (!address) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  });

  /** Current chain name. */
  readonly chainName: Signal<string | null> = computed(() => {
    return this._network().name;
  });

  /** Whether the current network is a testnet. */
  readonly isTestnet: Signal<boolean> = computed(() => {
    const chainId = this._network().chainId;
    if (!chainId) return false;
    // Common testnet chain IDs
    const testnetIds = [5, 11155111, 421614, 84532, 11155420, 80001, 80002];
    return testnetIds.includes(chainId);
  });

  /** Formatted balance with symbol. */
  readonly formattedBalance: Signal<string> = computed(() => {
    const balance = this._account().balance;
    const symbol = this._account().chainSymbol;
    if (!balance || !symbol) return '0.00';
    return `${balance} ${symbol}`;
  });

  // ── Private fields ─────────────────────────────────────────────────────

  private _onAccountsChangedHandler?: (accounts: string[]) => void;
  private _onChainChangedHandler?: (chainId: string) => void;
  private _onDisconnectHandler?: () => void;
  private destroyRef = inject(DestroyRef);

  constructor(
    @Inject(CINA_CONNECT_OPTIONS) private options: CinacoinAngularConfig,
    @Inject(CINA_CONNECT_INSTANCE) private connector: Connector,
  ) {
    this._initialize();
    this._setupCleanup();
  }

  /** @internal Initialize event listeners on the connector. */
  private _initialize(): void {
    if (!this.connector) {
      this._account.set(INITIAL_ACCOUNT);
      this._network.set(INITIAL_NETWORK);
      return;
    }

    // Set up account change listener
    this._onAccountsChangedHandler = (accounts: string[]) => {
      if (accounts.length > 0) {
        const address = accounts[0];
        const chainId = this.connector.getChainId?.() ?? null;
        this._account.set({
          address,
          chainId: chainId ? Number(chainId) : null,
          balance: null,
          chainSymbol: null,
        });
        this._emitNetwork();
      }
    };

    // Set up chain change listener
    this._onChainChangedHandler = (_chainId: string) => {
      this._emitNetwork();
      this._refreshAccount();
    };

    // Set up disconnect listener
    this._onDisconnectHandler = () => {
      this._account.set(INITIAL_ACCOUNT);
      this._network.set(INITIAL_NETWORK);
      this._isOpen.set(false);
      this._isConnecting.set(false);
    };

    // Register listeners on the underlying provider if available
    const provider = this.connector.getProvider?.() as
      | { on?: (event: string, handler: (...args: unknown[]) => void) => void }
      | undefined;
    if (provider && typeof provider.on === 'function') {
      provider.on('accountsChanged', this._onAccountsChangedHandler);
      provider.on('chainChanged', this._onChainChangedHandler);
      provider.on('disconnect', this._onDisconnectHandler);
    }

    // Emit initial state
    this._emitNetwork();
    this._refreshAccount();
  }

  /** @internal Set up cleanup on destroy. */
  private _setupCleanup(): void {
    this.destroyRef.onDestroy(() => {
      const provider = this.connector?.getProvider?.();
      if (provider && typeof provider.removeListener === 'function') {
        if (this._onAccountsChangedHandler) {
          provider.removeListener('accountsChanged', this._onAccountsChangedHandler);
        }
        if (this._onChainChangedHandler) {
          provider.removeListener('chainChanged', this._onChainChangedHandler);
        }
        if (this._onDisconnectHandler) {
          provider.removeListener('disconnect', this._onDisconnectHandler);
        }
      }
    });

    // Optional: log state changes via effect (for debugging)
    if (this.options.debug) {
      effect(() => {
        const account = this._account();
        const network = this._network();
        untracked(() => {
          console.debug('[CinacoinSignalService] State change:', { account, network });
        });
      });
    }
  }

  /** Emit current network state. */
  private _emitNetwork(): void {
    const chainId = this.connector.getChainId?.() ?? null;
    const chain = this._findChain(chainId);
    this._network.set({
      chainId: chainId ? Number(chainId) : null,
      name: chain?.name ?? null,
      symbol: chain?.nativeCurrency?.symbol ?? null,
      connected: chainId != null,
    });
  }

  /** Refresh account state from connector. */
  private async _refreshAccount(): Promise<void> {
    try {
      const accounts = await this.connector.getAccounts?.();
      const chainId = this.connector.getChainId?.();
      const chain = this._findChain(chainId);

      if (accounts && accounts.length > 0) {
        this._account.set({
          address: accounts[0],
          chainId: chainId ? Number(chainId) : null,
          balance: null,
          chainSymbol: chain?.nativeCurrency?.symbol ?? null,
        });
      } else {
        this._account.set(INITIAL_ACCOUNT);
      }
    } catch {
      this._account.set(INITIAL_ACCOUNT);
    }
  }

  /** Find chain config by chain ID. */
  private _findChain(chainId: number | string | null | undefined): Chain | undefined {
    if (!chainId || !this.options.chains) return undefined;
    const id = Number(chainId);
    return this.options.chains.find((c) => c.id === String(id));
  }

  // ── Modal Control ──────────────────────────────────────────────────────

  /** Open the connection modal. */
  open(): void {
    this._isOpen.set(true);
  }

  /** Close the connection modal. */
  close(): void {
    this._isOpen.set(false);
  }

  // ── Wallet Operations ──────────────────────────────────────────────────

  /**
   * Connect to a wallet.
   *
   * @param connectorId - Optional connector ID (e.g. 'metamask', 'walletconnect')
   */
  async connect(connectorId?: string): Promise<void> {
    if (!this.connector) {
      this._error.set('Cinacoin connector not initialized');
      throw new Error('Cinacoin connector not initialized');
    }

    this._isConnecting.set(true);
    this._error.set(null);
    this._isOpen.set(true);

    try {
      const result = await this.connector.connect({
        chains: this.options.chains?.map((c) => Number(c.id)),
      });

      this._isOpen.set(false);
      this._isConnecting.set(false);

      if (result && result.accounts && result.accounts.length > 0) {
        this._account.set({
          address: result.accounts[0],
          chainId: result.chainId ?? null,
          balance: null,
          chainSymbol: null,
        });
      }
      this._emitNetwork();
    } catch (err: unknown) {
      this._isOpen.set(false);
      this._isConnecting.set(false);
      const message = err instanceof Error ? err.message : 'Connection failed';
      this._error.set(message);
      throw err;
    }
  }

  /** Disconnect from the current wallet. */
  async disconnect(): Promise<void> {
    if (!this.connector) {
      throw new Error('Cinacoin connector not initialized');
    }

    await this.connector.disconnect();
    this._account.set(INITIAL_ACCOUNT);
    this._network.set(INITIAL_NETWORK);
    this._isOpen.set(false);
    this._error.set(null);
  }

  /**
   * Send a JSON-RPC request.
   *
   * @param args - JSON-RPC request parameters
   */
  async request(args: { method: string; params?: unknown[] }): Promise<unknown> {
    if (!this.connector) {
      throw new Error('Cinacoin connector not initialized');
    }
    const provider = this.connector.getProvider?.();
    if (!provider || typeof provider.request !== 'function') {
      throw new Error('Provider does not support request()');
    }
    return provider.request(args);
  }

  /**
   * Sign a message with the connected wallet.
   *
   * @param message - The message to sign
   */
  async signMessage(message: string): Promise<string> {
    if (!this.connector) {
      throw new Error('Cinacoin connector not initialized');
    }
    const provider = this.connector.getProvider?.();
    if (!provider || typeof provider.request !== 'function') {
      throw new Error('Provider does not support signing');
    }

    const address = this._account().address;
    if (!address) {
      throw new Error('No account connected');
    }

    const hexMessage = '0x' + Buffer.from(message, 'utf8').toString('hex');
    return provider.request({
      method: 'personal_sign',
      params: [hexMessage, address],
    }) as Promise<string>;
  }

  /**
   * Send a transaction.
   *
   * @param tx - Transaction parameters
   */
  async sendTransaction(tx: TransactionRequest): Promise<string> {
    if (!this.connector) {
      throw new Error('Cinacoin connector not initialized');
    }
    const provider = this.connector.getProvider?.();
    if (!provider || typeof provider.request !== 'function') {
      throw new Error('Provider does not support transactions');
    }
    return provider.request({
      method: 'eth_sendTransaction',
      params: [tx],
    }) as Promise<string>;
  }

  /**
   * Switch to a different chain.
   *
   * @param chainId - Target chain ID
   */
  async switchChain(chainId: number): Promise<void> {
    if (!this.connector) {
      throw new Error('Cinacoin connector not initialized');
    }
    const provider = this.connector.getProvider?.();
    if (!provider || typeof provider.request !== 'function') {
      throw new Error('Provider does not support chain switching');
    }

    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });

    this._emitNetwork();
    this._refreshAccount();
  }

  /** Clear the current error. */
  clearError(): void {
    this._error.set(null);
  }
}
