/** Shared type definitions for the blockchain-api package. */
/** On-chain token balance with optional USD pricing. */
export interface Balance {
    /** ERC-20 contract address (undefined for native token). */
    tokenAddress?: string;
    symbol: string;
    name: string;
    decimals: number;
    /** Raw on-chain balance (in smallest unit / wei). */
    balance: bigint;
    /** Human-readable balance string. */
    formatted: string;
    /** Token logo URL (if available). */
    logo?: string;
    /** Current USD price per unit. */
    priceUsd?: number;
    /** USD value of this balance. */
    valueUsd?: number;
}
/** Simplified transaction record. */
export interface Transaction {
    hash: string;
    from: string;
    to?: string;
    /** Transfer value in wei. */
    value: bigint;
    status: "success" | "failed" | "pending";
    blockNumber?: number;
    /** Unix timestamp of the block (if available). */
    timestamp?: number;
    /** Gas consumed. */
    gasUsed?: bigint;
    /** Decoded function name (if available). */
    method?: string;
}
/** ERC-20 token information. */
export interface TokenMetadata {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logo?: string;
    totalSupply?: bigint;
}
/** NFT portfolio item. */
export interface NFTItem {
    contractAddress: string;
    tokenId: string;
    name?: string;
    description?: string;
    imageUrl?: string;
    tokenType?: "ERC721" | "ERC1155";
    balance?: bigint;
}
/** Generic paginated result. */
export interface PaginatedResult<T> {
    items: T[];
    nextCursor?: string;
    hasMore: boolean;
}
/** Configuration for `BlockchainApiClient`. */
export interface BlockchainApiConfig {
    /**
     * RPC URL keyed by chain id.
     * Falls back to viem default public clients if omitted.
     */
    rpcUrls?: Record<number, string>;
    /** Optional ENS resolver address override (per-chain). */
    ensResolvers?: Record<number, `0x${string}`>;
    /** Base URL for metadata services (price, logo, etc.). */
    metadataBaseUrl?: string;
    /** Default chain id for calls that omit `chainId`. */
    defaultChainId?: number;
}
//# sourceMappingURL=types.d.ts.map