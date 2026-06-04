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
 *
 * const trc20Bal = await adapter.getTRC20Balance(walletAddr, contractAddr);
 * console.log(`${trc20Bal} token units`);
 * ```
 *
 * @packageDocumentation
 */

import type { Connector, Chain, ChainAdapter } from '@cinacoin/core-sdk';
import TronWeb from 'tronweb';

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
/*  TRON Address helpers                                                */
/* ------------------------------------------------------------------ */

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Validate a TRON address (base58 format with 'T' prefix).
 *
 * Rules:
 *  - Starts with 'T'
 *  - Exactly 34 characters
 *  - Contains only valid base58 characters
 */
export function isValidTRONAddress(address: string): boolean {
  if (typeof address !== 'string') return false;
  if (!address.startsWith('T') || address.length !== 34) return false;
  for (let i = 0; i < address.length; i++) {
    if (BASE58_ALPHABET.indexOf(address[i]) === -1) return false;
  }
  return true;
}

/**
 * Decode a base58 string to hex.
 */
export function base58ToHex(address: string): string {
  let num = 0n;
  for (let i = 0; i < address.length; i++) {
    const charIndex = BASE58_ALPHABET.indexOf(address[i]);
    if (charIndex === -1) throw new CinacoinError(`Invalid base58 character: ${address[i]}`, 'INVALID_BASE58');
    num = num * 58n + BigInt(charIndex);
  }

  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num % 256n));
    num = num / 256n;
  }

  // Leading '1's → leading zero bytes
  for (let i = 0; i < address.length && address[i] === '1'; i++) {
    bytes.unshift(0);
  }

  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encode hex to base58.
 */
export function hexToBase58(hex: string): string {
  let num = BigInt('0x' + hex);
  if (num === 0n) return '1';

  let encoded = '';
  while (num > 0n) {
    const remainder = Number(num % 58n);
    encoded = BASE58_ALPHABET[remainder] + encoded;
    num = num / 58n;
  }

  // Leading zero bytes → leading '1's
  for (let i = 0; i < hex.length / 2; i++) {
    if (hex.slice(i * 2, i * 2 + 2) !== '00') break;
    encoded = '1' + encoded;
  }

  return encoded;
}

/* ------------------------------------------------------------------ */
/*  Chain presets                                                       */
/* ------------------------------------------------------------------ */

/** Well-known TRON chain presets. */
export const TRON_CHAINS: Chain[] = [
  {
    id: 'tron:mainnet',
    name: 'TRON Mainnet',
    rpcUrl: 'https://api.trongrid.io',
    nativeCurrency: { name: 'TRON', symbol: 'TRX', decimals: 6 },
    explorerUrl: 'https://tronscan.org',
    iconUrl: 'https://cryptologos.cc/logos/tron-trx-logo.svg',
  },
  {
    id: 'tron:shasta',
    name: 'TRON Shasta Testnet',
    rpcUrl: 'https://api.shasta.trongrid.io',
    nativeCurrency: { name: 'Shasta TRX', symbol: 'tTRX', decimals: 6 },
    explorerUrl: 'https://shasta.tronscan.org',
    iconUrl: 'https://cryptologos.cc/logos/tron-trx-logo.svg',
  },
  {
    id: 'tron:nile',
    name: 'TRON Nile Testnet',
    rpcUrl: 'https://nile.trongrid.io',
    nativeCurrency: { name: 'Nile TRX', symbol: 'tTRX', decimals: 6 },
    explorerUrl: 'https://nile.tronscan.org',
    iconUrl: 'https://cryptologos.cc/logos/tron-trx-logo.svg',
  },
];

/* ------------------------------------------------------------------ */
/*  TRON-specific types                                                 */
/* ------------------------------------------------------------------ */

/** Parameters for triggering a smart contract function call. */
export interface TriggerSmartContractParams {
  /** Contract address (base58). */
  contractAddress: string;
  /** Function name. */
  functionName: string;
  /** ABI / parameter map for the function call. */
  params?: Record<string, unknown>;
  /** Amount of TRX to send with the call (in sun). */
  callValue?: string;
  /** Fee limit in sun. */
  feeLimit?: number;
}

/** Estimated energy / bandwidth for a transaction. */
export interface EnergyBandwidthEstimate {
  /** Estimated energy units required. */
  energy: number;
  /** Estimated bandwidth (bytes) required. */
  bandwidth: number;
  /** Estimated TRX cost if energy is burned. */
  estimatedCostSun: number;
}

/* ------------------------------------------------------------------ */
/*  TronChainAdapter                                                    */
/* ------------------------------------------------------------------ */

/**
 * TRON chain adapter implementing the {@link ChainAdapter} interface.
 *
 * Uses `TronWeb` for RPC communication with the TRON blockchain.
 * Supports mainnet, Shasta, and Nile testnets. Provides TRX transfers,
 * TRC-20 token queries, smart contract interaction, and energy/bandwidth
 * estimation.
 */
export class TronChainAdapter implements ChainAdapter {
  readonly id = 'tron-adapter';
  readonly name = 'TRON Chain Adapter';

  private tronWeb: TronWeb | null = null;
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
    if (client instanceof TronWeb) {
      this.tronWeb = client;
    } else if (client && typeof (client as TronWeb).trx === 'object') {
      // Accept duck-typed TronWeb-like object
      this.tronWeb = client as TronWeb;
    } else {
      throw new CinacoinError('Client must be an instance of TronWeb', 'INVALID_CLIENT');
    }
  }

  /** Set the Cinacoin connector. */
  setConnector(connector: Connector): void {
    this._connector = connector;
  }

  /** Register supported TRON chains. */
  registerChains(chains: Chain[]): void {
    this.chains = chains;
    if (!this.tronWeb && chains.length > 0) {
      this._initClient(chains[0]);
    }
  }

  /** Find a chain by numeric ID — TRON doesn't use numeric chain IDs here. */
  findChain(_chainId: number): Chain | undefined {
    return this.chains[0];
  }

  /**
   * Get connected account addresses.
   * Returns the connected address or an empty array.
   */
  async getAccounts(): Promise<string[]> {
    return this._connectedAddress ? [this._connectedAddress] : [];
  }

  /**
   * Get TRX balance for an address.
   *
   * @param address - TRON address (base58 format, starts with 'T').
   * @returns Balance in sun (1 TRX = 1,000,000 sun) as a string.
   */
  async getBalance(address: string): Promise<string> {
    if (!isValidTRONAddress(address)) {
      throw new CinacoinError(`Invalid TRON address: ${address}`, 'INVALID_ADDRESS');
    }

    const client = this._ensureClient();

    try {
      const balance = await client.trx.getBalance(address);
      return balance.toString();
    } catch (err) {
      throw new CinacoinError(
        `Failed to get balance: ${err instanceof Error ? err.message : String(err)}`,
        'RPC_ERROR',
      );
    }
  }

  /**
   * Send a TRX transfer transaction.
   *
   * @param from - Sender address.
   * @param to - Recipient address.
   * @param amount - Amount in sun (string or bigint).
   * @returns Transaction ID (hex string).
   */
  async sendTransaction(
    from: string,
    to: string,
    amount: string | bigint,
  ): Promise<string> {
    if (!isValidTRONAddress(to)) {
      throw new CinacoinError(`Invalid recipient address: ${to}`, 'INVALID_ADDRESS');
    }

    const client = this._ensureClient();
    const amountNum = typeof amount === 'bigint' ? Number(amount) : parseInt(amount, 10);

    try {
      // If we have a private key (server-side), sign and send directly
      if (this._privateKey) {
        client.setPrivateKey(this._privateKey);
      }

      const tx = await client.trx.sendTransaction(to, amountNum);

      if (tx && typeof tx === 'object') {
        const record = tx as Record<string, unknown>;
        // TronWeb returns { txid: string } or { result: boolean, txid: string }
        if (typeof record.txid === 'string') {
          return record.txid;
        }
        // Some versions wrap differently
        if (record.result === true && typeof record.txid === 'string') {
          return record.txid;
        }
      }

      // Fallback: return empty or throw
      throw new CinacoinError('Transaction sent but no txid returned', 'TX_NO_ID');
    } catch (err) {
      if (err instanceof CinacoinError) throw err;
      throw new CinacoinError(
        `Failed to send transaction: ${err instanceof Error ? err.message : String(err)}`,
        'TX_SEND_ERROR',
      );
    }
  }

  /**
   * Get the latest block number on the TRON blockchain.
   *
   * @returns Latest block number.
   */
  async getLatestBlock(): Promise<number> {
    const client = this._ensureClient();

    try {
      const block = await client.trx.getCurrentBlock();
      return (block as Record<string, unknown>)?.number as number ?? 0;
    } catch (err) {
      throw new CinacoinError(
        `Failed to get latest block: ${err instanceof Error ? err.message : String(err)}`,
        'RPC_ERROR',
      );
    }
  }

  /**
   * Estimate fee (energy + bandwidth) for a transaction.
   *
   * @param _tx - Transaction parameters (simplified).
   * @returns Energy and bandwidth estimate.
   */
  async estimateFee(_tx: unknown): Promise<bigint> {
    // Standard TRX transfer fee baseline: ~0.01 TRX (10,000 sun) for bandwidth.
    // Smart contract interactions require additional energy.
    // A rough estimate without inspecting the specific transaction.
    try {
      const client = this._ensureClient();
      // Use TronWeb's energy estimation if available
      // For now, return a baseline estimate
      return 10_000n; // ~0.01 TRX baseline
    } catch {
      return 10_000n;
    }
  }

  /**
   * Get TRC-20 token balance for an address.
   *
   * @param address - Wallet address (base58).
   * @param contractAddress - TRC-20 contract address (base58).
   * @returns Token balance in the smallest unit as a string.
   */
  async getTRC20Balance(
    address: string,
    contractAddress: string,
  ): Promise<string> {
    if (!isValidTRONAddress(address)) {
      throw new CinacoinError(`Invalid wallet address: ${address}`, 'INVALID_ADDRESS');
    }
    if (!isValidTRONAddress(contractAddress)) {
      throw new CinacoinError(
        `Invalid contract address: ${contractAddress}`,
        'INVALID_ADDRESS',
      );
    }

    const client = this._ensureClient();

    try {
      const contract = client.contract().at(contractAddress);
      const balance = await contract.methods.balanceOf(address).call();
      return String(balance);
    } catch (err) {
      // Fallback: use the HTTP API
      try {
        const hexAddr = client.address.toHex(address);
        const hexContract = client.address.toHex(contractAddress);

        const response = await fetch(
          `${client.fullNode.host}/wallet/triggerconstantcontract`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              owner_address: hexAddr,
              contract_address: hexContract,
              function_selector: 'balanceOf(address)',
              parameter: client.address.toHex(address).slice(2).padStart(64, '0'),
              visible: true,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data.result?.result && data.result?.message) {
          // Decode the hex result (uint256)
          const resultHex = data.result.message;
          return BigInt('0x' + resultHex).toString();
        }

        return '0';
      } catch (apiErr) {
        throw new CinacoinError(
          `Failed to get TRC-20 balance: ${apiErr instanceof Error ? apiErr.message : String(apiErr)}`,
          'TRC20_ERROR',
        );
      }
    }
  }

  /**
   * Sign a message with the connected wallet.
   *
   * @param _address - Address to sign with.
   * @param message - Message string to sign.
   * @returns Signature as a hex string.
   */
  async signMessage(_address: string, message: string): Promise<string> {
    const client = this._ensureClient();

    try {
      // If private key is set (server-side), sign directly
      if (this._privateKey) {
        client.setPrivateKey(this._privateKey);
        const result = await client.trx.signMessageV2(message);
        return (result as Record<string, unknown>)?.signature as string ?? '';
      }

      // Otherwise, delegate to TronLink in browser
      const result = await client.trx.signMessageV2(message);
      return (result as Record<string, unknown>)?.signature as string ?? '';
    } catch (err) {
      throw new CinacoinError(
        `Failed to sign message: ${err instanceof Error ? err.message : String(err)}`,
        'SIGN_ERROR',
      );
    }
  }

  /**
   * Trigger a smart contract function call.
   *
   * @param params - Contract trigger parameters.
   * @returns Transaction ID (hex string).
   */
  async triggerSmartContract(params: TriggerSmartContractParams): Promise<string> {
    const client = this._ensureClient();

    if (!isValidTRONAddress(params.contractAddress)) {
      throw new CinacoinError(
        `Invalid contract address: ${params.contractAddress}`,
        'INVALID_ADDRESS',
      );
    }

    try {
      if (this._privateKey) {
        client.setPrivateKey(this._privateKey);
      }

      const contract = client.contract().at(params.contractAddress);
      const method = (contract.methods as Record<string, unknown>)[params.functionName];

      if (!method) {
        throw new CinacoinError(
          `Function "${params.functionName}" not found on contract`,
          'FUNCTION_NOT_FOUND',
        );
      }

      // Call the method with provided params
      const args = params.params ? Object.values(params.params) : [];
      const sendOptions: Record<string, unknown> = {};
      if (params.callValue) sendOptions.callValue = parseInt(params.callValue, 10);
      if (params.feeLimit) sendOptions.feeLimit = params.feeLimit;

      const result = await (method as (...args: unknown[]) => Promise<unknown>)(...args).send(sendOptions);
      const record = result as Record<string, unknown>;

      if (typeof record.txid === 'string') {
        return record.txid;
      }

      throw new CinacoinError('Contract call succeeded but no txid returned', 'TX_NO_ID');
    } catch (err) {
      if (err instanceof CinacoinError) throw err;
      throw new CinacoinError(
        `Failed to trigger contract: ${err instanceof Error ? err.message : String(err)}`,
        'CONTRACT_ERROR',
      );
    }
  }

  /**
   * Estimate energy and bandwidth for a TRX transfer.
   *
   * @param amount - Transfer amount in sun.
   * @param isContractInteraction - Whether the tx interacts with a contract.
   * @returns Energy/bandwidth/cost estimate.
   */
  async estimateEnergyBandwidth(
    amount: string,
    isContractInteraction = false,
  ): Promise<EnergyBandwidthEstimate> {
    // TRX transfer baseline:
    // - Bandwidth: ~270 bytes (transaction size)
    // - Energy: 0 for native TRX transfer, significant for contract calls
    // - Energy price: ~350 sun per energy unit (dynamic)
    const bandwidth = 270;
    let energy = 0;
    let estimatedCostSun = 0;

    if (isContractInteraction) {
      // Simple contract call: ~30k-65k energy depending on complexity
      energy = 50_000;
      // Energy cost: 350 sun/unit × energy units
      estimatedCostSun = energy * 350;
    }

    return { energy, bandwidth, estimatedCostSun };
  }

  /* ---- Additional Utility Methods ---- */

  /** Get the current TronWeb instance. */
  getClient(): TronWeb | null {
    return this.tronWeb;
  }

  /** Get the currently connected address. */
  getAddress(): string | null {
    return this._connectedAddress;
  }

  /** Set the connected address (called after wallet connection). */
  setAddress(address: string): void {
    if (!isValidTRONAddress(address)) {
      throw new CinacoinError(`Invalid address: ${address}`, 'INVALID_ADDRESS');
    }
    this._connectedAddress = address;
  }

  /** Disconnect the wallet. */
  async disconnect(): Promise<void> {
    this._connectedAddress = null;
  }

  /** Connect using an address (simplified — real connection uses TronLink). */
  async connect(address: string): Promise<string> {
    this.setAddress(address);
    return this._connectedAddress!;
  }

  /** Switch the active chain. */
  async switchChain(chainId: number): Promise<void> {
    const chain = this.findChain(chainId);
    if (chain) {
      this._initClient(chain);
    }
  }

  /** Find a TRON chain by its string ID. */
  findChainById(chainId: string): Chain | undefined {
    return this.chains.find((c) => c.id === chainId);
  }

  /** Get the current chain ID (string-based). */
  getChainId(): string | undefined {
    if (this.chains.length > 0) {
      return this.chains[0].id;
    }
    return undefined;
  }

  /** Convert sun to TRX (human-readable decimal). */
  static sunToTRX(sun: string | number | bigint): string {
    const n = typeof sun === 'bigint' ? sun : BigInt(sun);
    const intPart = n / 1_000_000n;
    const fracPart = n % 1_000_000n;
    const fracStr = fracPart.toString().padStart(6, '0').replace(/0+$/, '');
    return fracStr ? `${intPart}.${fracStr}` : `${intPart}`;
  }

  /** Convert TRX to sun. */
  static trxToSun(trx: string | number): string {
    const parts = String(trx).split('.');
    const intPart = BigInt(parts[0] || '0');
    let fracPart = 0n;
    if (parts.length > 1) {
      const frac = parts[1].padEnd(6, '0').slice(0, 6);
      fracPart = BigInt(frac);
    }
    return (intPart * 1_000_000n + fracPart).toString();
  }

  /* ---- Private Helpers ---- */

  private _ensureClient(): TronWeb {
    if (!this.tronWeb) {
      this._initClient(TRON_CHAINS[0]);
    }
    return this.tronWeb!;
  }

  private _initClient(chain: Chain): void {
    this.tronWeb = new TronWeb({
      fullHost: chain.rpcUrl,
    });
  }
}

/** Package version. */
export const VERSION = '1.0.0';
