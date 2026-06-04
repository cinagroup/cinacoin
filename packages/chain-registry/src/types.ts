/**
 * Chain registry types — CAIP-2 compatible.
 *
 * Aligns with the Chain Agnostic Improvement Proposal (CAIP) standards
 * for cross-chain interoperability.
 */

/** Category classification for EVM chains. */
export type ChainCategory = 'l2' | 'sidechain' | 'testnet' | 'mainnet' | 'gaming' | 'defi';

/** Native currency metadata for a chain. */
export interface NativeCurrency {
  /** Full name of the currency (e.g. "Ether"). */
  name: string;
  /** Ticker symbol (e.g. "ETH"). */
  symbol: string;
  /** Number of decimal places. */
  decimals: number;
}

/** A single chain registry entry, compatible with CAIP-2. */
export interface ChainRegistryEntry {
  /** Unique numeric chain ID (CAIP-2 namespace reference). */
  id: number;
  /** Human-readable chain name. */
  name: string;
  /** Short name / slug (e.g. "eth", "arb"). */
  shortName: string;
  /** One or more JSON-RPC endpoint URLs. */
  rpcUrls: string[];
  /** Native currency metadata. */
  nativeCurrency: NativeCurrency;
  /** Block explorer base URL (optional). */
  blockExplorer?: string;
  /** Icon URL or emoji string (optional). */
  icon?: string;
  /** Whether this is a testnet. */
  testnet: boolean;
  /** Category tag for filtering. */
  category: ChainCategory;
}

/** CAIP-2 string: "eip155:{chainId}" */
export type Caip2 = `eip155:${number}`;

/** Result of a chain search query. */
export interface ChainSearchResult {
  entry: ChainRegistryEntry;
  /** Match score (higher = better). */
  score: number;
}
