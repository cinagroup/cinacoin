/**
 * @cinacoin/nft-display — React Hooks
 *
 * useNfts and useNftMetadata hooks for fetching NFTs in React applications.
 *
 * @example
 * ```tsx
 * import { useNfts, useNftMetadata } from '@cinacoin/nft-display/hooks';
 *
 * function NftGallery({ address }: { address: string }) {
 *   const { nfts, isLoading, loadMore } = useNfts({ address, chainId: 1 });
 *   return <NftGrid nfts={nfts} isLoading={isLoading} />;
 * }
 *
 * function NftViewer({ contractAddress, tokenId }: { contractAddress: string; tokenId: string }) {
 *   const { metadata, isLoading } = useNftMetadata({
 *     contractAddress,
 *     tokenId,
 *     chainId: 1,
 *   });
 *   if (isLoading) return <p>Loading...</p>;
 *   return <NftDetail nft={metadata!} />;
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { NftMetadata, SupportedChainId } from "./types.js";
import { NftFetcher, getDefaultFetcher } from "./fetcher.js";

// ============================================================
// useNfts Hook
// ============================================================

export interface UseNftsParams {
  /** Owner wallet address. */
  address: string;
  /** Chain ID. */
  chainId: SupportedChainId;
  /** Optional contract address filter. */
  contractAddress?: `0x${string}`;
  /** Page size. */
  pageSize?: number;
  /** Custom NftFetcher instance. */
  fetcher?: NftFetcher;
  /** Whether to auto-fetch on mount/params change. */
  autoFetch?: boolean;
}

export interface UseNftsReturn {
  /** Loaded NFTs. */
  nfts: NftMetadata[];
  /** Whether currently loading. */
  isLoading: boolean;
  /** Whether there's a next page. */
  hasNextPage: boolean;
  /** Error if any. */
  error: Error | null;
  /** Load the next page. */
  loadMore: () => Promise<void>;
  /** Refetch from page 1. */
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch paginated NFTs for an owner address.
 */
export function useNfts(params: UseNftsParams | null): UseNftsReturn {
  const {
    address,
    chainId,
    contractAddress,
    pageSize = 20,
    autoFetch = true,
  } = params ?? {};

  const fetcher = params?.fetcher ?? getDefaultFetcher();
  const [nfts, setNfts] = useState<NftMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cursorRef = useRef<string | undefined>(undefined);

  const fetchPage = useCallback(async (reset = false) => {
    if (!address || !chainId) return;

    if (reset) {
      setNfts([]);
      cursorRef.current = undefined;
      setHasNextPage(false);
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher.getNftsByOwner({
        address,
        chainId,
        limit: pageSize,
        cursor: cursorRef.current,
        contractAddress,
      });

      setNfts((prev) => (reset ? result.nfts : [...prev, ...result.nfts]));
      setHasNextPage(!!result.nextCursor);
      cursorRef.current = result.nextCursor;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [address, chainId, contractAddress, pageSize, fetcher]);

  // Auto-fetch on mount or params change
  useEffect(() => {
    if (autoFetch && address && chainId) {
      fetchPage(true);
    }
  }, [address, chainId, contractAddress, autoFetch, fetchPage]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isLoading) {
      return fetchPage(false);
    }
    return Promise.resolve();
  }, [hasNextPage, isLoading, fetchPage]);

  const refetch = useCallback(() => fetchPage(true), [fetchPage]);

  return { nfts, isLoading, hasNextPage, error, loadMore, refetch };
}

// ============================================================
// useNftMetadata Hook
// ============================================================

export interface UseNftMetadataParams {
  /** Contract address. */
  contractAddress: `0x${string}`;
  /** Token ID. */
  tokenId: string;
  /** Chain ID. */
  chainId: SupportedChainId;
  /** Custom NftFetcher instance. */
  fetcher?: NftFetcher;
  /** Whether to auto-fetch on mount. */
  autoFetch?: boolean;
}

export interface UseNftMetadataReturn {
  /** NFT metadata (null until loaded). */
  metadata: NftMetadata | null;
  /** Whether loading. */
  isLoading: boolean;
  /** Error if any. */
  error: Error | null;
  /** Refetch. */
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch metadata for a specific NFT.
 */
export function useNftMetadata(params: UseNftMetadataParams | null): UseNftMetadataReturn {
  const fetcher = params?.fetcher ?? getDefaultFetcher();
  const [metadata, setMetadata] = useState<NftMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetadata = useCallback(async () => {
    if (!params) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher.getNftMetadata({
        contractAddress: params.contractAddress,
        tokenId: params.tokenId,
        chainId: params.chainId,
      });
      setMetadata(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setMetadata(null);
    } finally {
      setIsLoading(false);
    }
  }, [params, fetcher]);

  useEffect(() => {
    if (params?.autoFetch !== false && params) {
      fetchMetadata();
    }
  }, [params?.contractAddress, params?.tokenId, params?.chainId, params?.autoFetch, fetchMetadata]);

  return { metadata, isLoading, error, refetch: fetchMetadata };
}
