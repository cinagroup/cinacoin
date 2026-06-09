/**
 * @cinacoin/nft-display — Type Definitions
 *
 * Types for NFT metadata, fetching parameters, and chain configuration.
 */

import type { Address } from "viem";

// ============================================================
// Chain Configuration
// ============================================================

/** Supported chain identifiers. */
export type SupportedChainId = 1 | 137 | 42161 | 10 | 8453;

/** Chain metadata. */
export interface ChainInfo {
  id: SupportedChainId;
  name: string;
  shortName: string;
  /** Alchemy network key. */
  alchemyNetwork: string;
  /** OpenSea API chain name. */
  openseaChain?: string;
  /** Block explorer base URL. */
  explorerUrl: string;
}

/** Chain registry. */
export const CHAIN_INFO: Record<SupportedChainId, ChainInfo> = {
  1: {
    id: 1,
    name: "Ethereum",
    shortName: "ETH",
    alchemyNetwork: "eth-mainnet",
    openseaChain: "ethereum",
    explorerUrl: "https://etherscan.io",
  },
  137: {
    id: 137,
    name: "Polygon",
    shortName: "MATIC",
    alchemyNetwork: "polygon-mainnet",
    openseaChain: "matic",
    explorerUrl: "https://polygonscan.com",
  },
  42161: {
    id: 42161,
    name: "Arbitrum One",
    shortName: "ARB",
    alchemyNetwork: "arb-mainnet",
    openseaChain: "arbitrum",
    explorerUrl: "https://arbiscan.io",
  },
  10: {
    id: 10,
    name: "Optimism",
    shortName: "OP",
    alchemyNetwork: "opt-mainnet",
    openseaChain: "optimism",
    explorerUrl: "https://optimistic.etherscan.io",
  },
  8453: {
    id: 8453,
    name: "Base",
    shortName: "BASE",
    alchemyNetwork: "base-mainnet",
    openseaChain: "base",
    explorerUrl: "https://basescan.org",
  },
};

// ============================================================
// NFT Metadata
// ============================================================

/** NFT metadata response from fetcher. */
export interface NftMetadata {
  /** Contract address. */
  contractAddress: Address;
  /** Token ID. */
  tokenId: string;
  /** Token standard (ERC-721 or ERC-1155). */
  tokenType: "ERC721" | "ERC1155";
  /** Token name. */
  name: string;
  /** Token description. */
  description: string;
  /** Image URL (resolved, may be IPFS → HTTPS). */
  imageUrl: string;
  /** Thumbnail URL (smaller version if available). */
  thumbnailUrl?: string;
  /** Raw metadata URI. */
  tokenUri?: string;
  /** External link URL. */
  externalUrl?: string;
  /** Contract name. */
  contractName?: string;
  /** Contract symbol. */
  contractSymbol?: string;
  /** Total supply (ERC-1155). */
  balance?: string;
  /** Attributes/traits. */
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  /** Mint timestamp. */
  mintedAt?: string;
  /** Last transfer timestamp. */
  lastTransferredAt?: string;
  /** Chain ID where the NFT lives. */
  chainId: SupportedChainId;
  /** Whether the NFT is currently owned by the queried address. */
  isOwned?: boolean;
}

// ============================================================
// Fetcher Parameters
// ============================================================

/** Parameters for fetching NFTs by owner. */
export interface GetNftsByOwnerParams {
  /** Owner wallet address. */
  address: string;
  /** Chain ID. */
  chainId: SupportedChainId;
  /** Maximum number of NFTs to return. */
  limit?: number;
  /** Pagination cursor. */
  cursor?: string;
  /** Filter by contract address. */
  contractAddress?: Address;
  /** Exclude spam NFTs. */
  excludeSpam?: boolean;
}

/** Parameters for fetching a single NFT's metadata. */
export interface GetNftMetadataParams {
  /** Contract address. */
  contractAddress: Address;
  /** Token ID. */
  tokenId: string;
  /** Chain ID. */
  chainId: SupportedChainId;
}

/** Paginated response for NFT listings. */
export interface PaginatedNftResponse {
  /** NFT items in this page. */
  nfts: NftMetadata[];
  /** Cursor for next page (undefined if no more). */
  nextCursor?: string;
  /** Total count if available. */
  totalCount?: number;
}

// ============================================================
// API Configuration
// ============================================================

/** Provider configuration for NFT fetching. */
export interface NftProviderConfig {
  /** Alchemy API key (primary provider). */
  alchemyApiKey?: string;
  /** OpenSea API key (fallback for metadata enrichment). */
  openseaApiKey?: string;
  /** Custom API base URL override. */
  apiBaseUrl?: string;
  /** Request timeout in milliseconds. */
  timeoutMs?: number;
}

/** IPFS gateway configuration. */
export interface IpfsConfig {
  /** Primary IPFS gateway. */
  gateway: string;
  /** Fallback IPFS gateways. */
  fallbacks: string[];
}

/** Default IPFS gateways. */
export const DEFAULT_IPFS_GATEWAYS: IpfsConfig = {
  gateway: "https://ipfs.io/ipfs/",
  fallbacks: [
    "https://cloudflare-ipfs.com/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
    "https://nftstorage.link/ipfs/",
    "https://w3s.link/ipfs/",
  ],
};
