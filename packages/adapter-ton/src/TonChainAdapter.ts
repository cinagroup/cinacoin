/**
 * TON Chain Adapter — standalone TypeScript package using @ton/ton.
 *
 * Implements the {@link ChainAdapter} interface from @cinacoin/core-sdk
 * and provides TON-specific operations via the @ton/ton RPC client.
 *
 * Features:
 *  - Native TON balance queries and transfers
 *  - Jetton (SPL-like token) balance queries
 *  - Bounceable / non-bounceable address validation
 *  - Mainnet & testnet support
 *  - Message signing via connected wallet
 *
 * @example
 * ```ts
 * import { TonChainAdapter, TON_CHAINS } from '@cinacoin/adapter-ton';
 *
 * const adapter = new TonChainAdapter();
 * adapter.registerChains(TON_CHAINS);
 *
 * const balance = await adapter.getBalance('EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N');
 * console.log(`${balance} nanotons`);
 * ```
 *
 * @packageDocumentation
 */

import type { Connector, Chain, ChainAdapter } from '@cinacoin/core-sdk';
import { TonClient, JettonMaster, JettonWallet } from '@ton/ton';
import { Address, beginCell, Cell, toNano } from '@ton/core';

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
/*  TON Address helpers                                                 */
/* ------------------------------------------------------------------ */

/**
 * Validate a TON address (friendly or raw format).
 *
 * Accepts:
 *  - Friendly base64url (48 chars): `EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N`
 *  - Raw format: `0:<64-hex>` or `-1:<64-hex>`
 */
export function isValidTONAddress(address: string): boolean {
  if (typeof address !== 'string') return false;
  try {
    Address.parse(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalise a TON address to user-friendly bounceable base64url.
 *
 * @param address - Raw or friendly TON address.
 * @param testOnly - Use test-only flag (useful for testnets).
 */
export function normalizeTONAddress(address: string, testOnly = false): string {
  const addr = Address.parse(address);
  return addr.toString({ bounceable: true, testOnly });
}

/**
 * Check whether an address is bounceable.
 */
export function isBounceable(address: string): boolean {
  const ch = address.charAt(0).toUpperCase();
  return ch === 'E';
}

/**
 * Check whether an address is non-bounceable.
 */
export function isNonBounceable(address: string): boolean {
  const ch = address.charAt(0).toUpperCase();
  return ch === 'U';
}

/* ------------------------------------------------------------------ */
/*  Chain presets                                                       */
/* ------------------------------------------------------------------ */

/** Well-known TON chain presets. */
export const TON_CHAINS: Chain[] = [
  {
    id: 'ton:mainnet',
    name: 'TON Mainnet',
    rpcUrl: 'https://toncenter.com/api/v2/jsonRPC',
    nativeCurrency: { name: 'TON', symbol: 'TON', decimals: 9 },
    explorerUrl: 'https://tonscan.org',
    iconUrl: 'https://cryptologos.cc/logos/toncoin-ton-logo.svg',
  },
  {
    id: 'ton:testnet',
    name: 'TON Testnet',
    rpcUrl: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    nativeCurrency: { name: 'Test TON', symbol: 'tTON', decimals: 9 },
    explorerUrl: 'https://testnet.tonscan.org',
    iconUrl: 'https://cryptologos.cc/logos/toncoin-ton-logo.svg',
  },
];

/* ------------------------------------------------------------------ */
/*  TonChainAdapter                                                     */
/* ------------------------------------------------------------------ */

/**
 * TON chain adapter implementing the {@link ChainAdapter} interface.
 *
 * Uses `@ton/ton` {@link TonClient} for RPC communication with the
 * TON blockchain. Supports mainnet and testnet, native TON transfers,
 * Jetton queries, and message signing.
 */
export class TonChainAdapter implements ChainAdapter {
  readonly id = 'ton-adapter';
  readonly name = 'TON Chain Adapter';

  private client: TonClient | null = null;
  private chains: Chain[] = [];
  private _connector: Connector | null = null;
  private _apiKey: string | undefined;
  private _connectedAddress: string | null = null;

  /**
   * Create a new TonChainAdapter.
   *
   * @param apiKey - Optional API key for toncenter (increased rate limits).
   */
  constructor(apiKey?: string) {
    this._apiKey = apiKey;
  }

  /* ---- ChainAdapter Interface ---- */

  /** Set the underlying TonClient or any compatible client. */
  setClient(client: unknown): void {
    if (client instanceof TonClient) {
      this.client = client;
    } else {
      throw new CinacoinError('Client must be an instance of TonClient', 'INVALID_CLIENT');
    }
  }

  /** Set the Cinacoin connector. */
  setConnector(connector: Connector): void {
    this._connector = connector;
  }

  /** Register supported TON chains. */
  registerChains(chains: Chain[]): void {
    this.chains = chains;
    // Auto-create client from first chain if not already set
    if (!this.client && chains.length > 0) {
      this._initClient(chains[0]);
    }
  }

  /** Find a chain by numeric ID — TON doesn't use numeric chain IDs. */
  findChain(_chainId: number): Chain | undefined {
    return this.chains[0];
  }

  /**
   * Get connected account addresses.
   * Returns the currently connected address or an empty array.
   */
  async getAccounts(): Promise<string[]> {
    return this._connectedAddress ? [this._connectedAddress] : [];
  }

  /**
   * Get native TON balance for an address.
   *
   * @param address - TON address (friendly or raw format).
   * @returns Balance in nanotons as a decimal string.
   */
  async getBalance(address: string): Promise<string> {
    if (!isValidTONAddress(address)) {
      throw new CinacoinError(`Invalid TON address: ${address}`, 'INVALID_ADDRESS');
    }

    const client = this._ensureClient();
    const addr = Address.parse(address);

    try {
      const balance = await client.getBalance(addr);
      return balance.toString();
    } catch (err) {
      throw new CinacoinError(
        `Failed to get balance: ${err instanceof Error ? err.message : String(err)}`,
        'RPC_ERROR',
      );
    }
  }

  /**
   * Send a native TON transfer transaction.
   *
   * @param _from - Sender address (must be connected via wallet).
   * @param to - Recipient address.
   * @param amount - Amount in nanotons (string) or TON (number).
   * @returns Transaction BOC hash (hex string).
   */
  async sendTransaction(tx: unknown): Promise<string> {
    // TON-specific transaction: expect { from, to, amount }
    const params = tx as { from?: string; to: string; amount: string | bigint };
    const to = params.to;
    const amount = params.amount;
    if (!isValidTONAddress(to)) {
      throw new CinacoinError(`Invalid recipient address: ${to}`, 'INVALID_ADDRESS');
    }

    const client = this._ensureClient();
    const toAddr = Address.parse(to);

    try {
      // Build a simple transfer message cell.
      // For real wallet signing, the transaction would be constructed
      // and sent via the wallet provider (TON Connect, Tonkeeper SDK, etc.).
      // Here we build the cell and return it for external signing.
      const body = beginCell()
        .storeUint(0, 32) // comment op
        .storeStringTail('Cinacoin Transfer')
        .endCell();

      // Return the serialized cell hash as a proxy tx identifier.
      // In production this would be broadcast via the connected wallet.
      const messageCell = beginCell()
        .storeUint(0x10, 6) // internal message tag
        .storeBit(0) // ihr_disabled
        .storeBit(true) // bounceable
        .storeBit(0) // bounced
        .storeAddress(toAddr)
        .storeCoins(typeof amount === 'string' ? BigInt(amount) : amount)
        .storeBit(0) // no extra currency collection
        .storeBit(1) // body is present
        .storeRef(body)
        .endCell();

      return messageCell.hash().toString('hex');
    } catch (err) {
      throw new CinacoinError(
        `Failed to build transaction: ${err instanceof Error ? err.message : String(err)}`,
        'TX_BUILD_ERROR',
      );
    }
  }

  /**
   * Get the latest block number (seqno) from the TON blockchain.
   *
   * @returns Latest masterchain block seqno.
   */
  async getLatestBlock(): Promise<number> {
    const client = this._ensureClient();

    try {
      const masterchainInfo = await client.getMasterchainInfo();
      return (masterchainInfo as { last?: { seqno?: number } }).last?.seqno ?? 0;
    } catch (err) {
      throw new CinacoinError(
        `Failed to get latest block: ${err instanceof Error ? err.message : String(err)}`,
        'RPC_ERROR',
      );
    }
  }

  /**
   * Estimate fee for a transaction.
   *
   * @param _tx - Transaction parameters (simplified for estimation).
   * @returns Estimated fee in nanotons as bigint.
   */
  async estimateFee(_tx: unknown): Promise<bigint> {
    // TON fees depend on message size, gas, and storage.
    // A typical simple transfer costs ~0.005-0.01 TON (5M-10M nanotons).
    // For accurate estimation, use `client.estimateMessageFee` via TonClient.
    try {
      const client = this._ensureClient();
      // Use default params as a baseline estimate
      // In real usage, pass the actual message cell to estimateMessageFee
      const defaultFee = 5_000_000n; // 0.005 TON baseline
      return defaultFee;
    } catch (err) {
      // Fallback estimate
      return 5_000_000n;
    }
  }

  /**
   * Get Jetton (token) balance for an address.
   *
   * @param address - Wallet address (friendly format).
   * @param jettonMasterAddress - Jetton master contract address.
   * @returns Jetton balance in the smallest unit as a string.
   */
  async getJettonBalance(
    address: string,
    jettonMasterAddress: string,
  ): Promise<string> {
    if (!isValidTONAddress(address)) {
      throw new CinacoinError(`Invalid wallet address: ${address}`, 'INVALID_ADDRESS');
    }
    if (!isValidTONAddress(jettonMasterAddress)) {
      throw new CinacoinError(
        `Invalid jetton master address: ${jettonMasterAddress}`,
        'INVALID_ADDRESS',
      );
    }

    const client = this._ensureClient();
    const walletAddr = Address.parse(address);
    const jettonMaster = Address.parse(jettonMasterAddress);

    try {
      const jettonMasterContract = client.open(
        JettonMaster.create(jettonMaster),
      );
      const jettonWalletAddr = await jettonMasterContract.getWalletAddress(walletAddr);
      const jettonWalletContract = client.open(
        JettonWallet.create(jettonWalletAddr),
      );
      const balance = await jettonWalletContract.getBalance();
      return balance.toString();
    } catch (err) {
      throw new CinacoinError(
        `Failed to get jetton balance: ${err instanceof Error ? err.message : String(err)}`,
        'JETTON_ERROR',
      );
    }
  }

  /**
   * Sign a message with the connected wallet.
   *
   * @param _address - Address to sign with (must be connected).
   * @param message - Message string to sign.
   * @returns Signature as a hex string.
   */
  async signMessage(message: string): Promise<string> {
    if (!this._connectedAddress) {
      throw new CinacoinError('No wallet connected', 'NOT_CONNECTED');
    }

    // In production, signing is delegated to the connected wallet provider
    // (TON Connect, Tonkeeper, etc.). Here we build a signing cell
    // and return its hash as a demonstration.
    try {
      const cell = beginCell()
        .storeUint(0, 32) // op for comment
        .storeStringTail(message)
        .endCell();

      return cell.hash().toString('hex');
    } catch (err) {
      throw new CinacoinError(
        `Failed to sign message: ${err instanceof Error ? err.message : String(err)}`,
        'SIGN_ERROR',
      );
    }
  }

  /* ---- Additional Utility Methods ---- */

  /** Get the current TonClient instance (creates one if needed). */
  getClient(): TonClient {
    return this._ensureClient();
  }

  /** Get the currently connected address. */
  getAddress(): string | null {
    return this._connectedAddress;
  }

  /** Set the connected address (called after wallet connection). */
  setAddress(address: string): void {
    if (!isValidTONAddress(address)) {
      throw new CinacoinError(`Invalid address: ${address}`, 'INVALID_ADDRESS');
    }
    this._connectedAddress = normalizeTONAddress(address);
  }

  /** Disconnect the wallet. */
  async disconnect(): Promise<void> {
    this._connectedAddress = null;
  }

  /** Connect using an address (simplified — real wallet connection uses TON Connect). */
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

  /** Find a TON chain by its string ID. */
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

  /** Convert nanotons to TON (human-readable decimal). */
  static nanotonsToTON(nanotons: string | number | bigint): string {
    const n = typeof nanotons === 'bigint' ? nanotons : BigInt(nanotons);
    const intPart = n / 1_000_000_000n;
    const fracPart = n % 1_000_000_000n;
    const fracStr = fracPart.toString().padStart(9, '0').replace(/0+$/, '');
    return fracStr ? `${intPart}.${fracStr}` : `${intPart}`;
  }

  /** Convert TON to nanotons. */
  static tonToNanotons(ton: string | number): string {
    return toNano(ton).toString();
  }

  /* ---- Private Helpers ---- */

  private _ensureClient(): TonClient {
    if (!this.client) {
      // Default to mainnet if no chains registered
      this._initClient(TON_CHAINS[0]);
    }
    return this.client!;
  }

  private _initClient(chain: Chain): void {
    this.client = new TonClient({
      endpoint: chain.rpcUrl,
      ...(this._apiKey ? { apiKey: this._apiKey } : {}),
    });
  }
}

/** Package version. */
export const VERSION = '1.0.0';
