import type { Balance, BlockchainApiConfig, NFTItem, PaginatedResult, TokenMetadata, Transaction } from "./types.js";
/**
 * `BlockchainApiClient` — a thin, typed wrapper around viem
 * for reading on-chain data (balances, transactions, ENS, tokens, NFTs).
 *
 * ```ts
 * const client = new BlockchainApiClient({ defaultChainId: 1 });
 * const balance = await client.getBalance("0x…", 1);
 * ```
 */
export declare class BlockchainApiClient {
    readonly config: Required<Omit<BlockchainApiConfig, "metadataBaseUrl">> & Pick<BlockchainApiConfig, "metadataBaseUrl">;
    /** In-flight client cache keyed by chain id. */
    private _clients;
    constructor(config?: BlockchainApiConfig);
    /** Get (or create) a viem PublicClient for `chainId`. */
    private _getClient;
    /**
     * Get the native token balance for an address.
     *
     * @param address — wallet address (hex or ENS-resolved).
     * @param chainId — EVM chain id (defaults to `defaultChainId`).
     * @returns Balance object for the native token.
     */
    getBalance(address: string, chainId?: number): Promise<Balance>;
    /**
     * Fetch balances for multiple ERC-20 tokens + native token in one call.
     *
     * @param address — wallet address.
     * @param chainId — EVM chain id.
     * @param tokenAddresses — optional list of ERC-20 addresses to query.
     *   If omitted, queries a default set of popular tokens.
     * @returns Array of Balance objects.
     */
    getTokenBalances(address: string, chainId?: number, tokenAddresses?: string[]): Promise<Balance[]>;
    /**
     * Fetch transaction history for an address.
     *
     * NOTE: Raw transaction enumeration from a public RPC is not natively
     * supported by viem / standard JSON-RPC. This method returns an empty
     * result by default; wire it to an indexer (Alchemy, Covalent, TheGraph)
     * in production.
     *
     * @param address — wallet address.
     * @param chainId — EVM chain id.
     * @param limit — max number of transactions (default 20).
     * @param cursor — pagination cursor from a previous call.
     * @returns Paginated list of Transaction objects.
     */
    getTransactionHistory(_address: string, _chainId?: number, limit?: number, _cursor?: string): Promise<PaginatedResult<Transaction>>;
    /**
     * Get full details for a single transaction.
     *
     * @param txHash — transaction hash.
     * @param chainId — EVM chain id.
     * @returns Transaction object with on-chain details.
     */
    getTransaction(txHash: string, chainId?: number): Promise<Transaction | null>;
    /**
     * Resolve an ENS name to an Ethereum address.
     *
     * @param name — ENS domain name (e.g. `vitalik.eth`).
     * @returns Ethereum address or null if not found.
     */
    resolveENS(name: string): Promise<string | null>;
    /**
     * Reverse ENS lookup — get the ENS name for an address.
     *
     * @param address — Ethereum address.
     * @param chainId — EVM chain id (ENS uses mainnet regardless).
     * @returns ENS name or null.
     */
    reverseENS(address: string, _chainId?: number): Promise<string | null>;
    /**
     * Fetch metadata for an ERC-20 token.
     *
     * @param tokenAddress — contract address.
     * @param chainId — EVM chain id.
     * @returns TokenMetadata object.
     */
    getTokenMetadata(tokenAddress: string, chainId?: number): Promise<TokenMetadata>;
    /**
     * Fetch NFTs owned by an address.
     *
     * NOTE: Like `getTransactionHistory`, NFT enumeration requires an indexer.
     * This method returns an empty result by default.
     *
     * @param address — wallet address.
     * @param chainId — EVM chain id.
     * @param limit — max number of NFTs (default 20).
     * @param cursor — pagination cursor.
     * @returns Paginated list of NFTItem objects.
     */
    getNFTs(_address: string, _chainId?: number, _limit?: number, _cursor?: string): Promise<PaginatedResult<NFTItem>>;
    /** Default token list per chain (extendable). */
    private _defaultTokens;
}
/** Convenience factory. */
export declare function createBlockchainApi(config?: BlockchainApiConfig): BlockchainApiClient;
//# sourceMappingURL=client.d.ts.map