/**
 * `BlockchainApiClient` — a thin, typed wrapper around viem
 * for reading on-chain data (balances, transactions, ENS, tokens, NFTs).
 *
 * ```ts
 * const client = new BlockchainApiClient({ defaultChainId: 1 });
 * const balance = await client.getBalance("0x…", 1);
 * ```
 *
 * This file contains the main client class. Supporting modules:
 * - cache.ts: Transaction history cache
 * - chains.ts: Chain registry and client builder
 * - nft.ts: NFT ABIs, metadata helpers, scanning utilities
 */

import { logger } from "@cinacoin/logger";
import {
  type Address,
  type Hex,
  type PublicClient,
  formatUnits,
} from "viem";
import type {
  Balance,
  BlockchainApiConfig,
  NFTItem,
  PaginatedResult,
  TokenMetadata,
  Transaction,
  TransactionHistoryQuery,
} from "./types.js";
import { txCacheKey, getTxCached, setTxCached } from "./cache.js";
import { buildClient } from "./chains.js";
import {
  erc20ReadAbi,
  scanErc721,
  scanErc1155,
} from "./nft.js";

// ---------------------------------------------------------------------------
// ERC-20 ABI (kept here — used by getBalance/getTokenBalances/getTokenMetadata)
// ---------------------------------------------------------------------------

/**
 * ERC-20 ABI subset for read operations.
 * viem ships `erc20Abi` but we keep a small inline copy
 * to avoid importing the full array when tree-shaking.
 */
const erc20ReadAbi = [
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

/**
 * `BlockchainApiClient` — a thin, typed wrapper around viem
 * for reading on-chain data (balances, transactions, ENS, tokens, NFTs).
 *
 * ```ts
 * const client = new BlockchainApiClient({ defaultChainId: 1 });
 * const balance = await client.getBalance("0x…", 1);
 * ```
 */
export class BlockchainApiClient {
  readonly config: Pick<BlockchainApiConfig, "rpcUrls" | "ensResolvers" | "metadataBaseUrl" | "alchemyApiKey" | "covalentApiKey"> & {
    defaultChainId: number;
  };

  /** In-flight client cache keyed by chain id. */
  private _clients = new Map<number, PublicClient>();

  constructor(config: BlockchainApiConfig = {}) {
    this.config = {
      rpcUrls: config.rpcUrls ?? {},
      ensResolvers: config.ensResolvers ?? {},
      metadataBaseUrl: config.metadataBaseUrl,
      alchemyApiKey: config.alchemyApiKey,
      covalentApiKey: config.covalentApiKey,
      defaultChainId: config.defaultChainId ?? 1,
    };
  }

  // -- internal -----------------------------------------------------------

  /** Get (or create) a viem PublicClient for `chainId`. */
  private _getClient(chainId: number): PublicClient {
    let client = this._clients.get(chainId);
    if (!client) {
      client = buildClient(chainId, this.config.rpcUrls?.[chainId]);
      this._clients.set(chainId, client);
    }
    return client;
  }

  // -- public API ---------------------------------------------------------

  /**
   * Get the native token balance for an address.
   *
   * @param address — wallet address (hex or ENS-resolved).
   * @param chainId — EVM chain id (defaults to `defaultChainId`).
   * @returns Balance object for the native token.
   */
  async getBalance(
    address: string,
    chainId?: number
  ): Promise<Balance> {
    const cid = chainId ?? this.config.defaultChainId;
    const client = this._getClient(cid);
    const balance = await client.getBalance({ address: address as Address });
    const chain = client.chain;
    const nativeSymbol = chain?.nativeCurrency?.symbol ?? "ETH";
    const nativeName = chain?.nativeCurrency?.name ?? "Ether";
    const decimals = chain?.nativeCurrency?.decimals ?? 18;

    return {
      symbol: nativeSymbol,
      name: nativeName,
      decimals,
      balance,
      formatted: formatUnits(balance, decimals),
    };
  }

  /**
   * Fetch balances for multiple ERC-20 tokens + native token in one call.
   *
   * @param address — wallet address.
   * @param chainId — EVM chain id.
   * @param tokenAddresses — optional list of ERC-20 addresses to query.
   *   If omitted, queries a default set of popular tokens.
   * @returns Array of Balance objects.
   */
  async getTokenBalances(
    address: string,
    chainId?: number,
    tokenAddresses?: string[]
  ): Promise<Balance[]> {
    const cid = chainId ?? this.config.defaultChainId;
    const client = this._getClient(cid);
    const addr = address as Address;

    const tokens = tokenAddresses ?? this._defaultTokens(cid);
    const results: Balance[] = [];

    // Fetch all token balances in parallel
    const tokenResults = await Promise.allSettled(
      tokens.map(async (tokenAddr) => {
        const [balance, meta] = await Promise.all([
          client.readContract({
            address: tokenAddr as Address,
            abi: erc20ReadAbi,
            functionName: "balanceOf",
            args: [addr],
          }) as Promise<bigint>,
          this.getTokenMetadata(tokenAddr, cid),
        ]);

        const formatted = formatUnits(balance, meta.decimals);
        return {
          tokenAddress: tokenAddr,
          symbol: meta.symbol,
          name: meta.name,
          decimals: meta.decimals,
          balance,
          formatted,
          logo: meta.logo,
        };
      })
    );

    for (const r of tokenResults) {
      if (r.status === "fulfilled") results.push(r.value);
    }

    // Prepend native balance
    try {
      const nativeBalance = await this.getBalance(address, cid);
      results.unshift(nativeBalance);
    } catch (err) {
      logger.warn(`[blockchain-api:getTokenBalances] native balance error:`, err);
    }

    return results;
  }

  /**
   * Fetch transaction history for an address.
   *
   * @param address — wallet address.
   * @param chainId — EVM chain id.
   * @param limit — max number of transactions (default 20).
   * @param cursor — pagination cursor from a previous call.
   * @returns Paginated list of Transaction objects.
   */
  async getTransactionHistory(
    address: string,
    chainId?: number,
    limit = 20,
    cursor?: string
  ): Promise<PaginatedResult<Transaction>> {
    const cid = chainId ?? this.config.defaultChainId;

    // Check cache first
    const cacheKey = txCacheKey(address, cid, cursor);
    const cached = getTxCached(cacheKey);
    if (cached) {
      return { items: cached.transactions, nextCursor: cached.nextCursor, hasMore: cached.hasMore };
    }

    // Try Alchemy first (most comprehensive)
    if (this.config.alchemyApiKey) {
      try {
        return await this._getTxsViaAlchemy(address, cid, limit, cursor);
      } catch (err) {
        logger.warn(`[blockchain-api:getTransactionHistory] Alchemy error:`, err);
      }
    }

    // Try Covalent / GoldRush
    if (this.config.covalentApiKey) {
      try {
        return await this._getTxsViaCovalent(address, cid, limit, cursor);
      } catch (err) {
        logger.warn(`[blockchain-api:getTransactionHistory] Covalent error:`, err);
      }
    }

    // Fallback: scan recent blocks on-chain
    return this._getTxsOnChain(address, cid, limit, cursor);
  }

  /**
   * Fetch multi-chain transaction history for an address.
   *
   * Queries ETH, Polygon, and BSC by default. Supports pagination,
   * filtering by type, time range, status, and token address.
   *
   * @param query — TransactionHistoryQuery parameters.
   * @returns Paginated list of Transaction objects across all chains.
   */
  async getMultiChainTransactionHistory(
    query: TransactionHistoryQuery
  ): Promise<PaginatedResult<Transaction>> {
    const { address, chainIds, limit = 20, cursor, type, tokenAddress, timeFrom, timeTo, status, sortOrder } = query;
    const chains = chainIds ?? [1, 137, 56]; // ETH, Polygon, BSC default
    const perChainLimit = Math.max(1, Math.ceil(limit / chains.length));

    const allTransactions: Transaction[] = [];
    let nextCursor: string | undefined;
    let hasMore = false;

    // Parse cursor: format is "chainId:blockNumber"
    let startChainIdx = 0;
    if (cursor) {
      const parts = cursor.split(":");
      if (parts.length >= 2) {
        const cursorChainId = parseInt(parts[0], 10);
        const chainIdx = chains.findIndex(c => c === cursorChainId);
        if (chainIdx >= 0) startChainIdx = chainIdx;
      }
    }

    // Query each chain in parallel
    const chainResults = await Promise.allSettled(
      chains.map(async (chainId) => {
        const chainCursor = cursor && cursor.startsWith(`${chainId}:`)
          ? cursor.substring(`${chainId}:`.length)
          : undefined;

        return this._getSingleChainTransactions(address, chainId, perChainLimit, chainCursor, {
          type,
          tokenAddress,
          timeFrom,
          timeTo,
          status,
          sortOrder,
        });
      })
    );

    // Merge results
    for (const result of chainResults) {
      if (result.status === "fulfilled") {
        allTransactions.push(...result.value.items);
        if (result.value.hasMore) {
          hasMore = true;
        }
      }
    }

    // Sort by timestamp (newest first by default)
    const sorted = allTransactions.sort((a, b) => {
      const timeA = a.timestamp ?? 0;
      const timeB = b.timestamp ?? 0;
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });

    // Apply limit
    const limited = sorted.slice(0, limit);

    // Generate cursor for pagination if there are more results
    if (sorted.length > limit) {
      const lastTx = limited[limited.length - 1];
      nextCursor = `${lastTx.chainId}:${lastTx.blockNumber || 0}`;
    }

    // Cache the result
    if (limited.length > 0) {
      const firstChain = limited[0].chainId ?? chains[0];
      const cacheKey = txCacheKey(address, firstChain, undefined, type, timeFrom, timeTo);
      setTxCached(cacheKey, limited, nextCursor, hasMore);
    }

    return {
      items: limited,
      nextCursor,
      hasMore: hasMore || sorted.length > limit,
    };
  }

  /**
   * Get full details for a single transaction.
   */
  async getTransaction(
    txHash: string,
    chainId?: number
  ): Promise<Transaction | null> {
    const cid = chainId ?? this.config.defaultChainId;
    const client = this._getClient(cid);

    const tx = await client.getTransaction({
      hash: txHash as Hex,
    });

    if (!tx) return null;

    const receipt = await client.getTransactionReceipt({
      hash: txHash as Hex,
    });

    const block = tx.blockNumber
      ? await client.getBlock({ blockNumber: tx.blockNumber })
      : undefined;

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to ?? undefined,
      value: tx.value,
      status: receipt
        ? receipt.status === "success"
          ? "success"
          : "failed"
        : "pending",
      blockNumber: tx.blockNumber != null ? Number(tx.blockNumber) : undefined,
      timestamp: block ? Number(block.timestamp) : undefined,
      gasUsed: receipt?.gasUsed,
    };
  }

  /**
   * Resolve an ENS name to an Ethereum address.
   */
  async resolveENS(name: string): Promise<string | null> {
    const client = this._getClient(1); // ENS lives on mainnet
    try {
      const address = await client.getEnsAddress({ name });
      return address ?? null;
    } catch (err) {
      logger.warn(`[blockchain-api:resolveENS] error:`, err);
      return null;
    }
  }

  /**
   * Reverse ENS lookup — get the ENS name for an address.
   */
  async reverseENS(
    address: string,
    _chainId?: number
  ): Promise<string | null> {
    const client = this._getClient(1);
    try {
      const name = await client.getEnsName({ address: address as Address });
      return name ?? null;
    } catch (err) {
      logger.warn(`[blockchain-api:reverseENS] error:`, err);
      return null;
    }
  }

  /**
   * Fetch metadata for an ERC-20 token.
   */
  async getTokenMetadata(
    tokenAddress: string,
    chainId?: number
  ): Promise<TokenMetadata> {
    const cid = chainId ?? this.config.defaultChainId;
    const client = this._getClient(cid);
    const addr = tokenAddress as Address;

    const [symbol, name, decimals, totalSupply] = await Promise.all([
      client.readContract({
        address: addr,
        abi: erc20ReadAbi,
        functionName: "symbol",
      }) as Promise<string>,
      client.readContract({
        address: addr,
        abi: erc20ReadAbi,
        functionName: "name",
      }) as Promise<string>,
      client.readContract({
        address: addr,
        abi: erc20ReadAbi,
        functionName: "decimals",
      }) as Promise<number>,
      client.readContract({
        address: addr,
        abi: erc20ReadAbi,
        functionName: "totalSupply",
      }) as Promise<bigint>,
    ]);

    return {
      address: tokenAddress,
      symbol,
      name,
      decimals,
      totalSupply,
    };
  }

  /**
   * Fetch NFTs owned by an address.
   */
  async getNFTs(
    address: string,
    chainId?: number,
    limit = 20,
    _cursor?: string
  ): Promise<PaginatedResult<NFTItem>> {
    const cid = chainId ?? this.config.defaultChainId;
    const client = this._getClient(cid);
    const owner = address as Address;
    const items: NFTItem[] = [];

    const knownNftContracts = this._knownNftContracts(cid);

    for (const { contractAddress, tokenIds } of knownNftContracts) {
      if (items.length >= limit) break;

      const nfts721 = await scanErc721(
        client, contractAddress as Address, owner, tokenIds, limit - items.length
      );
      items.push(...nfts721);

      if (items.length >= limit) break;

      const nfts1155 = await scanErc1155(
        client, contractAddress as Address, owner, tokenIds, limit - items.length
      );
      items.push(...nfts1155);
    }

    if (items.length === 0) {
      const fallback = await this._scanNftsByEnumeration(
        client, cid, owner, limit
      );
      items.push(...fallback);
    }

    return {
      items: items.slice(0, limit),
      hasMore: items.length > limit,
      nextCursor: items.length > limit ? items[limit - 1]?.tokenId : undefined,
    };
  }

  // -- private: transaction fetching ----------------------------------------

  private async _getSingleChainTransactions(
    address: string,
    chainId: number,
    limit: number,
    cursor?: string,
    filters?: {
      type?: string;
      tokenAddress?: string;
      timeFrom?: number;
      timeTo?: number;
      status?: string;
      sortOrder?: string;
    }
  ): Promise<PaginatedResult<Transaction>> {
    const cacheKey = txCacheKey(address, chainId, cursor, filters?.type, filters?.timeFrom, filters?.timeTo);
    const cached = getTxCached(cacheKey);
    if (cached) {
      return { items: cached.transactions, nextCursor: cached.nextCursor, hasMore: cached.hasMore };
    }

    if (this.config.alchemyApiKey) {
      try {
        return await this._getTxsViaAlchemy(address, chainId, limit, cursor, filters);
      } catch (err) {
        logger.warn(`[blockchain-api:_getSingleChainTransactions] Alchemy error:`, err);
      }
    }

    if (this.config.covalentApiKey) {
      try {
        return await this._getTxsViaCovalent(address, chainId, limit, cursor, filters);
      } catch (err) {
        logger.warn(`[blockchain-api:_getSingleChainTransactions] Covalent error:`, err);
      }
    }

    return this._getTxsOnChain(address, chainId, limit, cursor, filters);
  }

  private async _getTxsViaAlchemy(
    address: string,
    chainId: number,
    limit: number,
    cursor?: string,
    filters?: { type?: string; tokenAddress?: string; timeFrom?: number; timeTo?: number; status?: string; sortOrder?: string }
  ): Promise<PaginatedResult<Transaction>> {
    const chainMap: Record<number, string> = {
      1: "eth-mainnet",
      137: "polygon-mainnet",
      56: "bnb-mainnet",
      42161: "arb-mainnet",
      10: "opt-mainnet",
      8453: "base-mainnet",
    };

    const network = chainMap[chainId];
    if (!network) {
      throw new Error(`Alchemy not supported on chain ${chainId}`);
    }

    const alchemyUrl = `https://${network}.g.alchemy.com/v2/${this.config.alchemyApiKey}`;
    const pageKey = cursor ? JSON.parse(cursor).pageKey : undefined;

    const txsResponse = await fetch(alchemyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "alchemy_getAssetTransfers",
        params: [
          {
            fromAddress: address,
            toAddress: address,
            category: ["external"],
            maxCount: limit,
            pageKey,
            order: filters?.sortOrder === "asc" ? "asc" : "desc",
          },
        ],
      }),
    });

    if (!txsResponse.ok) {
      throw new Error(`Alchemy API error: ${txsResponse.status}`);
    }

    const txsData = await txsResponse.json() as {
      result?: {
        transfers: Array<{
          hash: string;
          from: string;
          to: string;
          value: string;
          blockNum: string;
          timestamp?: string;
          gas?: string;
          category: string;
        }>;
        pageKey?: string;
      };
      error?: { message: string };
    };

    if (txsData.error) {
      throw new Error(`Alchemy error: ${txsData.error.message}`);
    }

    const transfers = txsData.result?.transfers ?? [];
    const transactions: Transaction[] = transfers
      .map((tx) => {
        const timestamp = tx.timestamp ? parseInt(tx.timestamp, 16) : undefined;
        if (filters?.timeFrom && timestamp && timestamp < filters.timeFrom) return null;
        if (filters?.timeTo && timestamp && timestamp > filters.timeTo) return null;

        return {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: BigInt(tx.value || "0"),
          status: "success" as const,
          blockNumber: parseInt(tx.blockNum, 16),
          timestamp,
          chainId,
          type: "native" as const,
        } as Transaction;
      })
      .filter((tx): tx is Transaction => tx !== null);

    const nextCursor = txsData.result?.pageKey
      ? JSON.stringify({ pageKey: txsData.result.pageKey })
      : undefined;

    const result: PaginatedResult<Transaction> = {
      items: transactions.slice(0, limit),
      nextCursor,
      hasMore: !!txsData.result?.pageKey,
    };

    const cacheKey = txCacheKey(address, chainId, undefined, filters?.type, filters?.timeFrom, filters?.timeTo);
    setTxCached(cacheKey, result.items, nextCursor, result.hasMore);

    return result;
  }

  private async _getTxsViaCovalent(
    address: string,
    chainId: number,
    limit: number,
    cursor?: string,
    filters?: { type?: string; tokenAddress?: string; timeFrom?: number; timeTo?: number; status?: string }
  ): Promise<PaginatedResult<Transaction>> {
    const chainNameMap: Record<number, string> = {
      1: "eth-mainnet",
      137: "polygon-mainnet",
      56: "bsc-mainnet",
      42161: "arbitrum-mainnet",
      10: "optimism-mainnet",
      8453: "base-mainnet",
    };

    const chainName = chainNameMap[chainId];
    if (!chainName) {
      throw new Error(`Covalent not supported on chain ${chainId}`);
    }

    let url = `https://api.covalenthq.com/v1/${chainName}/address/${address}/transactions_v2/?limit=${limit}`;

    if (cursor) url += `&page-token=${encodeURIComponent(cursor)}`;
    if (filters?.tokenAddress) url += `&contract-address=${filters.tokenAddress}`;
    if (filters?.timeFrom) url += `&start-time=${filters.timeFrom}`;
    if (filters?.timeTo) url += `&end-time=${filters.timeTo}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${btoa(`${this.config.covalentApiKey}:`)}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Covalent API error: ${response.status}`);
    }

    const data = await response.json() as {
      data?: {
        items: Array<{
          tx_hash: string;
          from_address: string;
          to_address: string;
          value: string;
          block_height: number;
          block_signed_at: string;
          gas_spent: string;
          successful: boolean;
          log_events?: Array<{
            sender_address: string;
            decoded?: { name: string };
          }>;
        }>;
        pagination?: {
          has_more: boolean;
          next_page_token?: string;
        };
      };
      error?: boolean;
      error_message?: string;
    };

    if (data.error) {
      throw new Error(`Covalent error: ${data.error_message}`);
    }

    const items = data.data?.items ?? [];
    const transactions: Transaction[] = items.map((tx) => ({
      hash: tx.tx_hash,
      from: tx.from_address,
      to: tx.to_address,
      value: BigInt(tx.value || "0"),
      status: tx.successful ? "success" as const : "failed" as const,
      blockNumber: tx.block_height,
      timestamp: tx.block_signed_at ? new Date(tx.block_signed_at).getTime() / 1000 : undefined,
      gasUsed: tx.gas_spent ? BigInt(tx.gas_spent) : undefined,
      chainId,
      type: "native" as const,
      method: tx.log_events?.[0]?.decoded?.name,
    }));

    const pagination = data.data?.pagination;
    const result: PaginatedResult<Transaction> = {
      items: transactions.slice(0, limit),
      nextCursor: pagination?.next_page_token,
      hasMore: pagination?.has_more ?? false,
    };

    const cacheKey = txCacheKey(address, chainId, undefined, filters?.type, filters?.timeFrom, filters?.timeTo);
    setTxCached(cacheKey, result.items, result.nextCursor, result.hasMore);

    return result;
  }

  private async _getTxsOnChain(
    address: string,
    chainId: number,
    limit: number,
    cursor?: string,
    filters?: { type?: string; timeFrom?: number; timeTo?: number; status?: string }
  ): Promise<PaginatedResult<Transaction>> {
    const client = this._getClient(chainId);
    const lowerAddress = address.toLowerCase();

    let startBlock: number;
    try {
      const block = await client.getBlockNumber();
      startBlock = Number(block);
    } catch (err) {
      logger.warn(`[blockchain-api:_getTxsOnChain] getBlockNumber error:`, err);
      return { items: [], hasMore: false };
    }

    if (cursor) {
      const blockNum = parseInt(cursor, 10);
      if (!isNaN(blockNum) && blockNum < startBlock) {
        startBlock = blockNum;
      }
    }

    const transactions: Transaction[] = [];
    const scanLimit = Math.min(limit * 10, 100);

    for (let blockNum = startBlock; blockNum > startBlock - scanLimit && transactions.length < limit; blockNum--) {
      try {
        const block = await client.getBlock({ blockNumber: BigInt(blockNum), includeTransactions: true });
        const timestamp = Number(block.timestamp);

        if (filters?.timeFrom && timestamp < filters.timeFrom) continue;
        if (filters?.timeTo && timestamp > filters.timeTo) continue;

        for (const tx of block.transactions) {
          const from = (tx.from || "").toLowerCase();
          const to = (tx.to || "").toLowerCase();

          if (from === lowerAddress || to === lowerAddress) {
            let status: "success" | "failed" | "pending" = "success";
            let gasUsed: bigint | undefined;

            try {
              const receipt = await client.getTransactionReceipt({ hash: tx.hash });
              status = receipt?.status === "success" ? "success" : "failed";
              gasUsed = receipt?.gasUsed;
            } catch (err) {
              logger.warn(`[blockchain-api:_getTxsOnChain] receipt error:`, err);
            }

            if (filters?.status && status !== filters.status) continue;

            transactions.push({
              hash: tx.hash,
              from: tx.from,
              to: tx.to ?? undefined,
              value: tx.value,
              status,
              blockNumber: blockNum,
              timestamp,
              gasUsed,
              chainId,
              type: "native" as const,
              nonce: "nonce" in tx ? (tx.nonce as number) : undefined,
            });
          }
        }
      } catch (err) {
        logger.warn(`[blockchain-api:_getTxsOnChain] block error:`, err);
      }
    }

    const nextBlock = startBlock - scanLimit;
    const result: PaginatedResult<Transaction> = {
      items: transactions.slice(0, limit),
      nextCursor: transactions.length >= limit ? String(nextBlock) : undefined,
      hasMore: transactions.length >= limit,
    };

    const cacheKey = txCacheKey(address, chainId, undefined, filters?.type, filters?.timeFrom, filters?.timeTo);
    setTxCached(cacheKey, result.items, result.nextCursor, result.hasMore);

    return result;
  }

  // -- private: NFT helpers -------------------------------------------------

  private async _scanNftsByEnumeration(
    _client: PublicClient,
    _chainId: number,
    _owner: Address,
    _limit: number
  ): Promise<NFTItem[]> {
    return [];
  }

  private _knownNftContracts(_chainId: number): { contractAddress: string; tokenIds: string[] }[] {
    return [];
  }

  private _defaultTokens(_chainId: number): string[] {
    return [];
  }
}

/** Convenience factory. */
export function createBlockchainApi(
  config?: BlockchainApiConfig
): BlockchainApiClient {
  return new BlockchainApiClient(config);
}
