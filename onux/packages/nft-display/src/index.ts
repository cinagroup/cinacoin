/**
 * @cinacoin/nft-display
 *
 * Multi-chain NFT fetching, metadata resolution, and React display components.
 *
 * @example
 * ```ts
 * // Fetcher (vanilla)
 * import { NftFetcher } from '@cinacoin/nft-display';
 * const fetcher = new NftFetcher({ alchemyApiKey: '...' });
 * const { nfts } = await fetcher.getNftsByOwner({ address: '0x...', chainId: 1 });
 *
 * // React components
 * import { NftCard, NftGrid, NftDetail } from '@cinacoin/nft-display/components';
 *
 * // React hooks
 * import { useNfts, useNftMetadata } from '@cinacoin/nft-display/hooks';
 * ```
 */

// Types
export type {
  NftMetadata,
  GetNftsByOwnerParams,
  GetNftMetadataParams,
  PaginatedNftResponse,
  NftProviderConfig,
  SupportedChainId,
  ChainInfo,
  IpfsConfig,
} from "./types.js";

export { CHAIN_INFO, DEFAULT_IPFS_GATEWAYS } from "./types.js";

// Fetcher
export { NftFetcher, resolveIpfsUri, resolveIpfsUriSync, getDefaultFetcher, setDefaultFetcher } from "./fetcher.js";
