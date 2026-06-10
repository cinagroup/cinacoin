/**
 * Bitcoin Service — high-level Bitcoin operations.
 *
 * Combines:
 * - Blockstream API client (UTXOs, balance, tx history, broadcast)
 * - Coin selection (BnB → Knapsack → SRD)
 * - PSBT builder
 * - Wallet connector integration
 *
 * This is the production-ready service layer for Bitcoin operations.
 */

import { logger } from '@cinacoin/logger';
import type { BitcoinConnector } from '../types.js';
import { BlockstreamClient, type BlockstreamNetwork, type BlockstreamUTXO, type BlockstreamTransaction, type BlockstreamTxStatus, type BlockstreamFeeEstimate } from './blockstream.js';
import { selectCoins, prepareUtxos, type CoinSelectionUTXO, type CoinSelectionResult, type CoinSelectionConfig } from './coin-selection.js';
import { buildPsbt, buildMultiOutputPsbt, type PsbtDescriptor, type BuildPsbtParams } from './psbt-builder.js';

/** Input address format for fee estimation. */
export type BitcoinInputFormat = 'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2tr';

/** Bitcoin network preset. */
export interface BitcoinNetworkPreset {
  name: string;
  network: BlockstreamNetwork;
  rpcUrl: string;
  explorerUrl: string;
  defaultFormat: BitcoinInputFormat;
}

/** Well-known Bitcoin networks. */
export const BITCOIN_NETWORKS: Record<string, BitcoinNetworkPreset> = {
  mainnet: {
    name: 'Bitcoin Mainnet',
    network: 'mainnet',
    rpcUrl: 'https://blockstream.info/api',
    explorerUrl: 'https://blockstream.info',
    defaultFormat: 'p2wpkh',
  },
  testnet: {
    name: 'Bitcoin Testnet',
    network: 'testnet',
    rpcUrl: 'https://blockstream.info/testnet/api',
    explorerUrl: 'https://blockstream.info/testnet',
    defaultFormat: 'p2wpkh',
  },
  testnet4: {
    name: 'Bitcoin Testnet4',
    network: 'testnet4',
    rpcUrl: 'https://blockstream.info/testnet4/api',
    explorerUrl: 'https://blockstream.info/testnet4',
    defaultFormat: 'p2wpkh',
  },
  signet: {
    name: 'Bitcoin Signet',
    network: 'signet',
    rpcUrl: 'https://blockstream.info/signet/api',
    explorerUrl: 'https://blockstream.info/signet',
    defaultFormat: 'p2wpkh',
  },
};

/** Transaction status from BitcoinService. */
export interface BitcoinTransactionInfo {
  txid: string;
  confirmed: boolean;
  blockHeight?: number;
  blockTime?: number;
  fee: number;
  size: number;
  weight: number;
  inputs: number;
  outputs: number;
  totalInput: number;
  totalOutput: number;
}

/** Address balance info. */
export interface BitcoinBalanceInfo {
  /** Confirmed balance in satoshis. */
  confirmed: number;
  /** Unconfirmed balance in satoshis. */
  unconfirmed: number;
  /** Total balance. */
  total: number;
  /** Number of confirmed transactions. */
  txCount: number;
  /** Number of unconfirmed transactions. */
  mempoolTxCount: number;
}

/** BitcoinService configuration. */
export interface BitcoinServiceConfig {
  /** Network to use. */
  network?: BlockstreamNetwork;
  /** Custom Blockstream API URL. */
  blockstreamUrl?: string;
  /** Default input format for fee estimation. */
  defaultFormat?: BitcoinInputFormat;
  /** Request timeout in milliseconds. */
  timeoutMs?: number;
}

/**
 * Bitcoin Service — production-ready Bitcoin operations.
 *
 * Provides:
 * - Balance queries via Blockstream API
 * - UTXO management with coin selection
 * - PSBT building and signing
 * - Transaction broadcast and tracking
 * - Fee estimation
 */
export class BitcoinService {
  private client: BlockstreamClient;
  private connector: BitcoinConnector | null = null;
  private network: BlockstreamNetwork;
  private defaultFormat: BitcoinInputFormat;
  private connectedAddress: string | null = null;

  constructor(config?: BitcoinServiceConfig) {
    this.network = config?.network ?? 'mainnet';
    this.defaultFormat = config?.defaultFormat ?? 'p2wpkh';
    this.client = new BlockstreamClient({
      network: this.network,
      baseUrl: config?.blockstreamUrl,
      timeoutMs: config?.timeoutMs,
    });
  }

  /* ---- Configuration ---- */

  /** Get the current network. */
  getNetwork(): BlockstreamNetwork {
    return this.network;
  }

  /** Set the wallet connector. */
  setConnector(connector: BitcoinConnector): void {
    this.connector = connector;
  }

  /** Get the wallet connector. */
  getConnector(): BitcoinConnector | null {
    return this.connector;
  }

  /** Set the connected address. */
  setAddress(address: string): void {
    this.connectedAddress = address;
  }

  /** Get the connected address. */
  getAddress(): string | null {
    return this.connectedAddress;
  }

  /* ---- Balance ---- */

  /**
   * Get balance info for an address.
   * @param address - Bitcoin address (uses connected address if omitted).
   */
  async getBalanceInfo(address?: string): Promise<BitcoinBalanceInfo> {
    const addr = address ?? this.connectedAddress;
    if (!addr) throw new Error('No address provided and no connected address');

    const info = await this.client.getAddressInfo(addr);
    const confirmed = info.chain_stats.funded_txo_sum - info.chain_stats.spent_txo_sum;
    const unconfirmed = info.mempool_stats.funded_txo_sum - info.mempool_stats.spent_txo_sum;

    return {
      confirmed,
      unconfirmed,
      total: confirmed + unconfirmed,
      txCount: info.chain_stats.tx_count,
      mempoolTxCount: info.mempool_stats.tx_count,
    };
  }

  /**
   * Get confirmed balance in satoshis.
   */
  async getBalance(address?: string): Promise<string> {
    const info = await this.getBalanceInfo(address);
    return info.confirmed.toString();
  }

  /* ---- UTXOs ---- */

  /**
   * Get UTXOs for an address.
   */
  async getUTXOs(address?: string): Promise<BlockstreamUTXO[]> {
    const addr = address ?? this.connectedAddress;
    if (!addr) throw new Error('No address provided and no connected address');
    return this.client.getUTXOs(addr);
  }

  /**
   * Get spendable (confirmed) UTXOs.
   */
  async getSpendableUtxos(address?: string): Promise<BlockstreamUTXO[]> {
    const utxos = await this.getUTXOs(address);
    return utxos.filter((u) => u.status.confirmed);
  }

  /**
   * Convert Blockstream UTXOs to coin selection UTXOs.
   */
  async getCoinSelectionUtxos(
    address?: string,
    feeRate?: number,
    format?: BitcoinInputFormat,
  ): Promise<CoinSelectionUTXO[]> {
    const utxos = await this.getSpendableUtxos(address);
    const rate = feeRate ?? (await this.estimateFee()).halfHourFee;
    return prepareUtxos(
      utxos.map((u) => ({
        txid: u.txid,
        vout: u.vout,
        value: u.value,
        confirmations: u.status.block_height ? 1 : 0,
      })),
      rate,
      format ?? this.defaultFormat,
    );
  }

  /* ---- Coin Selection ---- */

  /**
   * Select UTXOs for a target amount.
   * Uses BnB → Knapsack → SRD priority.
   */
  async selectUtxos(
    target: number,
    options?: {
      address?: string;
      feeRate?: number;
      format?: BitcoinInputFormat;
      config?: Partial<CoinSelectionConfig>;
    },
  ): Promise<CoinSelectionResult> {
    const utxos = await this.getCoinSelectionUtxos(
      options?.address,
      options?.feeRate,
      options?.format,
    );

    const feeRate = options?.feeRate ?? (await this.estimateFee()).halfHourFee;

    const config: CoinSelectionConfig = {
      target,
      feeRate,
      ...options?.config,
    };

    return selectCoins(utxos, config);
  }

  /* ---- PSBT ---- */

  /**
   * Build a PSBT for a simple transfer.
   */
  async buildTransferPsbt(
    params: {
      toAddress: string;
      amount: number;
      feeRate?: number;
      changeAddress?: string;
      address?: string;
    },
  ): Promise<PsbtDescriptor> {
    const feeRate = params.feeRate ?? (await this.estimateFee()).halfHourFee;
    const utxos = await this.getUTXOs(params.address);
    const spendableUtxos = utxos.filter((u) => u.status.confirmed);

    if (spendableUtxos.length === 0) {
      throw new Error('No confirmed UTXOs available');
    }

    const csUtxos = prepareUtxos(
      spendableUtxos.map((u) => ({
        txid: u.txid,
        vout: u.vout,
        value: u.value,
        confirmations: 1,
      })),
      feeRate,
      this.defaultFormat,
    );

    const selection = selectCoins(csUtxos, {
      target: params.amount,
      feeRate,
    });

    return buildPsbt({
      utxos: selection.utxos.map((u) => ({
        txid: u.txid,
        vout: u.vout,
        value: u.value,
      })),
      toAddress: params.toAddress,
      amount: params.amount,
      changeAddress: params.changeAddress,
      feeRate,
      inputFormat: this.defaultFormat,
    });
  }

  /**
   * Build a PSBT for multi-recipient transfer.
   */
  async buildMultiOutputPsbt(
    params: {
      recipients: Array<{ address: string; amount: number }>;
      feeRate?: number;
      changeAddress?: string;
      address?: string;
    },
  ): Promise<PsbtDescriptor> {
    const feeRate = params.feeRate ?? (await this.estimateFee()).halfHourFee;
    const utxos = await this.getUTXOs(params.address);
    const spendableUtxos = utxos.filter((u) => u.status.confirmed);

    const csUtxos = prepareUtxos(
      spendableUtxos.map((u) => ({
        txid: u.txid,
        vout: u.vout,
        value: u.value,
        confirmations: 1,
      })),
      feeRate,
      this.defaultFormat,
    );

    const totalAmount = params.recipients.reduce((sum, r) => sum + r.amount, 0);
    const selection = selectCoins(csUtxos, {
      target: totalAmount,
      feeRate,
    });

    return buildMultiOutputPsbt({
      utxos: selection.utxos.map((u) => ({
        txid: u.txid,
        vout: u.vout,
        value: u.value,
      })),
      recipients: params.recipients,
      changeAddress: params.changeAddress,
      feeRate,
      inputFormat: this.defaultFormat,
    });
  }

  /**
   * Sign a PSBT using the connected wallet.
   */
  async signPsbt(psbtData: string): Promise<string> {
    if (!this.connector) throw new Error('No wallet connected');
    const result = await this.connector.signPsbt({ psbt: psbtData });
    return result.psbt;
  }

  /**
   * Build, sign, and broadcast a Bitcoin transfer.
   * This is the main method for sending BTC.
   */
  async sendBitcoin(
    toAddress: string,
    amount: number,
    options?: {
      feeRate?: number;
      address?: string;
    },
  ): Promise<string> {
    // Try wallet's native sendBitcoin first (simpler)
    if (this.connector?.sendTransfer) {
      const feeRate = options?.feeRate ?? (await this.estimateFee()).halfHourFee;
      try {
        const result = await this.connector.sendTransfer({
          recipient: toAddress,
          amount,
          feeRate,
        });
        return result.txid;
      } catch (err) {
        // Fall through to PSBT method
        logger.warn('[BitcoinService] Native sendTransfer failed, falling back to PSBT:', err instanceof Error ? err.message : String(err));
      }
    }

    // PSBT fallback
    const psbt = await this.buildTransferPsbt({
      toAddress,
      amount,
      feeRate: options?.feeRate,
      address: options?.address,
    });

    if (!this.connector) throw new Error('No wallet connected for PSBT signing');

    // Sign
    const signedPsbt = await this.connector.signPsbt({
      psbt: JSON.stringify(psbt),
    });

    // Broadcast
    return this.broadcastPsbt(signedPsbt.psbt);
  }

  /**
   * Broadcast a signed PSBT.
   */
  async broadcastPsbt(signedPsbt: string): Promise<string> {
    if (!this.connector?.sendTransfer) {
      throw new Error(
        'Connected wallet does not support transaction broadcasting. ' +
        'Broadcast the raw transaction hex manually.',
      );
    }

    // Try pushPsbt if available
    const connector = this.connector as BitcoinConnector & {
      pushPsbt?: (psbt: string) => Promise<{ txid: string }>;
    };

    if (connector.pushPsbt) {
      const result = await connector.pushPsbt(signedPsbt);
      return result.txid;
    }

    throw new Error(
      'Connected wallet does not support pushPsbt. ' +
      'Broadcast the raw transaction hex via Blockstream API.',
    );
  }

  /**
   * Broadcast a raw transaction hex.
   */
  async broadcastRaw(rawTxHex: string): Promise<string> {
    return this.client.broadcast(rawTxHex);
  }

  /* ---- Transaction History ---- */

  /**
   * Get transaction history for an address.
   */
  async getTransactionHistory(
    address?: string,
    includeMempool: boolean = true,
  ): Promise<BitcoinTransactionInfo[]> {
    const addr = address ?? this.connectedAddress;
    if (!addr) throw new Error('No address provided and no connected address');

    const txs = await this.client.getTransactions(addr);

    if (includeMempool) {
      const mempoolTxs = await this.client.getMempoolTransactions(addr);
      return [...txs, ...mempoolTxs].map(this._toTransactionInfo);
    }

    return txs.map(this._toTransactionInfo);
  }

  /**
   * Get a single transaction by txid.
   */
  async getTransaction(txid: string): Promise<BitcoinTransactionInfo | null> {
    try {
      const tx = await this.client.getTransaction(txid);
      return this._toTransactionInfo(tx);
    } catch {
      return null;
    }
  }

  /**
   * Get transaction status.
   */
  async getTransactionStatus(txid: string): Promise<BlockstreamTxStatus> {
    return this.client.getTransactionStatus(txid);
  }

  /**
   * Wait for a transaction to be confirmed.
   */
  async waitForConfirmation(
    txid: string,
    timeoutMs?: number,
    intervalMs?: number,
  ): Promise<BlockstreamTxStatus> {
    return this.client.waitForConfirmation(txid, timeoutMs, intervalMs);
  }

  /* ---- Fee Estimation ---- */

  /**
   * Get current fee estimates.
   */
  async estimateFee(): Promise<BlockstreamFeeEstimate> {
    return this.client.getFeeEstimate(this.network);
  }

  /* ---- Network Info ---- */

  /**
   * Get current block height.
   */
  async getBlockHeight(): Promise<number> {
    return this.client.getBlockHeight();
  }

  /* ---- Utility ---- */

  /**
   * Convert satoshis to BTC string.
   */
  static satoshisToBtc(satoshis: number): string {
    return (satoshis / 1e8).toFixed(8);
  }

  /**
   * Convert BTC to satoshis.
   */
  static btcToSatoshis(btc: string | number): number {
    return Math.round(Number(btc) * 1e8);
  }

  /**
   * Get the explorer URL for a transaction.
   */
  getExplorerTxUrl(txid: string): string {
    const preset = BITCOIN_NETWORKS[this.network];
    return `${preset.explorerUrl}/tx/${txid}`;
  }

  /**
   * Get the explorer URL for an address.
   */
  getExplorerAddressUrl(address: string): string {
    const preset = BITCOIN_NETWORKS[this.network];
    return `${preset.explorerUrl}/address/${address}`;
  }

  /* ---- Private ---- */

  private _toTransactionInfo(tx: BlockstreamTransaction): BitcoinTransactionInfo {
    const totalInput = tx.vin.reduce((sum, i) => sum + i.prevout.value, 0);
    const totalOutput = tx.vout.reduce((sum, o) => sum + o.value, 0);

    return {
      txid: tx.txid,
      confirmed: tx.status.confirmed,
      blockHeight: tx.status.block_height,
      blockTime: tx.status.block_time,
      fee: tx.fee,
      size: tx.size,
      weight: tx.weight,
      inputs: tx.vin.length,
      outputs: tx.vout.length,
      totalInput,
      totalOutput,
    };
  }
}
