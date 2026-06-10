/**
 * @cinacoin/universal-connector — EVM chain adapter.
 *
 * Supports Ethereum, Polygon, BSC, Arbitrum, Optimism, and all EVM-compatible chains.
 * Integrates with window.ethereum (EIP-6963) and WalletConnect v2.
 *
 * @example
 * ```ts
 * const adapter = new EvmAdapter();
 * adapter.registerChains([...evmChains]);
 * const result = await adapter.connect({ chainId: 'eip155:1' });
 * const sig = await adapter.signMessage('Hello');
 * ```
 */

import { BaseAdapter } from './BaseAdapter.js';
import type {
  AdapterConfig,
  ConnectOptions,
  ConnectionResult,
  SignatureResult,
  TxResult,
  BalanceResult,
} from '../types.js';

/**
 * EVM-compatible provider interface (window.ethereum).
 */
interface EvmProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
  isMetaMask?: boolean;
}

/**
 * EvmAdapter — connects to EVM-compatible chains via injected providers or WalletConnect.
 */
export class EvmAdapter extends BaseAdapter {
  private provider: EvmProvider | null = null;

  constructor(config?: Partial<AdapterConfig>) {
    super({
      id: 'evm',
      name: 'EVM Adapter',
      namespaces: ['eip155'],
      ...config,
    });
  }

  /**
   * Connect to an EVM chain.
   *
   * @param options - Connection options (chainId, provider, etc.).
   * @returns Connection result with accounts and session info.
   */
  async connect(options?: ConnectOptions): Promise<ConnectionResult> {
    const chainId = this.resolveChainId(options);
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[EvmAdapter] Chain "${chainId}" not registered`);
    }

    // Detect provider
    if (!this.provider) {
      this.provider = await this.detectProvider(options?.provider);
    }

    if (!this.provider) {
      throw new Error('[EvmAdapter] No EVM provider detected. Install MetaMask or another wallet.');
    }

    // Request accounts
    const accounts = (await this.provider.request({
      method: 'eth_requestAccounts',
    })) as string[];

    // Switch chain if needed
    const currentChainIdHex = (await this.provider.request({
      method: 'eth_chainId',
    })) as string;

    const targetChainIdHex = this.toHexChainId(chain.id);
    if (currentChainIdHex.toLowerCase() !== targetChainIdHex.toLowerCase()) {
      try {
        await this.provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainIdHex }],
        });
      } catch (err: unknown) {
        // Chain not added, try to add it
        if ((err as { code?: number }).code === 4902) {
          await this.provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: targetChainIdHex,
                chainName: chain.name,
                rpcUrls: [chain.rpcUrl, ...(chain.rpcUrls ?? [])],
                blockExplorerUrls: chain.explorerUrl ? [chain.explorerUrl] : undefined,
                nativeCurrency: chain.nativeCurrency,
              },
            ],
          });
        } else {
          throw err;
        }
      }
    }

    // Set connection state
    const sessionId = this.generateSessionId();
    this.setConnectionState(chainId, {
      connected: true,
      accounts,
      connectedAt: Date.now(),
      sessionId,
    });
    this._activeChainId = chainId;

    // Listen for events
    this.setupProviderListeners();

    return {
      sessionId,
      chainId,
      accounts,
      adapterId: this.id,
      connectedAt: Date.now(),
    };
  }

  /**
   * Disconnect from the current EVM chain.
   */
  async disconnect(): Promise<void> {
    if (this._activeChainId) {
      this.clearConnectionState(this._activeChainId);
      this._activeChainId = null;
    }
    this.provider = null;
    this.emit('disconnect');
  }

  /**
   * Sign a message using personal_sign (EIP-191).
   *
   * @param message - Message to sign.
   * @returns Signature result.
   */
  async signMessage(message: string): Promise<SignatureResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[EvmAdapter] No provider');

    const address = state.accounts[0];
    const signature = (await this.provider.request({
      method: 'personal_sign',
      params: [message, address],
    })) as string;

    return {
      message,
      signature,
      address,
      chainId: this._activeChainId!,
    };
  }

  /**
   * Sign and send a transaction.
   *
   * @param tx - Transaction request (to, from, value, data, etc.).
   * @returns Transaction result with hash.
   */
  async signTransaction(tx: unknown): Promise<TxResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[EvmAdapter] No provider');

    const txObj = tx as Record<string, unknown>;
    const hash = (await this.provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: state.accounts[0],
          ...txObj,
        },
      ],
    })) as string;

    return {
      hash,
      chainId: this._activeChainId!,
      from: state.accounts[0],
      to: txObj.to as string | undefined,
      broadcast: true,
    };
  }

  /**
   * Get native token balance for an address.
   *
   * @param address - Account address. Defaults to connected account.
   * @returns Balance result.
   */
  async getBalance(address?: string): Promise<BalanceResult> {
    const state = this.requireConnection();
    if (!this.provider) throw new Error('[EvmAdapter] No provider');

    const targetAddress = address ?? state.accounts[0];
    const chain = this.getChain(this._activeChainId!);

    const balanceHex = (await this.provider.request({
      method: 'eth_getBalance',
      params: [targetAddress, 'latest'],
    })) as string;

    const balanceWei = BigInt(balanceHex).toString();
    const decimals = chain?.nativeCurrency?.decimals ?? 18;
    const symbol = chain?.nativeCurrency?.symbol ?? 'ETH';
    const formatted = this.formatBalance(balanceWei, decimals);

    return {
      address: targetAddress,
      balance: balanceWei,
      formatted,
      symbol,
      chainId: this._activeChainId!,
    };
  }

  /**
   * Get connected accounts.
   */
  async getAccounts(): Promise<string[]> {
    const state = this.requireConnection();
    return state.accounts;
  }

  /**
   * Switch to a different EVM chain.
   *
   * @param chainId - Target chain ID (CAIP-2 format).
   */
  async switchChain(chainId: string): Promise<void> {
    const chain = this.getChain(chainId);
    if (!chain) {
      throw new Error(`[EvmAdapter] Chain "${chainId}" not registered`);
    }
    if (!this.provider) {
      throw new Error('[EvmAdapter] No provider. Call connect() first.');
    }

    const targetChainIdHex = this.toHexChainId(chainId);
    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainIdHex }],
      });
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 4902) {
        await this.provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: targetChainIdHex,
              chainName: chain.name,
              rpcUrls: [chain.rpcUrl, ...(chain.rpcUrls ?? [])],
              blockExplorerUrls: chain.explorerUrl ? [chain.explorerUrl] : undefined,
              nativeCurrency: chain.nativeCurrency,
            },
          ],
        });
      } else {
        throw err;
      }
    }

    this._activeChainId = chainId;
    this.emit('chainChanged', { chainId });
  }

  /* ------------------------------------------------------------------ */
  /*  Internal Helpers                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Detect EVM provider (window.ethereum or EIP-6963).
   */
  private async detectProvider(preferred?: string): Promise<EvmProvider | null> {
    if (typeof window === 'undefined') return null;

    const ethereum = (window as unknown as Window & typeof globalThis).ethereum;
    if (!ethereum) return null;

    // EIP-6963: Check for multiple providers
    if (ethereum.providers && Array.isArray(ethereum.providers)) {
      if (preferred) {
        const match = ethereum.providers.find((p: EvmProvider) => {
          if (preferred === 'metamask') return p.isMetaMask;
          return false;
        });
        if (match) return match;
      }
      return ethereum.providers[0];
    }

    return ethereum;
  }

  /**
   * Setup event listeners on the provider.
   */
  private setupProviderListeners(): void {
    if (!this.provider) return;

    this.provider.on('accountsChanged', (accounts: unknown) => {
      const accs = accounts as string[];
      if (this._activeChainId) {
        const state = this.getConnectionState(this._activeChainId);
        this.setConnectionState(this._activeChainId, { ...state, accounts: accs });
        this.emit('accountsChanged', { accounts: accs });
      }
    });

    this.provider.on('chainChanged', (chainIdHex: unknown) => {
      const chainId = this.fromHexChainId(chainIdHex as string);
      this._activeChainId = chainId;
      this.emit('chainChanged', { chainId });
    });

    this.provider.on('disconnect', () => {
      this.emit('disconnect');
    });
  }

  /**
   * Convert CAIP-2 chain ID to hex (e.g. "eip155:1" → "0x1").
   */
  private toHexChainId(caip2: string): string {
    const numericId = parseInt(caip2.split(':')[1], 10);
    return '0x' + numericId.toString(16);
  }

  /**
   * Convert hex chain ID to CAIP-2 (e.g. "0x1" → "eip155:1").
   */
  private fromHexChainId(hex: string): string {
    const numericId = parseInt(hex, 16);
    return `eip155:${numericId}`;
  }

  /**
   * Format balance from smallest unit to human-readable.
   */
  private formatBalance(balance: string, decimals: number): string {
    const value = BigInt(balance);
    const divisor = BigInt(10 ** decimals);
    const integerPart = value / divisor;
    const fractionalPart = value % divisor;

    if (fractionalPart === 0n) {
      return integerPart.toString();
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0').slice(0, 6);
    return `${integerPart}.${fractionalStr}`;
  }
}
