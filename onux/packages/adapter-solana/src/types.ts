/**
 * Solana-specific types for the Cinacoin Solana adapter.
 *
 * Mirrors the shape of Solana RPC responses and wallet provider interfaces
 * without requiring `@solana/web3.js` as a direct runtime dependency.
 *
 * @packageDocumentation
 */

/* ------------------------------------------------------------------ */
/*  Solana networks                                                     */
/* ------------------------------------------------------------------ */

/**
 * Well-known Solana network identifiers.
 */
export type SolanaNetwork = 'mainnet' | 'devnet' | 'testnet';

/**
 * Solana chain presets.
 */
export interface SolanaChainPreset {
  id: string;
  name: string;
  rpcUrl: string;
  faucetUrl?: string;
  explorerUrl: string;
}

/* ------------------------------------------------------------------ */
/*  Solana account & address types                                      */
/* ------------------------------------------------------------------ */

/**
 * A Solana account.
 */
export interface SolanaAccount {
  /** Base58-encoded public key. */
  address: string;
  /** Whether this is the default/selected account. */
  isDefault?: boolean;
  /** Optional display label. */
  label?: string;
}

/* ------------------------------------------------------------------ */
/*  Solana transaction types                                            */
/* ------------------------------------------------------------------ */

/**
 * Minimal representation of a Solana instruction.
 */
export interface SolanaInstruction {
  /** Program ID (base58). */
  programId: string;
  /** Account keys involved (base58). */
  keys: SolanaAccountMeta[];
  /** Serialized instruction data (Uint8Array or hex string). */
  data: Uint8Array | string;
}

/**
 * Account metadata within a Solana instruction.
 */
export interface SolanaAccountMeta {
  pubkey: string;
  isSigner: boolean;
  isWritable: boolean;
}

/**
 * A Solana transaction descriptor used for building and signing.
 */
export interface SolanaTransaction {
  /** Fee payer address (base58). */
  feePayer: string;
  /** Recent blockhash. */
  recentBlockhash: string;
  /** Instructions to execute. */
  instructions: SolanaInstruction[];
  /** Pre-signature (for partially signed txs). */
  signatures?: Record<string, string>;
}

/**
 * Result of signing a transaction.
 */
export interface SolanaSignedTransaction {
  /** Base64-encoded serialized transaction. */
  serialized: string;
  /** Signature(s) produced. */
  signatures: string[];
}

/* ------------------------------------------------------------------ */
/*  Token types                                                         */
/* ------------------------------------------------------------------ */

/**
 * SPL Token account info.
 */
export interface SolanaTokenAccount {
  /** Token account address (base58). */
  address: string;
  /** Mint address (base58). */
  mint: string;
  /** Owner address (base58). */
  owner: string;
  /** Token amount (raw integer string). */
  amount: string;
  /** Number of decimals for this mint. */
  decimals: number;
}

/**
 * Token balance summary.
 */
export interface SolanaTokenBalance {
  mint: string;
  amount: string;
  decimals: number;
  uiAmount: string;
  tokenAccount: string;
}

/* ------------------------------------------------------------------ */
/*  Transaction history                                                 */
/* ------------------------------------------------------------------ */

/**
 * A Solana transaction record returned by `getSignaturesForAddress`.
 */
export interface SolanaTransactionRecord {
  signature: string;
  slot: number;
  err: unknown | null;
  memo: string | null;
  blockTime: number | null;
  confirmationStatus: string | null;
}

/**
 * Full transaction detail.
 */
export interface SolanaTransactionDetail {
  signature: string;
  slot: number;
  meta: {
    fee: number;
    preBalances: number[];
    postBalances: number[];
    logMessages: string[] | null;
    err: unknown | null;
  } | null;
  transaction: {
    message: {
      accountKeys: string[];
      recentBlockhash: string;
      instructions: Array<{
        programIdIndex: number;
        accounts: number[];
        data: string;
      }>;
    };
    signatures: string[];
  };
  blockTime: number | null;
}

/* ------------------------------------------------------------------ */
/*  Fee estimation                                                      */
/* ------------------------------------------------------------------ */

/**
 * Estimated transaction fee breakdown.
 */
export interface SolanaFeeEstimate {
  /** Base compute fee in lamports. */
  fee: number;
  /** Priority fee in lamports (if any). */
  priorityFee?: number;
  /** Total estimated fee in lamports. */
  totalFee: number;
}

/* ------------------------------------------------------------------ */
/*  Wallet provider interface                                           */
/* ------------------------------------------------------------------ */

/**
 * Minimal Solana wallet provider interface — shape shared by Phantom,
 * Solflare, Backpack, and other Solana wallet extensions.
 */
export interface SolanaWalletProvider {
  /** Public key of the connected wallet. */
  publicKey: { toBase58(): string } | null;

  /** Whether the wallet is currently connected. */
  isConnected: boolean;

  /** Connect to the wallet (opens approval UI). */
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toBase58(): string } }>;

  /** Disconnect from the wallet. */
  disconnect(): Promise<void>;

  /** Sign a transaction. */
  signTransaction(tx: SolanaTransactionLike): Promise<SolanaTransactionLike>;

  /** Sign multiple transactions. */
  signAllTransactions?(txs: SolanaTransactionLike[]): Promise<SolanaTransactionLike[]>;

  /** Sign an arbitrary message. */
  signMessage?(message: Uint8Array): Promise<{ signature: Uint8Array }>;

  /** Generic request passthrough for wallet-specific methods. */
  request?(args: { method: string; params?: unknown[] }): Promise<unknown>;

  /** Subscribe to account / connection changes. */
  on(event: 'connect' | 'disconnect' | 'accountChanged', handler: (...args: unknown[]) => void): void;

  /** Unsubscribe. */
  off(event: 'connect' | 'disconnect' | 'accountChanged', handler: (...args: unknown[]) => void): void;
}

/**
 * Transaction-like object expected by Solana wallets.
 * Must support sign() and serialize().
 */
export interface SolanaTransactionLike {
  sign(...signers: { publicKey: { toBase58(): string }; secretKey: Uint8Array }[]): void;
  serialize(options?: { requireAllSignatures?: boolean; verifySignatures?: boolean }): Uint8Array | Buffer;
  [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/*  Solana connector interface                                          */
/* ------------------------------------------------------------------ */

/**
 * Platforms a Solana connector may run in.
 */
export type SolanaPlatform = 'browser' | 'extension' | 'mobile' | 'desktop';

/**
 * Feature flags a Solana connector may advertise.
 */
export type SolanaFeature =
  | 'solana:connect'
  | 'solana:signTransaction'
  | 'solana:signAllTransactions'
  | 'solana:signMessage'
  | 'solana:signIn'
  | 'solana:switchNetwork';

/**
 * Core interface every Solana wallet connector must implement.
 */
export interface SolanaConnector {
  /** Unique machine-readable id (e.g. "phantom", "solflare"). */
  id: string;

  /** Human-readable display name. */
  name: string;

  /** Icon — SVG data URI, URL, or emoji. */
  icon: string;

  /** Environments this connector works in. */
  platforms: SolanaPlatform[];

  /** Feature flags this connector supports. */
  supportedFeatures: SolanaFeature[];

  /**
   * Whether the connector's provider is currently accessible.
   */
  isAvailable(): boolean;

  /**
   * Request connection from the wallet.
   */
  connect(): Promise<{ publicKey: string }>;

  /**
   * Tear down the active connection.
   */
  disconnect(): Promise<void>;

  /**
   * Get the connected account address (or null if not connected).
   */
  getAddress(): string | null;

  /**
   * Get the underlying provider for advanced usage.
   */
  getProvider(): SolanaWalletProvider | null;

  /**
   * Sign a transaction.
   */
  signTransaction(tx: SolanaTransactionLike): Promise<SolanaTransactionLike>;

  /**
   * Sign multiple transactions.
   */
  signAllTransactions(txs: SolanaTransactionLike[]): Promise<SolanaTransactionLike[]>;

  /**
   * Sign a message.
   */
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;

  /**
   * Subscribe to connector events.
   */
  on(event: string, handler: (...args: unknown[]) => void): void;

  /**
   * Unsubscribe from connector events.
   */
  off(event: string, handler: (...args: unknown[]) => void): void;
}

/* ------------------------------------------------------------------ */
/*  Utility functions                                                   */
/* ------------------------------------------------------------------ */

/**
 * Validate a base58-encoded Solana address.
 */
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Decode a base58 string to bytes.
 */
export function base58Decode(encoded: string): Uint8Array {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const base = BigInt(58);
  let num = 0n;
  for (const char of encoded) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) throw new Error(`Invalid base58 character: ${char}`);
    num = num * base + BigInt(idx);
  }
  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num % 256n));
    num = num / 256n;
  }
  for (const char of encoded) {
    if (char === '1') bytes.unshift(0);
    else break;
  }
  return new Uint8Array(bytes);
}
