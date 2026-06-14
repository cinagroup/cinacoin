/**
 * @cinacoin/wallet-registry — Type Definitions
 *
 * Standardized wallet metadata interface and platform/chain enumerations.
 */

// ============================================================
// Platform & Chain types
// ============================================================

/** Wallet platform types. */
export type WalletPlatform =
  | 'browser_extension'
  | 'mobile'
  | 'desktop'
  | 'hardware'
  | 'web'
  | 'cli';

/** Chain family identifiers. */
export type WalletChainFamily =
  | 'evm'
  | 'solana'
  | 'bitcoin'
  | 'cosmos'
  | 'near'
  | 'polkadot'
  | 'aptos'
  | 'sui'
  | 'hedera'
  | 'xrpl'
  | 'starknet'
  | 'tron'
  | 'ton'
  | 'cardano'
  | 'algorand'
  | 'stellar'
  | 'flow'
  | 'tezos'
  | 'multiversx'
  | 'elrond'
  | 'ontology'
  | 'eos'
  | 'terra'
  | 'harmony'
  | 'kcc'
  | 'filecoin'
  | 'thorchain'
  | 'bsc'
  | 'cronos';

// ============================================================
// Wallet Entry
// ============================================================

/** A single wallet registry entry. */
export interface WalletRegistryEntry {
  /** Unique wallet identifier (lowercase kebab-case). */
  id: string;
  /** Display name. */
  name: string;
  /** Wallet icon/logo URL. */
  logo: string;
  /** Official homepage URL. */
  homepage: string;
  /** Supported chain families. */
  supportedChainFamilies: WalletChainFamily[];
  /** Specific CAIP-2 chains supported (e.g., 'eip155:1'). */
  supportedChains?: string[];
  /** Supported platforms. */
  platforms: WalletPlatform[];
  /** Deep link scheme for mobile (e.g., 'metamask://'). */
  deepLink?: string;
  /** Universal link for iOS fallback. */
  universalLink?: string;
  /** App Store URL (iOS). */
  appStoreUrl?: string;
  /** Play Store URL (Android). */
  playStoreUrl?: string;
  /** Extension store URL (Chrome Web Store, Firefox Add-ons). */
  extensionUrl?: string;
  /** Whether it supports Cinacoin v2. */
  supportsCinacoinV2?: boolean;
  /** Whether it supports EIP-6963 multi-provider discovery. */
  supportsEIP6963?: boolean;
  /** RDNS identifier for EIP-6963. */
  rdns?: string;
  /** Whether it's open source. */
  openSource?: boolean;
  /** Wallet type/category. */
  walletType?: 'hot' | 'cold' | 'smart_contract' | 'custodial' | 'social' | 'embedded';
  /** Whether it supports account abstraction (ERC-4337). */
  supportsAccountAbstraction?: boolean;
  /** Popularity score (1-100, higher = more popular). */
  popularity: number;
  /** Short description. */
  description?: string;
  /** Developer or organization. */
  developer?: string;
  /** Year founded. */
  yearFounded?: number;
  /** Social links. */
  social?: {
    twitter?: string;
    discord?: string;
    github?: string;
    telegram?: string;
  };
}

// ============================================================
// Query Filters
// ============================================================

/** Filter options for wallet queries. */
export interface WalletFilter {
  /** Filter by chain family. */
  chainFamily?: WalletChainFamily;
  /** Filter by specific CAIP-2 chain. */
  chain?: string;
  /** Filter by platform. */
  platform?: WalletPlatform;
  /** Filter by wallet type. */
  walletType?: WalletRegistryEntry['walletType'];
  /** Filter by Cinacoin v2 support. */
  walletConnectV2?: boolean;
  /** Filter by EIP-6963 support. */
  eip6963?: boolean;
  /** Filter by account abstraction support. */
  accountAbstraction?: boolean;
  /** Filter by open source. */
  openSource?: boolean;
  /** Filter by developer. */
  developer?: string;
  /** Search by name or ID (case-insensitive substring). */
  search?: string;
}

/** Sort options for wallet results. */
export interface WalletSort {
  /** Field to sort by. */
  field: 'popularity' | 'name' | 'yearFounded' | 'chainCount';
  /** Sort direction. */
  direction?: 'asc' | 'desc';
}
