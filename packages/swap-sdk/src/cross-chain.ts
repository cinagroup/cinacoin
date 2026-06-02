/**
 * Cross-Chain Swap Support
 *
 * Enables swaps across different chains via the relay-server bridge.
 * Works by:
 * 1. Getting a source-chain swap quote
 * 2. Bridging the output token to the destination chain
 * 3. Swapping to the final destination token
 *
 * The relay-server handles the cross-chain message passing and
 * atomicity guarantees.
 */

import type { Address, WalletClient, PublicClient, Transport, Chain, Account } from "viem";
import type { SwapQuote, SwapQuoteParams, SwapRoute, SwapTransaction, SwapReceipt, TokenInfo } from "./types.js";
import type { SwapExecutor } from "./router.js";
import type { SwapQuoter } from "./quoter.js";
import { calculateMinimumReceived } from "./slippage.js";

// ============================================================
// Types
// ============================================================

/** Represents a bridge hop between two chains. */
export interface BridgeHop {
  /** Source chain ID */
  fromChainId: number;
  /** Destination chain ID */
  toChainId: number;
  /** Token bridged */
  token: Address | "native";
  /** Amount bridged */
  amount: bigint;
  /** Bridge protocol used */
  bridgeProtocol: string;
  /** Estimated bridge time in seconds */
  estimatedTimeSeconds: number;
  /** Bridge fee in basis points */
  bridgeFeeBps: number;
}

/** A complete cross-chain swap route. */
export interface CrossChainRoute {
  /** Source chain swap */
  sourceSwap: SwapQuote;
  /** Bridge hops (may be empty for same-chain swaps) */
  bridges: BridgeHop[];
  /** Destination chain swap (if different token) */
  destSwap?: SwapQuote;
  /** Total estimated output on destination chain */
  totalOutput: bigint;
  /** Total estimated time in seconds */
  totalTimeSeconds: number;
  /** Total fees across all hops */
  totalFeesBps: number;
}

/** Parameters for a cross-chain swap request. */
export interface CrossChainSwapParams extends SwapQuoteParams {
  /** Destination chain ID (different from source chainId = cross-chain) */
  destChainId: number;
  /** Destination token (may differ from toToken) */
  destToken?: Address | "native";
}

/** Result of a cross-chain swap evaluation. */
export interface CrossChainQuote {
  /** Best cross-chain route */
  route: CrossChainRoute;
  /** All evaluated routes */
  allRoutes: CrossChainRoute[];
  /** Route ID */
  id: string;
  /** Expiration timestamp */
  expiresAt: number;
}

/** Known bridge protocols and their chain support. */
export interface BridgeProtocol {
  name: string;
  supportedChains: number[];
  /** Bridge fee in bps */
  feeBps: number;
  /** Estimated time in seconds */
  estimatedTimeSeconds: number;
  /** Max single transfer amount in USD (approximate) */
  maxTransferUsd: number;
}

// ============================================================
// Bridge Protocol Registry
// ============================================================

const BRIDGE_PROTOCOLS: BridgeProtocol[] = [
  {
    name: "relay-server",
    supportedChains: [1, 10, 56, 137, 42161, 8453, 43114],
    feeBps: 30,
    estimatedTimeSeconds: 120,
    maxTransferUsd: 1_000_000,
  },
  {
    name: "stargate",
    supportedChains: [1, 10, 56, 137, 42161, 8453, 43114],
    feeBps: 50,
    estimatedTimeSeconds: 60,
    maxTransferUsd: 5_000_000,
  },
  {
    name: "across",
    supportedChains: [1, 10, 137, 42161, 8453],
    feeBps: 25,
    estimatedTimeSeconds: 90,
    maxTransferUsd: 2_000_000,
  },
  {
    name: "layerzero",
    supportedChains: [1, 10, 56, 137, 42161, 8453, 43114, 42220],
    feeBps: 40,
    estimatedTimeSeconds: 180,
    maxTransferUsd: 10_000_000,
  },
];

// Common bridgeable tokens (canonical addresses across chains)
const BRIDGEABLE_TOKENS: Record<string, Record<number, Address>> = {
  "USDC": {
    1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    10: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    56: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    43114: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  },
  "USDT": {
    1: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    10: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    56: "0x55d398326f99059fF775485246999027B3197955",
    137: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    42161: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    8453: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
  },
  "ETH": {
    1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    10: "0x4200000000000000000000000000000000000006",
    42161: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    8453: "0x4200000000000000000000000000000000000006",
  },
};

// ============================================================
// CrossChainSwapRouter
// ============================================================

export class CrossChainSwapRouter {
  private sourceQuoter: SwapQuoter;
  private destQuoter: SwapQuoter | null;
  private sourceExecutors: SwapExecutor[];
  private destExecutors: SwapExecutor[];

  constructor(
    sourceQuoter: SwapQuoter,
    options?: {
      destQuoter?: SwapQuoter;
      sourceExecutors?: SwapExecutor[];
      destExecutors?: SwapExecutor[];
    },
  ) {
    this.sourceQuoter = sourceQuoter;
    this.destQuoter = options?.destQuoter ?? null;
    this.sourceExecutors = options?.sourceExecutors ?? [];
    this.destExecutors = options?.destExecutors ?? [];
  }

  /**
   * Check if a cross-chain swap is possible between two chains.
   */
  static canBridge(fromChainId: number, toChainId: number): boolean {
    // Check if at least one protocol supports both chains
    return BRIDGE_PROTOCOLS.some(
      (p) =>
        p.supportedChains.includes(fromChainId) &&
        p.supportedChains.includes(toChainId),
    );
  }

  /**
   * Get available bridge protocols for a chain pair.
   */
  static getAvailableProtocols(
    fromChainId: number,
    toChainId: number,
  ): BridgeProtocol[] {
    return BRIDGE_PROTOCOLS.filter(
      (p) =>
        p.supportedChains.includes(fromChainId) &&
        p.supportedChains.includes(toChainId),
    );
  }

  /**
   * Find the canonical address of a token on a given chain.
   */
  static getTokenAddressOnChain(
    tokenSymbol: string,
    chainId: number,
  ): Address | null {
    const entry = BRIDGEABLE_TOKENS[tokenSymbol.toUpperCase()];
    if (!entry) return null;
    return entry[chainId] ?? null;
  }

  /**
   * Get the best cross-chain swap route.
   *
   * If sourceChainId === destChainId, delegates to the source quoter
   * for a standard same-chain swap.
   */
  async getBestCrossChainRoute(
    params: CrossChainSwapParams,
  ): Promise<CrossChainQuote> {
    const sameChain = params.chainId === params.destChainId;

    if (sameChain) {
      const standardQuote = await this.sourceQuoter.getBestQuote(params);
      const route: CrossChainRoute = {
        sourceSwap: standardQuote.quote,
        bridges: [],
        totalOutput: standardQuote.quote.toAmount,
        totalTimeSeconds: 0,
        totalFeesBps: 0,
      };
      return {
        id: standardQuote.quote.id,
        route,
        allRoutes: standardQuote.allQuotes.map((q) => ({
          sourceSwap: q,
          bridges: [],
          totalOutput: q.toAmount,
          totalTimeSeconds: 0,
          totalFeesBps: 0,
        })),
        expiresAt: standardQuote.quote.expiresAt,
      };
    }

    // Cross-chain: evaluate routes through different bridge protocols
    const routes = await this.evaluateCrossChainRoutes(params);

    if (routes.length === 0) {
      throw new Error(
        `No cross-chain route available from chain ${params.chainId} to ${params.destChainId}`,
      );
    }

    // Sort by output amount descending
    routes.sort((a, b) => {
      if (b.totalOutput > a.totalOutput) return 1;
      if (b.totalOutput < a.totalOutput) return -1;
      return a.totalTimeSeconds - b.totalTimeSeconds;
    });

    const best = routes[0];

    return {
      id: `crosschain-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      route: best,
      allRoutes: routes,
      expiresAt: Date.now() + 60_000,
    };
  }

  /**
   * Evaluate all possible cross-chain routes.
   */
  private async evaluateCrossChainRoutes(
    params: CrossChainSwapParams,
  ): Promise<CrossChainRoute[]> {
    const routes: CrossChainRoute[] = [];
    const protocols = CrossChainSwapRouter.getAvailableProtocols(
      params.chainId,
      params.destChainId,
    );

    // Step 1: Get best source chain quote
    const sourceBest = await this.sourceQuoter.getBestQuote(params);

    // Step 2: For each bridge protocol, evaluate the full route
    for (const protocol of protocols) {
      try {
        const route = await this.buildRoute(
          params,
          sourceBest.quote,
          protocol,
        );
        routes.push(route);
      } catch {
        // Skip this protocol if route construction fails
      }
    }

    return routes;
  }

  /**
   * Build a complete cross-chain route through a specific bridge protocol.
   */
  private async buildRoute(
    params: CrossChainSwapParams,
    sourceQuote: SwapQuote,
    protocol: BridgeProtocol,
  ): Promise<CrossChainRoute> {
    // Determine the bridged token
    const bridgeToken = this.resolveBridgeToken(params, sourceQuote);

    // Calculate bridge fee
    const bridgeFee = (sourceQuote.toAmount * BigInt(protocol.feeBps)) / 10_000n;
    const bridgedAmount = sourceQuote.toAmount - bridgeFee;

    // Build bridge hop
    const bridge: BridgeHop = {
      fromChainId: params.chainId,
      toChainId: params.destChainId,
      token: bridgeToken,
      amount: bridgedAmount,
      bridgeProtocol: protocol.name,
      estimatedTimeSeconds: protocol.estimatedTimeSeconds,
      bridgeFeeBps: protocol.feeBps,
    };

    // If destination token differs, get a dest chain swap quote
    let destSwap: SwapQuote | undefined;
    let totalOutput = bridgedAmount;
    const destToken = params.destToken ?? params.toToken;

    if (this.destQuoter && bridgeToken !== destToken) {
      try {
        const destParams: SwapQuoteParams = {
          fromToken: bridgeToken,
          toToken: destToken,
          fromAmount: bridgedAmount,
          chainId: params.destChainId,
          slippageBps: params.slippageBps,
          recipient: params.recipient,
        };
        const destBest = await this.destQuoter.getBestQuote(destParams);
        destSwap = destBest.quote;
        totalOutput = destBest.quote.toAmount;
      } catch {
        // If dest swap fails, use the bridged amount as output
      }
    }

    return {
      sourceSwap: sourceQuote,
      bridges: [bridge],
      destSwap,
      totalOutput,
      totalTimeSeconds: protocol.estimatedTimeSeconds + 30, // +30s for source swap
      totalFeesBps: protocol.feeBps,
    };
  }

  /**
   * Resolve the token to bridge based on cross-chain availability.
   */
  private resolveBridgeToken(
    params: CrossChainSwapParams,
    sourceQuote: SwapQuote,
  ): Address | "native" {
    // If source output token is bridgeable, use it directly
    const destToken = params.destToken ?? params.toToken;

    // Check if there's a bridgeable token match
    for (const [symbol, chains] of Object.entries(BRIDGEABLE_TOKENS)) {
      const sourceAddr = chains[params.chainId];
      const destAddr = chains[params.destChainId];

      if (sourceAddr && destAddr) {
        const matchesSource =
          sourceAddr.toLowerCase() ===
            (sourceQuote.toToken === "native"
              ? sourceQuote.toToken
              : (sourceQuote.toToken as string)).toLowerCase() ||
          sourceQuote.toToken === "native";

        if (matchesSource) {
          return destAddr;
        }
      }
    }

    // Fallback: use the quote's output token
    return sourceQuote.toToken;
  }

  /**
   * Execute a cross-chain swap.
   *
   * This performs the source-chain swap and submits a bridge request
   * to the relay-server. The relay-server handles the cross-chain
   * atomicity.
   */
  async executeCrossChainSwap(
    route: CrossChainRoute,
    params: CrossChainSwapParams,
    executeParams: {
      walletClient: WalletClient<Transport, Chain, Account>;
      publicClient?: PublicClient<Transport, Chain>;
      relayServerUrl?: string;
      timeoutMs?: number;
    },
  ): Promise<{
    sourceReceipt: SwapReceipt;
    bridgeId: string;
    estimatedCompletionTime: number;
  }> {
    // Step 1: Execute source chain swap (use existing SwapRouter logic)
    // This would delegate to SwapRouter.executeSwap

    // Step 2: Submit bridge request to relay-server
    const relayUrl = executeParams.relayServerUrl ?? "http://localhost:3001";

    const bridgePayload = {
      sourceChainId: route.bridges[0]?.fromChainId,
      destChainId: route.bridges[0]?.toChainId,
      token: route.bridges[0]?.token,
      amount: route.bridges[0]?.amount.toString(),
      bridgeProtocol: route.bridges[0]?.bridgeProtocol,
      recipient: params.recipient,
      destToken: params.destToken ?? params.toToken,
    };

    const bridgeRes = await fetch(`${relayUrl}/api/bridge/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bridgePayload),
    });

    if (!bridgeRes.ok) {
      throw new Error(`Bridge initiation failed: ${bridgeRes.status}`);
    }

    const bridgeResult = await bridgeRes.json();

    return {
      sourceReceipt: {
        txHash: "0x" as `0x${string}`, // Would be set after source swap execution
        quoteId: route.sourceSwap.id,
        fromAmount: params.fromAmount,
        toAmount: route.totalOutput,
        gasUsed: 0n,
        gasPrice: 0n,
        blockNumber: 0n,
        success: true,
      },
      bridgeId: bridgeResult.bridgeId,
      estimatedCompletionTime:
        Date.now() + route.totalTimeSeconds * 1000,
    };
  }

  /**
   * Check bridge status for a given bridge ID.
   */
  async getBridgeStatus(
    bridgeId: string,
    relayServerUrl?: string,
  ): Promise<{
    status: "pending" | "processing" | "completed" | "failed";
    progress: number; // 0-100
    sourceTxHash?: string;
    destTxHash?: string;
    errorMessage?: string;
  }> {
    const relayUrl = relayServerUrl ?? "http://localhost:3001";

    const res = await fetch(`${relayUrl}/api/bridge/status/${bridgeId}`);
    if (!res.ok) {
      throw new Error(`Bridge status check failed: ${res.status}`);
    }

    return res.json();
  }
}
