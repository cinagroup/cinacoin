/**
 * Phantom Wallet types.
 */

export interface PhantomConfig {
  /** Connect to Solana (default: true) */
  solana?: boolean;
  /** Connect to Ethereum (if supported) */
  ethereum?: boolean;
  /** Preferred Solana network */
  network?: 'mainnet-beta' | 'devnet' | 'testnet';
}

export interface PhantomSolanaProvider {
  isPhantom?: boolean;
  publicKey: { toBase58: () => string; toString: () => string } | null;
  isConnected: boolean;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toBase58: () => string } }>;
  disconnect: () => Promise<void>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  signTransaction: (transaction: unknown) => Promise<unknown>;
  signAllTransactions: (transactions: unknown[]) => Promise<unknown[]>;
  signAndSendTransaction: (transaction: unknown) => Promise<{ signature: string }>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
}

export interface PhantomEthereumProvider {
  isPhantom?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  selectedAddress: string | null;
  chainId: string | null;
}
