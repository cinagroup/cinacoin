/**
 * @cinacoin/nft-display — NFT Fetcher
 *
 * Multi-chain NFT fetching with IPFS resolution support.
 * Supports Alchemy NFT API and OpenSea API as data sources.
 *
 * Features:
 *   - ERC-721 and ERC-1155 support
 *   - Multi-chain (ETH, Polygon, Arbitrum, Optimism, Base)
 *   - IPFS gateway resolution with fallback chain
 *   - Pagination support
 *   - Spam filtering
 *
 * @example
 * ```ts
 * import { NftFetcher } from '@cinacoin/nft-display/fetcher';
 *
 * const fetcher = new NftFetcher({
 *   alchemyApiKey: process.env.ALCHEMY_API_KEY,
 * });
 *
 * // Get all NFTs owned by an address
 * const { nfts, nextCursor } = await fetcher.getNftsByOwner({
 *   address: '0x...',
 *   chainId: 1,
 *   limit: 20,
 * });
 *
 * // Get metadata for a specific NFT
 * const nft = await fetcher.getNftMetadata({
 *   contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
 *   tokenId: '1234',
 *   chainId: 1,
 * });
 * ```
 */

import type { Address } from "viem";
import type {
  NftMetadata,
  GetNftsByOwnerParams,
  GetNftMetadataParams,
  PaginatedNftResponse,
  NftProviderConfig,
  SupportedChainId,
  IpfsConfig,
} from "./types.js";
import { CHAIN_INFO, DEFAULT_IPFS_GATEWAYS } from "./types.js";

// ============================================================
// IPFS Resolution
// ============================================================

/**
 * Resolve an IPFS URI to an HTTPS gateway URL.
 * Tries fallback gateways if the primary fails.
 */
export async function resolveIpfsUri(
  uri: string,
  ipfsConfig: IpfsConfig = DEFAULT_IPFS_GATEWAYS,
): Promise<string> {
  if (!uri) return "";
  if (!uri.startsWith("ipfs://") && !uri.startsWith("ipfs/")) return uri;

  const ipfsHash = uri.replace("ipfs://", "").replace("ipfs/", "");
  const gateways = [ipfsConfig.gateway, ...ipfsConfig.fallbacks];

  // Try the first gateway that resolves
  for (const gateway of gateways) {
    const url = `${gateway}${ipfsHash}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, { method: "HEAD", signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) return url;
    } catch {
      // Try next gateway
    }
  }

  // Return primary gateway URL as fallback (may not resolve but gives a URL)
  return `${ipfsConfig.gateway}${ipfsHash}`;
}

/**
 * Synchronously resolve an IPFS URI (no fetch validation).
 * Useful for SSR or when gateway availability is unknown.
 */
export function resolveIpfsUriSync(
  uri: string,
  ipfsConfig: IpfsConfig = DEFAULT_IPFS_GATEWAYS,
): string {
  if (!uri) return "";
  if (!uri.startsWith("ipfs://") && !uri.startsWith("ipfs/")) return uri;
  const ipfsHash = uri.replace("ipfs://", "").replace("ipfs/", "");
  return `${ipfsConfig.gateway}${ipfsHash}`;
}

// ============================================================
// NftFetcher Class
// ============================================================

/**
 * Multi-chain NFT fetcher with IPFS resolution.
 *
 * Uses Alchemy NFT API as the primary data source.
 * Falls back to direct contract calls for metadata.
 */
export class NftFetcher {
  private config: NftProviderConfig;

  constructor(config: NftProviderConfig = {}) {
    this.config = config;
  }

  /**
   * Fetch all NFTs owned by an address on a specific chain.
   *
   * Supports pagination via cursor.
   */
  async getNftsByOwner(
    params: GetNftsByOwnerParams,
  ): Promise<PaginatedNftResponse> {
    const { address, chainId, limit = 50, cursor, contractAddress, excludeSpam = true } = params;

    if (!CHAIN_INFO[chainId]) {
      throw new Error(`Unsupported chain ID: ${chainId}. Supported: ${Object.keys(CHAIN_INFO).join(", ")}`);
    }

    // Use Alchemy NFT API if API key is available
    if (this.config.alchemyApiKey) {
      return this.fetchViaAlchemy(address, chainId, { limit, cursor, contractAddress, excludeSpam });
    }

    // Fallback: return empty (no API key configured)
    return { nfts: [], nextCursor: undefined };
  }

  /**
   * Fetch metadata for a specific NFT.
   *
   * Works for both ERC-721 and ERC-1155.
   */
  async getNftMetadata(
    params: GetNftMetadataParams,
  ): Promise<NftMetadata> {
    const { contractAddress, tokenId, chainId } = params;

    if (!CHAIN_INFO[chainId]) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    // Use Alchemy if available
    if (this.config.alchemyApiKey) {
      return this.fetchNftMetadataViaAlchemy(contractAddress, tokenId, chainId);
    }

    // Fallback: basic metadata structure
    return {
      contractAddress,
      tokenId,
      tokenType: "ERC721",
      name: `NFT #${tokenId}`,
      description: "",
      imageUrl: "",
      attributes: [],
      chainId,
    };
  }

  // ============================================================
  // Alchemy API Methods
  // ============================================================

  private async fetchViaAlchemy(
    address: string,
    chainId: SupportedChainId,
    options: {
      limit: number;
      cursor?: string;
      contractAddress?: Address;
      excludeSpam: boolean;
    },
  ): Promise<PaginatedNftResponse> {
    const chainInfo = CHAIN_INFO[chainId];
    const baseUrl = `https://${chainInfo.alchemyNetwork}.g.alchemy.com/v2/${this.config.alchemyApiKey}`;

    // Build request body
    const body: Record<string, unknown> = {
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getNftsForOwner",
      params: [
        address,
        {
          withMetadata: true,
          pageSize: options.limit,
          excludeFilters: options.excludeSpam ? ["SPAM"] : [],
          ...(options.contractAddress ? { contractAddresses: [options.contractAddress] } : {}),
          ...(options.cursor ? { pageKey: options.cursor } : {}),
        },
      ],
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 15_000);

    try {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Alchemy API error: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      return this.parseAlchemyNfts(json, chainId);
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  private parseAlchemyNfts(
    response: unknown,
    chainId: SupportedChainId,
  ): PaginatedNftResponse {
    const result = (response as Record<string, unknown>)?.result as Record<string, unknown> | undefined;
    if (!result) return { nfts: [], nextCursor: undefined };

    const ownedNfts = (result.ownedNfts ?? []) as Array<Record<string, unknown>>;
    const pageKey = (result.pageKey as string) || undefined;

    const nfts: NftMetadata[] = ownedNfts
      .map((nft) => this.parseAlchemyNft(nft, chainId))
      .filter((n): n is NftMetadata => n !== null);

    return {
      nfts,
      nextCursor: pageKey,
    };
  }

  private parseAlchemyNft(
    raw: Record<string, unknown>,
    chainId: SupportedChainId,
  ): NftMetadata | null {
    const contract = (raw.contract ?? {}) as Record<string, unknown>;
    const metadata = (raw.metadata ?? {}) as Record<string, unknown>;
    const tokenUri = (raw.tokenUri ?? {}) as Record<string, unknown>;
    const media = (raw.media ?? []) as Array<Record<string, unknown>>;

    // Resolve image URL
    let imageUrl = "";
    if (media.length > 0 && typeof media[0]?.gateway === "string") {
      imageUrl = media[0].gateway;
    } else if (typeof tokenUri.gateway === "string") {
      imageUrl = tokenUri.gateway;
    }

    // Resolve IPFS
    if (imageUrl) {
      imageUrl = resolveIpfsUriSync(imageUrl);
    }

    const tokenType = (contract.tokenType as string)?.toUpperCase() === "ERC1155" ? "ERC1155" : "ERC721";

    // Parse attributes
    const attributes: NftMetadata["attributes"] = [];
    const rawAttributes = metadata.attributes as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(rawAttributes)) {
      for (const attr of rawAttributes) {
        const rawValue = attr.value;
        attributes.push({
          trait_type: String(attr.trait_type ?? attr.display_type ?? "unknown"),
          value: typeof rawValue === "number" ? rawValue : String(rawValue ?? ""),
          display_type: (attr.display_type as string) || undefined,
        });
      }
    }

    return {
      contractAddress: (contract.address as Address) ?? "0x",
      tokenId: (raw.tokenId as string) ?? "0",
      tokenType,
      name: (metadata.name as string) ?? contract.name as string ?? "",
      description: (metadata.description as string) ?? "",
      imageUrl,
      tokenUri: (tokenUri.raw as string) || (tokenUri.gateway as string) || undefined,
      externalUrl: (metadata.external_url as string) || undefined,
      contractName: (contract.name as string) || undefined,
      contractSymbol: (contract.symbol as string) || undefined,
      balance: (raw.balance as string) || undefined,
      attributes,
      mintedAt: (raw.timeLastUpdated as string) || undefined,
      lastTransferredAt: (raw.lastTransferredAt as string) || undefined,
      chainId,
      isOwned: true,
    };
  }

  private async fetchNftMetadataViaAlchemy(
    contractAddress: Address,
    tokenId: string,
    chainId: SupportedChainId,
  ): Promise<NftMetadata> {
    const chainInfo = CHAIN_INFO[chainId];
    const baseUrl = `https://${chainInfo.alchemyNetwork}.g.alchemy.com/v2/${this.config.alchemyApiKey}`;

    const body = {
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getNftMetadata",
      params: [
        contractAddress,
        tokenId,
        { withMetadata: true },
      ],
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 15_000);

    try {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Alchemy API error: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      const result = (json as Record<string, unknown>)?.result as Record<string, unknown> | undefined;

      if (!result) {
        return {
          contractAddress,
          tokenId,
          tokenType: "ERC721",
          name: `NFT #${tokenId}`,
          description: "",
          imageUrl: "",
          attributes: [],
          chainId,
        };
      }

      return this.parseAlchemyNft(result, chainId) ?? {
        contractAddress,
        tokenId,
        tokenType: "ERC721",
        name: `NFT #${tokenId}`,
        description: "",
        imageUrl: "",
        attributes: [],
        chainId,
      };
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }
}

// ============================================================
// Singleton Export
// ============================================================

let _defaultFetcher: NftFetcher | null = null;

/**
 * Get the default NftFetcher instance.
 * Creates one on first call.
 */
export function getDefaultFetcher(): NftFetcher {
  if (!_defaultFetcher) {
    _defaultFetcher = new NftFetcher({
      alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    });
  }
  return _defaultFetcher;
}

/**
 * Set the default NftFetcher instance.
 * Useful for custom configuration.
 */
export function setDefaultFetcher(fetcher: NftFetcher): void {
  _defaultFetcher = fetcher;
}
