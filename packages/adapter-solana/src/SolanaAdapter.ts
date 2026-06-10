/**
 * Solana Chain Adapter — provides Solana-specific operations.
 *
 * Implements the {@link ChainAdapter} interface from @cinacoin/core-sdk
 * and adds Solana-native methods for balance queries, token transfers,
 * transaction building, and execution on the Solana network.
 *
 * Supports Phantom, Solflare, and Wallet Standard connectors.
 *
 * @example
 * ```ts
 * import { SolanaChainAdapter, SOLANA_CHAINS } from '@cinacoin/adapter-solana';
 *
 * const adapter = new SolanaChainAdapter();
 * adapter.registerChains(SOLANA_CHAINS);
 *
 * await adapter.connect('phantom');
 * const balance = await adapter.getBalance(adapter.getAddress()!);
 * logger.info(`Balance: ${balance} SOL`);
 * ```
 *
 * @packageDocumentation
 */

import type { Connector, Chain, ChainAdapter } from '@cinacoin/core-sdk';

import {
  isValidSolanaAddress,
  base58Decode,
  type SolanaWalletProvider,
  type SolanaNetwork,
  type SolanaChainPreset,
  type SolanaAccount,
  type SolanaTransaction,
  type SolanaInstruction,
  type SolanaSignedTransaction,
  type SolanaTokenAccount,
  type SolanaTokenBalance,
  type SolanaTransactionRecord,
  type SolanaTransactionDetail,
  type SolanaFeeEstimate,
  type SolanaConnector,
  type SolanaTransactionLike,
} from './types.js';

import {
  lamportsToSol,
  solToLamports,
  base58Encode,
  deriveAssociatedTokenAddress,
  serializeTransaction,
  deserializeTransaction,
} from './utils.js';

import { PhantomWalletConnector } from './connectors/phantom.js';
import { SolflareWalletConnector } from './connectors/solflare.js';
import { WalletStandardConnector } from './connectors/wallet-standard.js';
import { logger } from '@cinacoin/logger';

/* ------------------------------------------------------------------ */
/*  Solana chain presets                                                */
/* ------------------------------------------------------------------ */

/** Well-known Solana chain presets. */
export const SOLANA_CHAINS: SolanaChainPreset[] = [
  {
    id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    name: 'Solana Mainnet',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://explorer.solana.com',
  },
  {
    id: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
    name: 'Solana Devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    faucetUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://explorer.solana.com/?cluster=devnet',
  },
  {
    id: 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z',
    name: 'Solana Testnet',
    rpcUrl: 'https://api.testnet.solana.com',
    explorerUrl: 'https://explorer.solana.com/?cluster=testnet',
  },
];

/**
 * Solana program IDs for common programs.
 */
export const SOLANA_PROGRAMS = {
  /** System Program — creates accounts, transfers SOL. */
  SYSTEM: '11111111111111111111111111111111',
  /** SPL Token Program — mint, transfer, burn tokens. */
  TOKEN: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  /** SPL Associated Token Account Program. */
  ASSOCIATED_TOKEN: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  /** Compute Budget Program — set compute unit limit & price. */
  COMPUTE_BUDGET: 'ComputeBudget111111111111111111111111111111',
  /** Memo Program — attach memo text to transactions. */
  MEMO: 'MemoSq4gqABAXKs96qnN8v7GU89MrzHxGJG3YBpVDP1T',
} as const;

/** Supported Solana wallets for discovery / UI rendering. */
export interface SolanaWalletInfo {
  id: string;
  name: string;
  icon: string;
  rdns?: string;
  /** URL to install the wallet if not present. */
  downloadUrl: string;
}

export const SOLANA_WALLETS: SolanaWalletInfo[] = [
  {
    id: 'phantom',
    name: 'Phantom',
    icon: 'https://phantom.app/img/phantom-icon.svg',
    rdns: 'app.phantom',
    downloadUrl: 'https://phantom.app/download',
  },
  {
    id: 'solflare',
    name: 'Solflare',
    icon: 'https://solflare.com/icon.svg',
    rdns: 'app.solflare',
    downloadUrl: 'https://solflare.com/download',
  },
  {
    id: 'wallet-standard',
    name: 'Wallet Standard',
    icon: '',
    downloadUrl: '',
  },
];

/* ------------------------------------------------------------------ */
/*  SolanaChainAdapter                                                   */
/* ------------------------------------------------------------------ */

/**
 * Solana chain adapter implementing chain-specific operations.
 *
 * Wraps a connector/provider with Solana-specific JSON-RPC calls for
 * balance queries, token operations, transaction signing and execution.
 *
 * Implements {@link ChainAdapter} for compatibility with the core SDK.
 */
export class SolanaChainAdapter implements ChainAdapter {
  readonly id = 'solana';
  readonly name = 'Solana Chain Adapter';

  private provider: SolanaWalletProvider | null = null;
  private chains: Map<string, SolanaChainPreset> = new Map();
  private currentNetwork: SolanaNetwork = 'mainnet';
  private rpcUrl: string = SOLANA_CHAINS[0].rpcUrl;

  /** Registered connectors for discovery. */
  private connectors: SolanaConnector[] = [];

  constructor() {
    // Register default connectors
    this.registerConnector(new PhantomWalletConnector());
    this.registerConnector(new SolflareWalletConnector());
    this.registerConnector(new WalletStandardConnector());

    // Register default chains
    for (const chain of SOLANA_CHAINS) {
      this.chains.set(chain.id, chain);
    }
  }

  /* ---- Connector Management ---- */

  /**
   * Register a Solana wallet connector for discovery.
   */
  registerConnector(connector: SolanaConnector): void {
    if (!this.connectors.some((c) => c.id === connector.id)) {
      this.connectors.push(connector);
    }
  }

  /**
   * Get all registered connectors.
   */
  getConnectors(): SolanaConnector[] {
    return [...this.connectors];
  }

  /**
   * Get connectors that are currently available (wallet installed).
   */
  getAvailableConnectors(): SolanaConnector[] {
    return this.connectors.filter((c) => c.isAvailable());
  }

  /* ---- ChainAdapter Implementation ---- */

  /**
   * Set the underlying connector (compatibility shim).
   * @deprecated Use the adapter's own connect() method instead.
   */
  setConnector(connector: Connector): void {
    // No-op — connector integration with core SDK Connector
    // is handled through the adapter's own wallet connector system.
  }

  /**
   * Register supported Solana chains.
   *
   * @param chains - Array of chain definitions.
   */
  registerChains(chains: Chain[]): void {
    for (const chain of chains) {
      const preset: SolanaChainPreset = {
        id: chain.id,
        name: chain.name,
        rpcUrl: chain.rpcUrl ?? this.rpcUrl,
        explorerUrl: chain.explorerUrl ?? '',
      };
      this.chains.set(preset.id, preset);
    }
  }

  /**
   * Find a Solana chain by its numeric ID.
   * Returns mainnet by convention.
   */
  findChain(chainId: number): Chain | undefined {
    for (const chain of this.chains.values()) {
      if (chain.id.includes('mainnet')) {
        return {
          id: chain.id,
          name: chain.name,
          rpcUrl: chain.rpcUrl,
          nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
          explorerUrl: chain.explorerUrl,
        };
      }
    }
    return undefined;
  }

  /**
   * Get connected account addresses.
   *
   * @returns Array with the connected Solana address, or empty array.
   */
  async getAccounts(): Promise<string[]> {
    const address = this.provider?.publicKey?.toBase58();
    return address ? [address] : [];
  }

  /**
   * Get SOL balance for an address.
   *
   * @param address - Solana address (base58-encoded).
   * @returns Balance in SOL as a decimal string (e.g. "1.234").
   */
  async getBalance(address: string): Promise<string> {
    if (!isValidSolanaAddress(address)) {
      throw new Error(`Invalid Solana address: ${address}`);
    }

    try {
      const result = await this._rpcCall<{ value: number }>('getBalance', [address]);
      return lamportsToSol(result.value);
    } catch (err) {
      logger.warn('[Solana] getBalance failed:', err instanceof Error ? err.message : String(err));
      return '0';
    }
  }

  /**
   * Send a transaction.
   *
   * @param tx - Serialized transaction (base64 string, Uint8Array, or Transaction object).
   * @returns Transaction signature (base58).
   */
  async sendTransaction(tx: SolanaTransactionLike | Uint8Array | string): Promise<string> {
    if (!this.provider) throw new Error('No provider connected. Call connect() first.');

    let serializedTx: Uint8Array;

    if (tx instanceof Uint8Array) {
      serializedTx = tx;
    } else if (typeof tx === 'string') {
      serializedTx = new Uint8Array(Buffer.from(tx, 'base64'));
    } else {
      // It's a Transaction-like object — sign and serialize
      const signed = await this.provider.signTransaction(tx);
      serializedTx = signed.serialize();
    }

    // Try using connection RPC first
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'sendTransaction',
          params: [Buffer.from(serializedTx).toString('base64'), { encoding: 'base64' }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Solana RPC error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.error) throw new Error(`Solana RPC error: ${data.error.message}`);
      return data.result as string;
    } catch (err: unknown) {
      if (err instanceof Error && err.message.startsWith('Solana RPC error')) throw err;
      throw new Error(
        `Solana sendTransaction failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Sign a message.
   *
   * @param message - Message string to sign.
   * @returns Signature as a base58-encoded string.
   */
  async signMessage(message: string): Promise<string> {
    if (!this.provider) throw new Error('No provider connected. Call connect() first.');
    if (!this.provider.signMessage) {
      throw new Error('Connected wallet does not support message signing');
    }

    const msgBytes = typeof message === 'string' ? new TextEncoder().encode(message) : message as Uint8Array;
    const result = await this.provider.signMessage(msgBytes);
    return base58Encode(result.signature);
  }

  /**
   * Switch the active Solana network.
   *
   * @param chainId - Network identifier (numeric or string).
   */
  async switchChain(chainId: number): Promise<void>;
  async switchChain(chainId: string): Promise<void>;
  async switchChain(identifier: string | number): Promise<void> {
    let network: SolanaNetwork;

    if (typeof identifier === 'number') {
      const mapping: SolanaNetwork[] = ['mainnet', 'devnet', 'testnet'];
      network = mapping[identifier] ?? 'mainnet';
    } else if (identifier.startsWith('solana:')) {
      if (identifier.includes('mainnet')) network = 'mainnet';
      else if (identifier.includes('devnet')) network = 'devnet';
      else if (identifier.includes('testnet')) network = 'testnet';
      else throw new Error(`Unknown Solana network identifier: ${identifier}`);
    } else {
      network = identifier as SolanaNetwork;
    }

    const chain = this.chains.get(`solana:${network === 'mainnet' ? '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' : network === 'devnet' ? 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1' : '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z'}`);
    if (!chain) {
      throw new Error(`Unknown Solana network: ${network}`);
    }

    this.currentNetwork = network;
    this.rpcUrl = chain.rpcUrl;
  }

  /* ---- Solana-Specific Methods ---- */

  /**
   * Get the currently connected address.
   */
  getAddress(): string | null {
    return this.provider?.publicKey?.toBase58() ?? null;
  }

  /**
   * Connect to a Solana wallet.
   *
   * If `walletId` is provided, attempts to connect using that specific
   * connector. Otherwise, tries available connectors in order:
   * Phantom → Solflare → Wallet Standard.
   *
   * @param walletId - Optional wallet connector id ("phantom", "solflare").
   * @returns Connected address.
   */
  async connect(walletId?: string): Promise<string> {
    let connector: SolanaConnector | undefined;

    if (walletId) {
      connector = this.connectors.find((c) => c.id === walletId);
      if (!connector) throw new Error(`Unknown Solana wallet connector: ${walletId}`);
    }

    if (connector) {
      if (!connector.isAvailable()) {
        throw new Error(`${connector.name} is not installed.`);
      }
      const result = await connector.connect();
      this.provider = connector.getProvider();
      this._bindProviderEvents();
      return result.publicKey;
    }

    // Auto-detect: Phantom → Solflare → Wallet Standard
    const available = this.getAvailableConnectors();
    if (available.length === 0) {
      throw new Error(
        'No Solana wallet found. Install Phantom, Solflare, or a Wallet Standard-compatible wallet.',
      );
    }

    const result = await available[0].connect();
    this.provider = available[0].getProvider();
    this._bindProviderEvents();
    return result.publicKey;
  }

  /**
   * Disconnect from the current wallet.
   */
  async disconnect(): Promise<void> {
    if (this.provider) {
      await this.provider.disconnect();
      this.provider = null;
    }
  }

  /**
   * Whether a wallet is currently connected.
   */
  isConnected(): boolean {
    return this.provider?.isConnected ?? false;
  }

  /**
   * Get the current Solana network.
   */
  getNetwork(): SolanaNetwork {
    return this.currentNetwork;
  }

  /**
   * Get the current RPC URL.
   */
  getRpcUrl(): string {
    return this.rpcUrl;
  }

  /* ---- Transaction Operations ---- */

  /**
   * Create a transaction from Solana instructions.
   *
   * @param instructions - Array of Solana instructions.
   * @returns A SolanaTransaction object ready for signing.
   */
  createTransaction(instructions: SolanaInstruction[]): SolanaTransaction {
    const feePayer = this.getAddress();
    if (!feePayer) throw new Error('No connected wallet. Call connect() first.');

    return {
      feePayer,
      recentBlockhash: '', // Must be set before signing
      instructions,
    };
  }

  /**
   * Send and confirm a transaction.
   *
   * Gets the latest blockhash, signs via the connected wallet,
   * submits to the network, and waits for confirmation.
   *
   * @param tx - Transaction to send (recentBlockhash will be auto-filled).
   * @returns Transaction signature.
   */
  async sendAndConfirmTransaction(tx: SolanaTransaction): Promise<string> {
    if (!this.provider) throw new Error('No provider connected. Call connect() first.');

    // Get latest blockhash
    const blockhash = await this.getRecentBlockhash();
    tx.recentBlockhash = blockhash.blockhash;

    // Build a minimal transaction-like object for the wallet
    const txLike = this._buildTransactionLike(tx);

    // Sign via wallet
    const signed = await this.provider.signTransaction(txLike);
    const serialized = signed.serialize();

    // Send
    const signature = await this._sendRawTransaction(serialized);

    // Confirm (poll for confirmation)
    await this._confirmTransaction(signature);

    return signature;
  }

  /**
   * Get all token accounts owned by an address.
   *
   * @param owner - Wallet address (base58).
   * @returns Array of token accounts.
   */
  async getTokenAccounts(owner: string): Promise<SolanaTokenAccount[]> {
    if (!isValidSolanaAddress(owner)) {
      throw new Error(`Invalid Solana address: ${owner}`);
    }

    try {
      const result = await this._rpcCall<{
        value: Array<{
          pubkey: string;
          account: {
            data: string[];
            owner: string;
          };
        }>;
      }>('getTokenAccountsByOwner', [
        owner,
        { programId: SOLANA_PROGRAMS.TOKEN },
        { encoding: 'base64' },
      ]);

      return result.value.map((item) => {
        // Parse token account data (base64-encoded SPL Token account state)
        const data = Buffer.from(item.account.data[0], 'base64');
        const mint = base58Encode(data.slice(0, 32));
        const ownerAddr = base58Encode(data.slice(32, 64));
        const amount = data.readBigUInt64LE(64);

        return {
          address: item.pubkey,
          mint,
          owner: ownerAddr,
          amount: amount.toString(),
          decimals: 0, // Need to fetch mint info for decimals
        };
      });
    } catch (err) {
      logger.warn('[Solana] getTokenAccounts failed:', err instanceof Error ? err.message : String(err));
      return [];
    }
  }

  /**
   * Create an Associated Token Account (ATA) for a given mint.
   *
   * Returns the transaction that, when executed, will create the ATA.
   *
   * @param mint - SPL Token mint address (base58).
   * @returns Transaction signature after creation.
   */
  async createAssociatedTokenAccount(mint: string): Promise<string> {
    const owner = this.getAddress();
    if (!owner) throw new Error('No connected wallet. Call connect() first.');
    if (!isValidSolanaAddress(mint)) {
      throw new Error(`Invalid mint address: ${mint}`);
    }

    // Derive the ATA address
    const ata = await deriveAssociatedTokenAddress(owner, mint);
    if (!ata) {
      throw new Error('Failed to derive Associated Token Account address');
    }

    // Build CreateAssociatedTokenAccount instruction
    const instruction: SolanaInstruction = {
      programId: SOLANA_PROGRAMS.ASSOCIATED_TOKEN,
      keys: [
        { pubkey: owner, isSigner: true, isWritable: true },   // funding account (payer)
        { pubkey: ata, isSigner: false, isWritable: true },     // new ATA
        { pubkey: owner, isSigner: false, isWritable: false },  // wallet address
        { pubkey: mint, isSigner: false, isWritable: false },   // mint
        { pubkey: SOLANA_PROGRAMS.SYSTEM, isSigner: false, isWritable: false }, // system program
        { pubkey: SOLANA_PROGRAMS.TOKEN, isSigner: false, isWritable: false },  // token program
      ],
      data: new Uint8Array([0]), // CreateAssociatedTokenAccount instruction discriminator
    };

    const tx = this.createTransaction([instruction]);
    return this.sendAndConfirmTransaction(tx);
  }

  /**
   * Transfer SOL to a recipient.
   *
   * @param to - Recipient address (base58).
   * @param amount - Amount in SOL (as string or number).
   * @returns Transaction signature.
   */
  async transferSOL(to: string, amount: string | number): Promise<string> {
    const from = this.getAddress();
    if (!from) throw new Error('No connected wallet. Call connect() first.');
    if (!isValidSolanaAddress(to)) {
      throw new Error(`Invalid recipient address: ${to}`);
    }

    const lamports = Number(solToLamports(amount));

    // Build System Program transfer instruction
    // SystemProgram.transfer instruction data:
    // u32: instruction index (2 = Transfer)
    // u64: lamports
    const data = new Uint8Array(12);
    const view = new DataView(data.buffer);
    view.setUint32(0, 2, true); // Transfer instruction index
    view.setBigUint64(4, BigInt(lamports), true);

    const instruction: SolanaInstruction = {
      programId: SOLANA_PROGRAMS.SYSTEM,
      keys: [
        { pubkey: from, isSigner: true, isWritable: true },
        { pubkey: to, isSigner: false, isWritable: true },
      ],
      data,
    };

    const tx = this.createTransaction([instruction]);
    return this.sendAndConfirmTransaction(tx);
  }

  /**
   * Transfer SPL Token to a recipient.
   *
   * @param mint - SPL Token mint address (base58).
   * @param to - Recipient address (base58).
   * @param amount - Token amount in smallest unit (considering decimals).
   * @returns Transaction signature.
   */
  async transferSPLToken(
    mint: string,
    to: string,
    amount: string | number | bigint,
  ): Promise<string> {
    const from = this.getAddress();
    if (!from) throw new Error('No connected wallet. Call connect() first.');
    if (!isValidSolanaAddress(mint)) {
      throw new Error(`Invalid mint address: ${mint}`);
    }
    if (!isValidSolanaAddress(to)) {
      throw new Error(`Invalid recipient address: ${to}`);
    }

    // Derive source and destination ATAs
    const sourceAta = await deriveAssociatedTokenAddress(from, mint);
    const destAta = await deriveAssociatedTokenAddress(to, mint);

    if (!sourceAta || !destAta) {
      throw new Error('Failed to derive ATA addresses');
    }

    const amountNum = Number(amount);

    // Build SPL Token transfer instruction
    // Token Program transfer: instruction index 3
    // u64: amount
    const data = new Uint8Array(12);
    const view = new DataView(data.buffer);
    view.setUint32(0, 3, true); // Transfer instruction index
    view.setBigUint64(4, BigInt(amountNum), true);

    const instruction: SolanaInstruction = {
      programId: SOLANA_PROGRAMS.TOKEN,
      keys: [
        { pubkey: sourceAta, isSigner: false, isWritable: true },  // source token account
        { pubkey: destAta, isSigner: false, isWritable: true },    // destination token account
        { pubkey: from, isSigner: true, isWritable: false },       // owner (signer)
      ],
      data,
    };

    const tx = this.createTransaction([instruction]);
    return this.sendAndConfirmTransaction(tx);
  }

  /**
   * Get transaction history for an address.
   *
   * @param address - Solana address (base58).
   * @param limit - Maximum number of transactions to return.
   * @returns Array of transaction records.
   */
  async getTransactionHistory(
    address: string,
    limit: number = 20,
  ): Promise<SolanaTransactionRecord[]> {
    if (!isValidSolanaAddress(address)) {
      throw new Error(`Invalid Solana address: ${address}`);
    }

    try {
      const result = await this._rpcCall<
        Array<{
          signature: string;
          slot: number;
          err: unknown | null;
          memo: string | null;
          blockTime: number | null;
          confirmationStatus: string | null;
        }>
      >('getSignaturesForAddress', [address, { limit }]);

      return result.map((item) => ({
        signature: item.signature,
        slot: item.slot,
        err: item.err,
        memo: item.memo,
        blockTime: item.blockTime,
        confirmationStatus: item.confirmationStatus,
      }));
    } catch (err) {
      logger.warn(
        '[Solana] getTransactionHistory failed:',
        err instanceof Error ? err.message : String(err),
      );
      return [];
    }
  }

  /**
   * Get the recent blockhash for transaction building.
   *
   * @returns Blockhash object with blockhash string and lastValidBlockHeight.
   */
  async getRecentBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
    try {
      const result = await this._rpcCall<{
        value: { blockhash: string; lastValidBlockHeight: number };
      }>('getLatestBlockhash', []);
      return result.value;
    } catch (err) {
      throw new Error(
        `Failed to get recent blockhash: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Estimate the fee for a transaction.
   *
   * @param tx - Transaction to estimate fee for.
   * @returns Fee estimate in lamports.
   */
  async estimateFee(tx: SolanaTransaction): Promise<SolanaFeeEstimate> {
    // Get the fee calculator from the network
    try {
      const result = await this._rpcCall<{ value: { feeCalculator: { lamportsPerSignature: number } } }>(
        'getFeeForMessage',
        [''], // In practice, this would be the serialized message
      );

      const baseFee = result.value?.feeCalculator?.lamportsPerSignature ?? 5000;
      const numSignatures = Math.max(1, tx.instructions.length);

      return {
        fee: baseFee,
        totalFee: baseFee * numSignatures,
      };
    } catch {
      // Fallback: standard Solana fee is 5000 lamports per signature
      const baseFee = 5000;
      const numSignatures = Math.max(1, tx.instructions.length);

      return {
        fee: baseFee,
        totalFee: baseFee * numSignatures,
      };
    }
  }

  /* ---- Utility / Helper Methods ---- */

  /**
   * Get SPL Token balance for an address and mint.
   *
   * @param address - Wallet address.
   * @param mint - Token mint address.
   * @returns Token balance info.
   */
  async getTokenBalance(address: string, mint: string): Promise<SolanaTokenBalance> {
    if (!isValidSolanaAddress(address)) {
      throw new Error(`Invalid Solana address: ${address}`);
    }
    if (!isValidSolanaAddress(mint)) {
      throw new Error(`Invalid mint address: ${mint}`);
    }

    const ata = await deriveAssociatedTokenAddress(address, mint);
    if (!ata) {
      throw new Error('Failed to derive ATA address');
    }

    try {
      const result = await this._rpcCall<{
        value: {
          tokenAmount: {
            amount: string;
            decimals: number;
            uiAmount: number | null;
            uiAmountString: string;
          };
        };
      }>('getTokenAccountBalance', [ata]);

      return {
        mint,
        amount: result.value.tokenAmount.amount,
        decimals: result.value.tokenAmount.decimals,
        uiAmount: result.value.tokenAmount.uiAmountString,
        tokenAccount: ata,
      };
    } catch {
      return {
        mint,
        amount: '0',
        decimals: 0,
        uiAmount: '0',
        tokenAccount: ata,
      };
    }
  }

  /**
   * Get all token balances for an address.
   *
   * @param address - Wallet address.
   * @returns Array of token balances.
   */
  async getAllTokenBalances(address: string): Promise<SolanaTokenBalance[]> {
    const tokenAccounts = await this.getTokenAccounts(address);
    const balances: SolanaTokenBalance[] = [];

    for (const account of tokenAccounts) {
      const balance = await this.getTokenBalance(address, account.mint);
      if (Number(balance.amount) > 0) {
        balances.push(balance);
      }
    }

    return balances;
  }

  /**
   * Get account info for an address.
   *
   * @param address - Solana address.
   * @returns Account info (lamports, owner, data).
   */
  async getAccountInfo(address: string): Promise<{
    lamports: number;
    owner: string;
    data: Uint8Array | null;
    executable: boolean;
    rentEpoch: number;
  }> {
    try {
      const result = await this._rpcCall<{
        value: {
          lamports: number;
          owner: string;
          data: [string, string];
          executable: boolean;
          rentEpoch: number;
        } | null;
      }>('getAccountInfo', [address, { encoding: 'base64' }]);

      if (!result.value) {
        return { lamports: 0, owner: '', data: null, executable: false, rentEpoch: 0 };
      }

      return {
        lamports: result.value.lamports,
        owner: result.value.owner,
        data: result.value.data ? Buffer.from(result.value.data[0], 'base64') : null,
        executable: result.value.executable,
        rentEpoch: result.value.rentEpoch,
      };
    } catch (err) {
      throw new Error(
        `getAccountInfo failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /* ---- Private Helpers ---- */

  /**
   * Make a JSON-RPC call to the Solana full node.
   */
  private async _rpcCall<T>(method: string, params: unknown[]): Promise<T> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`Solana RPC error: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`Solana RPC error: ${data.error.message ?? JSON.stringify(data.error)}`);
    }

    return data.result as T;
  }

  /**
   * Bind provider event listeners to clear state on disconnect.
   */
  private _bindProviderEvents(): void {
    if (!this.provider) return;
    this.provider.on('disconnect', () => {
      this.provider = null;
    });
  }

  /**
   * Build a Transaction-like object from a SolanaTransaction.
   * Used for wallet signing.
   */
  private _buildTransactionLike(tx: SolanaTransaction): SolanaTransactionLike {
    // Create a minimal transaction-like wrapper
    return {
      feePayer: { toBase58: () => tx.feePayer },
      recentBlockhash: tx.recentBlockhash,
      instructions: tx.instructions.map((ix) => ({
        programId: { toBase58: () => ix.programId },
        keys: ix.keys.map((k) => ({
          pubkey: { toBase58: () => k.pubkey },
          isSigner: k.isSigner,
          isWritable: k.isWritable,
        })),
        data: typeof ix.data === 'string' ? Buffer.from(ix.data, 'hex') : ix.data,
      })),
      sign: function () {
        // Signing is delegated to the wallet
      },
      serialize: function () {
        // Serialize the transaction to bytes
        // This is a simplified serialization
        const parts: number[] = [];

        // Number of signatures (0 for unsigned)
        parts.push(0);

        // Fee payer (32 bytes)
        const feePayerBytes = base58Decode(tx.feePayer);
        parts.push(...feePayerBytes);

        // Recent blockhash (32 bytes)
        const blockhashBytes = base58Decode(tx.recentBlockhash);
        parts.push(...blockhashBytes);

        // Number of instructions
        parts.push(tx.instructions.length);

        // Each instruction
        for (const ix of tx.instructions) {
          // Program ID index
          parts.push(0);

          // Number of keys
          parts.push(ix.keys.length);

          // Key indices (all 0 for simplicity)
          for (let i = 0; i < ix.keys.length; i++) {
            parts.push(0);
          }

          // Data length + data
          const dataBytes = typeof ix.data === 'string' ? Buffer.from(ix.data, 'hex') : ix.data;
          parts.push(dataBytes.length);
          parts.push(...dataBytes);
        }

        return new Uint8Array(parts);
      },
    };
  }

  /**
   * Send a raw transaction to the Solana network.
   */
  private async _sendRawTransaction(serialized: Uint8Array | Buffer): Promise<string> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'sendTransaction',
        params: [Buffer.from(serialized).toString('base64'), { encoding: 'base64' }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Solana RPC error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`Solana RPC error: ${data.error.message}`);
    }

    return data.result as string;
  }

  /**
   * Wait for a transaction to be confirmed.
   *
   * Polls `getSignatureStatuses` until the transaction is finalized
   * or a timeout is reached.
   */
  private async _confirmTransaction(
    signature: string,
    maxRetries: number = 30,
    intervalMs: number = 1000,
  ): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await this._rpcCall<{
          value: Array<{
            confirmationStatus: string | null;
            err: unknown | null;
          } | null>;
        }>('getSignatureStatuses', [[signature], { searchTransactionHistory: true }]);

        const status = result.value?.[0];
        if (status) {
          if (status.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
          }
          if (status.confirmationStatus === 'finalized' || status.confirmationStatus === 'confirmed') {
            return;
          }
        }
      } catch (err) {
        // Network error — retry
        logger.warn('[Solana] Confirmation poll error:', err instanceof Error ? err.message : String(err));
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error(`Transaction confirmation timed out after ${maxRetries} attempts`);
  }
}

/* ------------------------------------------------------------------ */
/*  Re-export utilities for convenience                                */
/* ------------------------------------------------------------------ */

export {
  lamportsToSol,
  solToLamports,
  base58Encode,
  base58Decode,
  deriveAssociatedTokenAddress,
  serializeTransaction,
  deserializeTransaction,
  isValidSolanaAddress,
};
