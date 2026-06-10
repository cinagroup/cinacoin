/**
 * Coinbase Wallet types.
 */

export interface CoinbaseWalletConfig {
  /** Application name */
  appName: string;
  /** Application logo URL */
  appLogoUrl?: string;
  /** Preferred chain IDs */
  chains?: number[];
  /** Use Coinbase Smart Wallet (ERC-4337) */
  smartWalletOnly?: boolean;
  /** Override the Coinbase Wallet SDK URL */
  overrideIsMetaMask?: boolean;
  /** Dark mode */
  darkMode?: boolean;
}

export interface CoinbaseWalletProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  selectedAddress: string | null;
  chainId: string | null;
  isCoinbaseWallet?: boolean;
  enable: () => Promise<string[]>;
  close: () => void;
}
