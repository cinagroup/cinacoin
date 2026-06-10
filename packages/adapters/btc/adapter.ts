/**
 * Bitcoin Wallet Adapter.
 *
 * Connects to Bitcoin wallets (Leather, Xverse, UniSat, OKX).
 * Supports message signing and PSBT signing.
 *
 * @example
 * ```ts
 * import { BitcoinAdapter } from '@cinacoin/adapters/btc';
 *
 * const adapter = new BitcoinAdapter({
 *   preferredWallet: 'leather',
 *   network: 'mainnet',
 * });
 *
 * const result = await adapter.connect();
 * console.log(result.accounts); // [btc address]
 * ```
 */

import type { ConnectParams, ConnectionResult, TransactionRequest } from '@cinacoin/core-sdk';
import { Connector } from '@cinacoin/core-sdk';
import type { BitcoinWalletConfig, BitcoinProvider } from './types.js';
import {
  detectBitcoinWallet,
  getBitcoinWalletInstallLinks,
  isValidBitcoinAddress,
  getNetworkName,
} from './utils.js';

export class BitcoinAdapter extends Connector {
  readonly id = 'bitcoin';
  readonly name = 'Bitcoin';
  readonly icon = '₿';
  readonly type = 'extension';

  private provider: BitcoinProvider | null = null;
  private walletName: string = '';
  private config: BitcoinWalletConfig;
  private currentAddress: string | null = null;

  constructor(config: BitcoinWalletConfig = {}) {
    super();
    this.config = config;
  }

  get installed(): boolean {
    return !!this.provider;
  }

  async connect(params?: ConnectParams): Promise<ConnectionResult> {
    const detected = detectBitcoinWallet(this.config.preferredWallet);

    if (!detected) {
      const links = getBitcoinWalletInstallLinks();
      throw new Error(
        `No Bitcoin wallet found. Install one of: Leather (${links.leather}), Xverse (${links.xverse}), UniSat (${links.unisat}), OKX (${links.okx})`
      );
    }

    this.provider = detected.provider;
    this.walletName = detected.name;

    // Request accounts
    let accounts: string[];
    try {
      accounts = await this.provider.requestAccounts();
    } catch {
      // Some wallets use different method names
      accounts = await this.provider.getAccounts();
    }

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from Bitcoin wallet');
    }

    // Filter by address format if specified
    if (this.config.addressFormat) {
      const filtered = accounts.filter(addr => {
        const type = this.getAddressType(addr);
        return type === this.config.addressFormat;
      });
      if (filtered.length > 0) {
        accounts = filtered;
      }
    }

    this.currentAddress = accounts[0];

    // Determine chain ID (Bitcoin mainnet = 0, testnet = 11155112)
    let network = 'mainnet';
    try {
      network = await this.provider.getNetwork();
    } catch {
      // Use configured network
      network = this.config.network || 'mainnet';
    }

    const chainId = network === 'mainnet' || network === 'livenet' ? 0 : 11155112;

    // Setup listeners
    this.setupListeners();

    return {
      sessionId: `btc-${this.walletName.toLowerCase()}-${Date.now()}`,
      accounts,
      chainId,
      connectorId: this.id,
    };
  }

  async disconnect(): Promise<void> {
    this.removeListeners();
    this.provider = null;
    this.currentAddress = null;
    this.walletName = '';
  }

  async getAccounts(): Promise<string[]> {
    if (!this.provider) return [];
    try {
      return await this.provider.getAccounts();
    } catch {
      return this.currentAddress ? [this.currentAddress] : [];
    }
  }

  async getChainId(): Promise<number> {
    if (!this.provider) throw new Error('Not connected');
    try {
      const network = await this.provider.getNetwork();
      return network === 'mainnet' || network === 'livenet' ? 0 : 11155112;
    } catch {
      return 0;
    }
  }

  async switchChain(chainId: number): Promise<void> {
    // Bitcoin doesn't support chain switching in the traditional sense
    // We can only suggest network change if the wallet supports it
    const network = chainId === 0 ? 'mainnet' : 'testnet';
    this.config.network = network as 'mainnet' | 'testnet';
    this.emit('chainChanged', chainId);
  }

  async signMessage(message: string): Promise<string> {
    if (!this.provider) throw new Error('Not connected');

    const signature = await this.provider.signMessage(
      message,
      this.currentAddress || undefined,
    );

    return signature;
  }

  async signTransaction(tx: TransactionRequest): Promise<string> {
    if (!this.provider) throw new Error('Not connected');

    // Bitcoin transactions use PSBT format
    // The tx.data field should contain a base64-encoded PSBT
    if (!tx.data) {
      throw new Error('Bitcoin signTransaction requires PSBT data in tx.data (base64)');
    }

    const result = await this.provider.signPsbt({
      psbt: tx.data,
      inputsToSign: [{
        address: this.currentAddress || tx.from,
        signingIndexes: [0], // Default to first input
      }],
    });

    return result.psbt;
  }

  /**
   * Send BTC to recipients.
   */
  async sendTransfer(recipients: Array<{ address: string; amount: number }>): Promise<string> {
    if (!this.provider) throw new Error('Not connected');

    // Validate addresses
    for (const r of recipients) {
      if (!isValidBitcoinAddress(r.address)) {
        throw new Error(`Invalid Bitcoin address: ${r.address}`);
      }
    }

    const result = await this.provider.sendTransfer({ recipients });
    return result.txid;
  }

  /**
   * Get the detected wallet name.
   */
  getWalletName(): string {
    return this.walletName;
  }

  getProvider(): BitcoinProvider | null {
    return this.provider;
  }

  // ── Helpers ──

  private getAddressType(address: string): string {
    if (address.startsWith('1')) return 'p2pkh';
    if (address.startsWith('3')) return 'p2sh';
    if (address.toLowerCase().startsWith('bc1q') || address.toLowerCase().startsWith('tb1q')) return 'p2wpkh';
    if (address.toLowerCase().startsWith('bc1p') || address.toLowerCase().startsWith('tb1p')) return 'p2tr';
    return 'unknown';
  }

  // ── Event Listeners ──

  private handleAccountChanged = (accounts: unknown) => {
    this.emit('accountsChanged', accounts);
  };

  private handleDisconnect = () => {
    this.emit('disconnect');
  };

  private setupListeners(): void {
    if (!this.provider?.on) return;
    this.provider.on('accountChanged', this.handleAccountChanged);
    this.provider.on('disconnect', this.handleDisconnect);
  }

  private removeListeners(): void {
    if (!this.provider?.off) return;
    this.provider.off('accountChanged', this.handleAccountChanged);
    this.provider.off('disconnect', this.handleDisconnect);
  }
}
