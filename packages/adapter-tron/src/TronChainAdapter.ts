/**
 * TRON Chain Adapter — standalone TypeScript package using TronWeb.
 *
 * Implements the {@link ChainAdapter} interface from @cinacoin/core-sdk
 * and provides TRON-specific operations via the TronWeb RPC client.
 *
 * Features:
 *  - Native TRX balance queries and transfers
 *  - TRC-20 token balance queries
 *  - Smart contract triggering
 *  - Energy & bandwidth estimation
 *  - Base58 address validation
 *  - Mainnet & Shasta testnet support
 *  - Message signing via connected wallet
 *
 * @example
 * ```ts
 * import { TronChainAdapter, TRON_CHAINS } from '@cinacoin/adapter-tron';
 *
 * const adapter = new TronChainAdapter();
 * adapter.registerChains(TRON_CHAINS);
 *
 * const balance = await adapter.getBalance('TNA2B...');
 * console.log(`${balance} sun`);
 * ```
 *
 * @packageDocumentation
 */

import type { Connector, Chain, ChainAdapter } from '@cinacoin/core-sdk';
import TronWeb from 'tronweb';

// TronWeb lacks proper TypeScript types
const TronWebAny = TronWeb as any;

/* ------------------------------------------------------------------ */
/*  CinacoinError — standardised error class                           */
/* ------------------------------------------------------------------ */

/** Standard Cinacoin error with an optional error code. */
export class CinacoinError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'CinacoinError';
    this.code = code;
  }
}

/* ------------------------------------------------------------------ */
/*  Address validation                                                */
/* ------------------------------------------------------------------ */

/** Validate a TRON address (base58 format). */
function isValidTRONAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  // Basic TRON address validation (41 chars starting with T)
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
}

/* ------------------------------------------------------------------ */
/*  TRON chain configurations                                         */
/* ------------------------------------------------------------------ */

/** TRON mainnet configuration. */
export const TRON_MAINNET: Chain = {
  id: 'tron:mainnet',
  name: 'TRON Mainnet',
  rpcUrl: 'https://api.trongrid.io',
  nativeCurrency: { name: 'TRX', symbol: 'TRX', decimals: 6 },
  explorerUrl: 'https://tronscan.org',
};

/** TRON chain numeric IDs for cross-chain compatibility. */
export const TRON_CHAIN_IDS: Record<string, number> = {
  'tron:mainnet': 728126428,
  'tron:shasta': 2494104990,
  'tron:nile': 3448148180,
};

/** TRON Shasta testnet configuration. */
export const TRON_SHASTA: Chain = {
  id: 'tron:shasta',
  name: 'TRON Shasta Testnet',
  rpcUrl: 'https://api.shasta.trongrid.io',
  nativeCurrency: { name: 'TRX', symbol: 'TRX', decimals: 6 },
  explorerUrl: 'https://shasta.tronscan.org',
};

/** TRON Nile testnet configuration. */
export const TRON_NILE: Chain = {
  id: 'tron:nile',
  name: 'TRON Nile Testnet',
  rpcUrl: 'https://api.nileex.io',
  nativeCurrency: { name: 'TRX', symbol: 'TRX', decimals: 6 },
  explorerUrl: 'https://nile.tronscan.org',
};

/** All supported TRON chains. */
export const TRON_CHAINS = [TRON_MAINNET, TRON_SHASTA, TRON_NILE];

/* ------------------------------------------------------------------ */
/*  TronChainAdapter implementation                                   */
/* ------------------------------------------------------------------ */

/**
 * TRON Chain Adapter — standalone TypeScript package using TronWeb.
 *
 * Implements the {@link ChainAdapter} interface from @cinacoin/core-sdk
 * and provides TRON-specific operations via the TronWeb RPC client.
 *
 * Features:
 *  - Native TRX balance queries and transfers
 *  - TRC-20 token balance queries
 *  - Smart contract triggering
 *  - Energy & bandwidth estimation
 *  - Base58 address validation
 *  - Mainnet & Shasta testnet support
 *  - Message signing via connected wallet
 *
 * @example
 * ```ts
 * import { TronChainAdapter, TRON_CHAINS } from '@cinacoin/adapter-tron';
 *
 * const adapter = new TronChainAdapter();
 * adapter.registerChains(TRON_CHAINS);
 *
 * const balance = await adapter.getBalance('TNA2B...');
 * console.log(`${balance} sun`);
 * ```
 *
 * @packageDocumentation
 */
export class TronChainAdapter implements ChainAdapter {
  readonly id = 'tron-adapter';
  readonly name = 'TRON Chain Adapter';

  private tronWeb: any | null = null;
  private chains: Chain[] = [];
  private _connector: Connector | null = null;
  private _connectedAddress: string | null = null;
  private _privateKey: string | undefined;

  /**
   * Create a new TronChainAdapter.
   *
   * @param privateKey - Optional private key for signing (server-side usage).
   *   In browser environments, signing is delegated to TronLink.
   */
  constructor(privateKey?: string) {
    this._privateKey = privateKey;
  }

  /* ---- ChainAdapter Interface ---- */

  /** Set the TronWeb client or any compatible client object. */
  setClient(client: unknown): void {
    if (client && typeof (client as any).trx === 'object') {
      // Accept duck-typed TronWeb-like object
      this.tronWeb = client;
    } else {
      throw new CinacoinError('Client must be a TronWeb-compatible object', 'INVALID_CLIENT');
    }
  }

  /** Set the Cinacoin connector. */
  setConnector(connector: Connector): void {
    this._connector = connector;
  }

  /** Register supported chains. */
  registerChains(chains: Chain[]): void {
    this.chains = chains;
  }

  /** Find a chain by numeric ID. */
  findChain(chainId: number): Chain | undefined {
    // TRON uses specific numeric chain IDs, not EVM-style chainIds
    // Map numeric IDs to TRON chain configurations
    for (const chain of this.chains) {
      const numId = TRON_CHAIN_IDS[chain.id];
      if (numId === chainId) return chain;
    }
    return undefined;
  }

  /** Get connected account addresses. */
  async getAccounts(): Promise<string[]> {
    if (this._connectedAddress) {
      return [this._connectedAddress];
    }
    
    if (this.tronWeb && typeof this.tronWeb.defaultAddress === 'object') {
      const addr = this.tronWeb.defaultAddress.base58;
      if (isValidTRONAddress(addr)) {
        this._connectedAddress = addr;
        return [addr];
      }
    }
    
    // Try to get from connector if available
    if (this._connector) {
      const accounts = await this._connector.getAccounts();
      if (accounts.length > 0) {
        const addr = accounts[0];
        if (isValidTRONAddress(addr)) {
          this._connectedAddress = addr;
          return [addr];
        }
      }
    }
    
    return [];
  }

  /** Get native balance for an address. */
  async getBalance(address: string): Promise<string> {
    if (!isValidTRONAddress(address)) {
      throw new CinacoinError(`Invalid TRON address: ${address}`, 'INVALID_ADDRESS');
    }

    const client = this._ensureClient();
    try {
      const balance = await client.trx.getBalance(address);
      return String(balance);
    } catch (err) {
      throw new CinacoinError(
        `Failed to get balance for ${address}: ${err instanceof Error ? err.message : String(err)}`,
        'RPC_ERROR'
      );
    }
  }

  /** Send a transaction. */
  async sendTransaction(tx: unknown): Promise<string> {
    // TRON-specific transaction: expect { from, to, amount }
    const params = tx as { from?: string; to: string; amount: string | bigint };
    const to = params.to;
    const amount = params.amount;
    
    if (!isValidTRONAddress(to)) {
      throw new CinacoinError(`Invalid recipient address: ${to}`, 'INVALID_ADDRESS');
    }

    const client = this._ensureClient();
    const amountNum = typeof amount === 'bigint' ? Number(amount) : parseInt(amount as string, 10);

    try {
      // If we have a private key (server-side), sign and send directly
      if (this._privateKey) {
        client.setPrivateKey(this._privateKey);
        const txObj = await client.transactionBuilder.sendTrx(to, amountNum);
        const signedTx = await client.trx.sign(txObj);
        const result = await client.trx.sendRawTransaction(signedTx);
        if (result.result) {
          return result.transaction.txID;
        } else {
          throw new CinacoinError(`Transaction failed: ${result.message}`, 'TX_FAILED');
        }
      } else {
        // Browser environment: delegate to TronLink or similar
        const tx = await client.trx.sendTransaction(to, amountNum);
        if (tx && typeof tx === 'object' && 'txID' in tx) {
          return tx.txID as string;
        } else {
          return String(tx);
        }
      }
    } catch (err) {
      throw new CinacoinError(
        `Failed to send transaction: ${err instanceof Error ? err.message : String(err)}`,
        'TX_ERROR'
      );
    }
  }

  /** Sign a message. */
  async signMessage(message: string): Promise<string> {
    if (!this._connectedAddress) {
      throw new CinacoinError('No wallet connected', 'NOT_CONNECTED');
    }

    const client = this._ensureClient();
    try {
      // TRON message signing
      const signature = await client.trx.sign(message);
      return signature;
    } catch (err) {
      throw new CinacoinError(
        `Failed to sign message: ${err instanceof Error ? err.message : String(err)}`,
        'SIGN_ERROR'
      );
    }
  }

  /** Switch to a different chain. */
  async switchChain(chainId: number): Promise<void> {
    const chain = this.findChain(chainId);
    if (!chain) {
      throw new CinacoinError(`Unsupported chain ID: ${chainId}`, 'UNSUPPORTED_CHAIN');
    }
    
    // Update client RPC URL if needed
    if (this.tronWeb && chain.rpcUrl) {
      // Note: TronWeb doesn't easily support dynamic RPC switching
      // This would require creating a new instance
      console.warn('Chain switching not fully supported in TronWeb');
    }
  }

  /** Get the latest block number. */
  async getLatestBlock(): Promise<number> {
    const client = this._ensureClient();
    try {
      const block = await client.trx.getCurrentBlock();
      return block.block_header.raw_data.number;
    } catch (err) {
      throw new CinacoinError(
        `Failed to get latest block: ${err instanceof Error ? err.message : String(err)}`,
        'RPC_ERROR'
      );
    }
  }

  /** Estimate gas/energy for a transaction. */
  async estimateFee(tx: unknown): Promise<bigint> {
    // TRON uses energy and bandwidth instead of gas
    const params = tx as { to: string; amount: string | bigint };
    const to = params.to;
    const amount = params.amount;
    
    if (!isValidTRONAddress(to)) {
      throw new CinacoinError(`Invalid recipient address: ${to}`, 'INVALID_ADDRESS');
    }

    const client = this._ensureClient();
    const amountNum = typeof amount === 'bigint' ? Number(amount) : parseInt(amount as string, 10);
    
    try {
      // Estimate energy consumption for transfer
      const energy = await client.trx.calculateEnergy(to, amountNum);
      // Convert to approximate fee in SUN
      return BigInt(Math.max(energy, 10000)); // Minimum fee
    } catch (err) {
      throw new CinacoinError(
        `Failed to estimate fee: ${err instanceof Error ? err.message : String(err)}`,
        'ESTIMATE_ERROR'
      );
    }
  }

  /* ---- TRON-Specific Methods ---- */

  /**
   * Get TRC-20 token balance for an address.
   *
   * @param address - Wallet address.
   * @param contractAddress - TRC-20 contract address.
   * @returns Token balance as string.
   */
  async getTRC20Balance(address: string, contractAddress: string): Promise<string> {
    if (!isValidTRONAddress(address)) {
      throw new CinacoinError(`Invalid wallet address: ${address}`, 'INVALID_ADDRESS');
    }
    if (!isValidTRONAddress(contractAddress)) {
      throw new CinacoinError(`Invalid contract address: ${contractAddress}`, 'INVALID_ADDRESS');
    }

    const client = this._ensureClient();
    try {
      const contract = await client.contract().at(contractAddress);
      const balance = await contract.balanceOf(address).call();
      return String(balance);
    } catch (err) {
      throw new CinacoinError(
        `Failed to get TRC-20 balance: ${err instanceof Error ? err.message : String(err)}`,
        'TOKEN_ERROR'
      );
    }
  }

  /**
   * Trigger a smart contract function.
   *
   * @param contractAddress - Contract address.
   * @param functionName - Function name to call.
   * @param params - Function parameters.
   * @returns Transaction ID.
   */
  async triggerSmartContract(
    contractAddress: string,
    functionName: string,
    params: Record<string, unknown> = {}
  ): Promise<string> {
    if (!isValidTRONAddress(contractAddress)) {
      throw new CinacoinError(`Invalid contract address: ${contractAddress}`, 'INVALID_ADDRESS');
    }

    const client = this._ensureClient();
    try {
      const contract = await client.contract().at(contractAddress);
      const tx = await contract[functionName](...Object.values(params)).send();
      return tx.txID;
    } catch (err) {
      throw new CinacoinError(
        `Failed to trigger contract: ${err instanceof Error ? err.message : String(err)}`,
        'CONTRACT_ERROR'
      );
    }
  }

  /**
   * Estimate energy and bandwidth consumption for a transaction.
   *
   * @param amount - Transaction amount in SUN.
   * @param isContractInteraction - Whether this is a contract interaction.
   * @returns Object with energy and bandwidth estimates.
   */
  async estimateEnergyBandwidth(amount: bigint | number, isContractInteraction = false): Promise<{
    energy: number;
    bandwidth: number;
  }> {
    const amountNum = typeof amount === 'bigint' ? Number(amount) : amount;
    // Simplified estimation logic
    const baseBandwidth = 200; // Base bandwidth for simple transfer
    const baseEnergy = isContractInteraction ? 50000 : 0; // Energy only for contracts
    
    return {
      energy: baseEnergy,
      bandwidth: baseBandwidth + Math.floor(amountNum / 1000000), // Scale with amount
    };
  }

  /* ---- Internal Helpers ---- */

  /** Ensure a TronWeb client is available. */
  private _ensureClient(): any {
    if (!this.tronWeb) {
      throw new CinacoinError('TronWeb client not initialized', 'CLIENT_NOT_READY');
    }
    return this.tronWeb;
  }

  /** Convert SUN to TRX. */
  sunToTRX(sun: bigint | number): number {
    return Number(sun) / 1_000_000;
  }

  /** Convert TRX to SUN. */
  trxToSun(trx: number): bigint {
    return BigInt(Math.round(trx * 1_000_000));
  }
}
