/**
 * Blockstream API client for Bitcoin network operations.
 *
 * Provides REST API access to:
 * - UTXO set queries
 * - Address balance
 * - Transaction history
 * - Transaction broadcast
 * - Fee estimation
 *
 * Supports mainnet, testnet, signet, and liquid networks.
 *
 * @see https://blockstream.info/api/
 */

/** Blockstream API network identifiers. */
export type BlockstreamNetwork = 'mainnet' | 'testnet' | 'testnet4' | 'signet' | 'liquid';

/** Blockstream API configuration. */
export interface BlockstreamConfig {
  /** Network to query. */
  network?: BlockstreamNetwork;
  /** Custom API base URL (overrides default). */
  baseUrl?: string;
  /** Request timeout in milliseconds. */
  timeoutMs?: number;
}

/** UTXO from Blockstream API. */
export interface BlockstreamUTXO {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
  value: number;
}

/** Blockstream transaction output script. */
export interface BlockstreamScript {
  asm: string;
  desc: string;
  hex: string;
  address?: string;
  type: string;
}

/** Blockstream transaction status. */
export interface BlockstreamTxStatus {
  confirmed: boolean;
  block_height?: number;
  block_hash?: string;
  block_time?: number;
}

/** Blockstream transaction input. */
export interface BlockstreamTxIn {
  txid: string;
  vout: number;
  prevout: {
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address?: string;
    value: number;
  };
  scriptsig?: string;
  scriptsig_asm?: string;
  witness?: string[];
  is_coinbase: boolean;
  sequence: number;
}

/** Blockstream transaction output. */
export interface BlockstreamTxOut {
  scriptpubkey: string;
  scriptpubkey_asm: string;
  scriptpubkey_type: string;
  scriptpubkey_address?: string;
  value: number;
}

/** Blockstream transaction. */
export interface BlockstreamTransaction {
  txid: string;
  version: number;
  locktime: number;
  vin: BlockstreamTxIn[];
  vout: BlockstreamTxOut[];
  size: number;
  weight: number;
  fee: number;
  status: BlockstreamTxStatus;
}

/** Blockstream address info. */
export interface BlockstreamAddressInfo {
  address: string;
  chain_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
  mempool_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
}

/** Fee estimate from Blockstream. */
export interface BlockstreamFeeEstimate {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

/** Default Blockstream API base URLs by network. */
const DEFAULT_BASE_URLS: Record<BlockstreamNetwork, string> = {
  mainnet: 'https://blockstream.info/api',
  testnet: 'https://blockstream.info/testnet/api',
  testnet4: 'https://blockstream.info/testnet4/api',
  signet: 'https://blockstream.info/signet/api',
  liquid: 'https://blockstream.info/liquid/api',
};

/**
 * Blockstream API client for Bitcoin network operations.
 */
export class BlockstreamClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config?: BlockstreamConfig) {
    const network = config?.network ?? 'mainnet';
    this.baseUrl = config?.baseUrl ?? DEFAULT_BASE_URLS[network];
    this.timeoutMs = config?.timeoutMs ?? 10_000;
  }

  /**
   * Get the base URL for this client.
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Fetch a URL with timeout.
   */
  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(
          `Blockstream API error ${response.status}: ${response.statusText}${body ? ` — ${body}` : ''}`,
        );
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      return response.json() as Promise<T>;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /* ---- Address Operations ---- */

  /**
   * Get address info (chain + mempool stats).
   */
  async getAddressInfo(address: string): Promise<BlockstreamAddressInfo> {
    return this.fetch<BlockstreamAddressInfo>(`/address/${address}`);
  }

  /**
   * Get confirmed balance in satoshis.
   */
  async getBalance(address: string): Promise<number> {
    const info = await this.getAddressInfo(address);
    return info.chain_stats.funded_txo_sum - info.chain_stats.spent_txo_sum;
  }

  /**
   * Get total balance (confirmed + unconfirmed).
   */
  async getTotalBalance(address: string): Promise<number> {
    const info = await this.getAddressInfo(address);
    const confirmed = info.chain_stats.funded_txo_sum - info.chain_stats.spent_txo_sum;
    const mempool = info.mempool_stats.funded_txo_sum - info.mempool_stats.spent_txo_sum;
    return confirmed + mempool;
  }

  /**
   * Get UTXOs for an address.
   */
  async getUTXOs(address: string): Promise<BlockstreamUTXO[]> {
    return this.fetch<BlockstreamUTXO[]>(`/address/${address}/utxo`);
  }

  /**
   * Get confirmed transactions for an address.
   */
  async getTransactions(address: string): Promise<BlockstreamTransaction[]> {
    return this.fetch<BlockstreamTransaction[]>(`/address/${address}/txs`);
  }

  /**
   * Get mempool transactions for an address.
   */
  async getMempoolTransactions(address: string): Promise<BlockstreamTransaction[]> {
    return this.fetch<BlockstreamTransaction[]>(`/address/${address}/txs/mempool`);
  }

  /* ---- Transaction Operations ---- */

  /**
   * Get a transaction by txid.
   */
  async getTransaction(txid: string): Promise<BlockstreamTransaction> {
    return this.fetch<BlockstreamTransaction>(`/tx/${txid}`);
  }

  /**
   * Get transaction hex (raw transaction).
   */
  async getTransactionHex(txid: string): Promise<string> {
    return this.fetch<string>(`/tx/${txid}/hex`, {
      headers: { Accept: 'text/plain' },
    });
  }

  /**
   * Get transaction status.
   */
  async getTransactionStatus(txid: string): Promise<BlockstreamTxStatus> {
    return this.fetch<BlockstreamTxStatus>(`/tx/${txid}/status`);
  }

  /**
   * Get transaction fee (in satoshis).
   */
  async getTransactionFee(txid: string): Promise<number> {
    const tx = await this.getTransaction(txid);
    return tx.fee;
  }

  /**
   * Broadcast a raw transaction (hex).
   * @param rawTx - Raw transaction hex.
   * @returns Transaction ID.
   */
  async broadcast(rawTx: string): Promise<string> {
    return this.fetch<string>('/tx', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: rawTx,
    });
  }

  /**
   * Broadcast a raw transaction with retry.
   * Some Blockstream instances return errors on first attempt.
   */
  async broadcastWithRetry(
    rawTx: string,
    maxRetries: number = 3,
    delayMs: number = 2000,
  ): Promise<string> {
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.broadcast(rawTx);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        }
      }
    }
    throw lastError ?? new Error('Broadcast failed after retries');
  }

  /**
   * Check if a transaction is in the mempool.
   */
  async isInMempool(txid: string): Promise<boolean> {
    try {
      await this.getTransaction(txid);
      const status = await this.getTransactionStatus(txid);
      return !status.confirmed;
    } catch {
      return false;
    }
  }

  /**
   * Wait for a transaction to be confirmed.
   * Polls the transaction status until confirmed or timeout.
   */
  async waitForConfirmation(
    txid: string,
    timeoutMs: number = 600_000,
    intervalMs: number = 5000,
  ): Promise<BlockstreamTxStatus> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const status = await this.getTransactionStatus(txid);
        if (status.confirmed) return status;
      } catch {
        // Transaction not found yet, keep polling
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error(`Transaction ${txid} not confirmed within ${timeoutMs}ms`);
  }

  /* ---- Fee Estimation ---- */

  /**
   * Get fee estimates (sat/vB) from mempool.space.
   * Blockstream.info doesn't have a fee endpoint, so we use mempool.space.
   */
  async getFeeEstimate(network?: BlockstreamNetwork): Promise<BlockstreamFeeEstimate> {
    const net = network ?? 'mainnet';
    const baseUrl = net === 'mainnet'
      ? 'https://mempool.space/api'
      : `https://mempool.space/${net}/api`;

    const response = await fetch(`${baseUrl}/v1/fees/recommended`, {
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Fee estimation error ${response.status}`);
    }

    return response.json() as Promise<BlockstreamFeeEstimate>;
  }

  /**
   * Get current block height.
   */
  async getBlockHeight(): Promise<number> {
    const response = await this.fetch<string>('/blocks/tip/height', {
      headers: { Accept: 'text/plain' },
    });
    return parseInt(response, 10);
  }

  /**
   * Get latest block hash.
   */
  async getBlockHash(): Promise<string> {
    return this.fetch<string>('/blocks/tip/hash', {
      headers: { Accept: 'text/plain' },
    });
  }

  /**
   * Get block info by hash or height.
   */
  async getBlock(hashOrHeight: string | number): Promise<{
    id: string;
    height: number;
    version: number;
    timestamp: number;
    tx_count: number;
    size: number;
    weight: number;
    merkle_root: string;
    previousblockhash?: string;
    mediantime: number;
    nonce: number;
    bits: number;
    difficulty: number;
  }> {
    return this.fetch(`/block/${hashOrHeight}`);
  }

  /**
   * Get recent blocks.
   */
  async getRecentBlocks(count: number = 10): Promise<Array<{
    id: string;
    height: number;
    timestamp: number;
    tx_count: number;
  }>> {
    return this.fetch('/blocks');
  }
}

/**
 * Validate a Bitcoin address format (basic regex check).
 */
export function validateBitcoinAddress(address: string): {
  valid: boolean;
  format: 'legacy' | 'p2sh' | 'p2wpkh' | 'p2tr' | 'unknown';
  network: 'mainnet' | 'testnet' | 'unknown';
} {
  if (!address || typeof address !== 'string') {
    return { valid: false, format: 'unknown', network: 'unknown' };
  }

  // Legacy P2PKH (mainnet: 1..., testnet: m/n...)
  if (/^1[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address)) {
    return { valid: true, format: 'legacy', network: 'mainnet' };
  }
  if (/^[mn2][1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address)) {
    return { valid: true, format: 'legacy', network: 'testnet' };
  }

  // P2SH (mainnet: 3..., testnet: 2...)
  if (/^3[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address)) {
    return { valid: true, format: 'p2sh', network: 'mainnet' };
  }
  if (/^2[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address)) {
    return { valid: true, format: 'p2sh', network: 'testnet' };
  }

  // Bech32 (P2WPKH: bc1q/tb1q, P2TR: bc1p/tb1p)
  const bech32Lower = address.toLowerCase();

  // Native SegWit (P2WPKH)
  if (/^(bc1q|tb1q|bcrt1q)[a-z0-9]{39}$/.test(bech32Lower)) {
    const net = bech32Lower.startsWith('bc1') ? 'mainnet' : 'testnet';
    return { valid: true, format: 'p2wpkh', network: net };
  }

  // Taproot (P2TR)
  if (/^(bc1p|tb1p|bcrt1p)[a-z0-9]{59}$/.test(bech32Lower)) {
    const net = bech32Lower.startsWith('bc1') ? 'mainnet' : 'testnet';
    return { valid: true, format: 'p2tr', network: net };
  }

  return { valid: false, format: 'unknown', network: 'unknown' };
}
