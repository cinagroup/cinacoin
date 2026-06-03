/**
 * BridgeRouter — Optimal Cross-Chain Route Finder
 *
 * Finds the best route for a cross-chain transfer by considering:
 *   - Fees (swap fees, gas costs, protocol fees)
 *   - Speed (estimated confirmation times)
 *   - Liquidity depth (can the pool handle the amount?)
 *   - Multi-hop routing through intermediate chains
 *
 * Routing strategies:
 *   - Direct: Single-hop source → destination
 *   - Multi-hop: source → intermediate → destination
 *   - Liquidity: Route through AMM pools
 *   - Atomic: Route through HTLC swaps
 */

import type { ChainFamily } from "./types";
import { LiquidityPoolManager, type LiquidityPool, type SwapQuote } from "./LiquidityPool";
import type { BridgeRoute } from "./types";

// ============================================================
// Route Types
// ============================================================

/** A hop in a multi-hop route. */
export interface RouteHop {
  /** Source chain for this hop */
  fromChain: ChainFamily;
  fromChainId: number;
  /** Destination chain for this hop */
  toChain: ChainFamily;
  toChainId: number;
  /** Protocol used for this hop */
  protocol: RouteProtocol;
  /** Estimated fee for this hop (in native token smallest unit) */
  fee: bigint;
  /** Estimated time for this hop (seconds) */
  timeSeconds: number;
  /** Available liquidity (in input token) */
  availableLiquidity: bigint;
}

/** Protocol for a route hop. */
export type RouteProtocol =
  | "canonical"     // Canonical bridge (L1↔L2)
  | "atomic_swap"   // HTLC atomic swap
  | "liquidity_pool" // AMM liquidity pool
  | "third_party";  // Third-party bridge (e.g., LayerZero, Wormhole)

/** A complete route from source to destination. */
export interface BridgeRouteOption {
  /** Route ID */
  routeId: string;
  /** Number of hops */
  hopCount: number;
  /** Individual hops */
  hops: RouteHop[];
  /** Total fee (sum of all hops) */
  totalFee: bigint;
  /** Total estimated time (max of hops, not sum, since parallel) */
  totalTimeSeconds: number;
  /** Effective exchange rate */
  effectiveRate: number;
  /** Minimum amount that can be routed */
  minAmount: bigint;
  /** Maximum amount that can be routed */
  maxAmount: bigint;
  /** Route reliability score (0–100) */
  reliabilityScore: number;
  /** Whether this route is currently available */
  available: boolean;
  /** Human-readable description */
  description: string;
}

/** Route finding configuration. */
export interface RouteConfig {
  sourceChain: ChainFamily;
  sourceChainId: number;
  destChain: ChainFamily;
  destChainId: number;
  /** Token symbol */
  tokenSymbol: string;
  /** Transfer amount (smallest unit) */
  amount: bigint;
  /** Maximum acceptable fee (smallest unit) */
  maxFee?: bigint;
  /** Maximum acceptable time (seconds) */
  maxTimeSeconds?: number;
  /** Minimum reliability score */
  minReliabilityScore?: number;
  /** Preferred protocol */
  preferredProtocol?: RouteProtocol;
  /** Whether to include multi-hop routes */
  allowMultiHop?: boolean;
}

/** Route ranking criteria. */
export type RankingCriteria = "lowest_fee" | "fastest" | "most_reliable" | "best_liquidity" | "balanced";

// ============================================================
// Chain Topology
// ============================================================

/** Known direct routes between chains. */
const KNOWN_DIRECT_ROUTES: {
  from: ChainFamily;
  fromId: number;
  to: ChainFamily;
  toId: number;
  protocol: RouteProtocol;
  feeBps: number;
  timeSeconds: number;
  reliability: number;
}[] = [
  // EVM L1 → L2 canonical bridges
  { from: "evm", fromId: 1, to: "evm", toId: 42161, protocol: "canonical", feeBps: 5, timeSeconds: 600, reliability: 99 },
  { from: "evm", fromId: 1, to: "evm", toId: 10, protocol: "canonical", feeBps: 5, timeSeconds: 600, reliability: 99 },
  { from: "evm", fromId: 1, to: "evm", toId: 8453, protocol: "canonical", feeBps: 5, timeSeconds: 600, reliability: 99 },
  { from: "evm", fromId: 1, to: "evm", toId: 137, protocol: "third_party", feeBps: 10, timeSeconds: 1800, reliability: 95 },
  // L2 ↔ L2 (via L1)
  { from: "evm", fromId: 42161, to: "evm", toId: 10, protocol: "canonical", feeBps: 10, timeSeconds: 1200, reliability: 97 },
  { from: "evm", fromId: 42161, to: "evm", toId: 8453, protocol: "canonical", feeBps: 10, timeSeconds: 1200, reliability: 97 },
  { from: "evm", fromId: 10, to: "evm", toId: 8453, protocol: "canonical", feeBps: 10, timeSeconds: 1200, reliability: 97 },
  // Cross-family via atomic swap
  { from: "evm", fromId: 1, to: "solana", toId: 101, protocol: "atomic_swap", feeBps: 30, timeSeconds: 1800, reliability: 90 },
  { from: "evm", fromId: 1, to: "ton", toId: -1, protocol: "atomic_swap", feeBps: 30, timeSeconds: 1800, reliability: 88 },
  { from: "evm", fromId: 1, to: "tron", toId: 1, protocol: "atomic_swap", feeBps: 25, timeSeconds: 1200, reliability: 85 },
  // Solana routes
  { from: "solana", fromId: 101, to: "evm", toId: 1, protocol: "atomic_swap", feeBps: 30, timeSeconds: 1800, reliability: 90 },
];

/** Chains that can serve as intermediate hubs. */
const INTERMEDIATE_HUBS: { chain: ChainFamily; chainId: number; label: string }[] = [
  { chain: "evm", chainId: 1, label: "Ethereum" },
  { chain: "evm", chainId: 42161, label: "Arbitrum" },
];

// ============================================================
// BridgeRouter
// ============================================================

export class BridgeRouter {
  private poolManager: LiquidityPoolManager;
  private customRoutes: BridgeRoute[] = [];

  constructor(options?: { poolManager?: LiquidityPoolManager }) {
    this.poolManager = options?.poolManager ?? new LiquidityPoolManager();
  }

  /**
   * Find the optimal route for a cross-chain transfer.
   * Returns a ranked list of route options.
   */
  findRoutes(config: RouteConfig): BridgeRouteOption[] {
    const routes: BridgeRouteOption[] = [];

    // 1. Find direct routes
    const directRoutes = this.findDirectRoutes(config);
    routes.push(...directRoutes);

    // 2. Find liquidity pool routes
    const poolRoutes = this.findPoolRoutes(config);
    routes.push(...poolRoutes);

    // 3. Find multi-hop routes (if enabled)
    if (config.allowMultiHop !== false) {
      const multiHopRoutes = this.findMultiHopRoutes(config);
      routes.push(...multiHopRoutes);
    }

    // 4. Filter by constraints
    const filtered = routes.filter((r) => {
      if (!r.available) return false;
      if (config.maxFee !== undefined && r.totalFee > config.maxFee) return false;
      if (config.maxTimeSeconds !== undefined && r.totalTimeSeconds > config.maxTimeSeconds) return false;
      if (config.minReliabilityScore !== undefined && r.reliabilityScore < config.minReliabilityScore) return false;
      if (config.preferredProtocol && !r.hops.some((h) => h.protocol === config.preferredProtocol)) return false;
      if (r.minAmount > config.amount) return false;
      if (r.maxAmount < config.amount) return false;
      return true;
    });

    // 5. Sort by balanced score
    return this.rankRoutes(filtered, "balanced");
  }

  /**
   * Find the single best route.
   */
  findBestRoute(config: RouteConfig, criteria: RankingCriteria = "balanced"): BridgeRouteOption | null {
    const routes = this.findRoutes(config);
    const ranked = this.rankRoutes(routes, criteria);
    return ranked.length > 0 ? ranked[0] : null;
  }

  /**
   * Add a custom route configuration.
   */
  addCustomRoute(route: BridgeRoute): void {
    this.customRoutes.push(route);
  }

  /**
   * Get all known direct routes from a chain.
   */
  getRoutesFromChain(chain: ChainFamily, chainId: number): { toChain: ChainFamily; toChainId: number; protocol: RouteProtocol }[] {
    return KNOWN_DIRECT_ROUTES
      .filter((r) => r.from === chain && r.fromId === chainId)
      .map((r) => ({
        toChain: r.to,
        toChainId: r.toId,
        protocol: r.protocol,
      }));
  }

  // ---- Internal Route Finding ----

  private findDirectRoutes(config: RouteConfig): BridgeRouteOption[] {
    const matchingRoutes = KNOWN_DIRECT_ROUTES.filter(
      (r) =>
        r.from === config.sourceChain &&
        r.fromId === config.sourceChainId &&
        r.to === config.destChain &&
        r.toId === config.destChainId,
    );

    return matchingRoutes.map((route, idx) => {
      const fee = this.calculateFee(route.feeBps, config.amount);
      return {
        routeId: `direct-${config.sourceChain}-${config.sourceChainId}-${config.destChain}-${config.destChainId}-${idx}`,
        hopCount: 1,
        hops: [
          {
            fromChain: route.from,
            fromChainId: route.fromId,
            toChain: route.to,
            toChainId: route.toId,
            protocol: route.protocol,
            fee,
            timeSeconds: route.timeSeconds,
            availableLiquidity: BigInt(Number.MAX_SAFE_INTEGER), // Direct routes assumed unlimited
          },
        ],
        totalFee: fee,
        totalTimeSeconds: route.timeSeconds,
        effectiveRate: 1,
        minAmount: 0n,
        maxAmount: BigInt(Number.MAX_SAFE_INTEGER),
        reliabilityScore: route.reliability,
        available: true,
        description: `Direct ${route.protocol} bridge from ${this.chainLabel(route.from, route.fromId)} to ${this.chainLabel(route.to, route.toId)}`,
      };
    });
  }

  private findPoolRoutes(config: RouteConfig): BridgeRouteOption[] {
    const pools = this.poolManager.getPoolsForPair(config.sourceChain, config.destChain);
    const routes: BridgeRouteOption[] = [];

    for (const pool of pools) {
      try {
        const quote = this.poolManager.getQuote({
          poolId: pool.poolId,
          direction: "A-to-B",
          inputAmount: config.amount,
        });

        const fee = quote.feeAmount;
        routes.push({
          routeId: `pool-${pool.poolId}`,
          hopCount: 1,
          hops: [
            {
              fromChain: pool.chainA,
              fromChainId: pool.chainAId,
              toChain: pool.chainB,
              toChainId: pool.chainBId,
              protocol: "liquidity_pool",
              fee,
              timeSeconds: 30, // AMM swaps are fast
              availableLiquidity: pool.reserveA,
            },
          ],
          totalFee: fee,
          totalTimeSeconds: 30,
          effectiveRate: quote.effectiveRate,
          minAmount: 0n,
          maxAmount: pool.reserveA,
          reliabilityScore: 85,
          available: pool.status === "active",
          description: `AMM swap via ${pool.tokenA.symbol}/${pool.tokenB.symbol} pool`,
        });
      } catch {
        // Pool can't handle this amount, skip
        continue;
      }
    }

    return routes;
  }

  private findMultiHopRoutes(config: RouteConfig): BridgeRouteOption[] {
    const routes: BridgeRouteOption[] = [];

    for (const hub of INTERMEDIATE_HUBS) {
      // Skip if hub is source or destination
      if (hub.chain === config.sourceChain && hub.chainId === config.sourceChainId) continue;
      if (hub.chain === config.destChain && hub.chainId === config.destChainId) continue;

      // Find source → hub route
      const toHubRoutes = KNOWN_DIRECT_ROUTES.filter(
        (r) =>
          r.from === config.sourceChain &&
          r.fromId === config.sourceChainId &&
          r.to === hub.chain &&
          r.toId === hub.chainId,
      );

      // Find hub → destination route
      const fromHubRoutes = KNOWN_DIRECT_ROUTES.filter(
        (r) =>
          r.from === hub.chain &&
          r.fromId === hub.chainId &&
          r.to === config.destChain &&
          r.toId === config.destChainId,
      );

      for (const route1 of toHubRoutes) {
        for (const route2 of fromHubRoutes) {
          const fee1 = this.calculateFee(route1.feeBps, config.amount);
          const fee2 = this.calculateFee(route2.feeBps, config.amount);
          const totalFee = fee1 + fee2;
          const totalTime = route1.timeSeconds + route2.timeSeconds;
          const reliability = Math.round((route1.reliability * route2.reliability) / 100);

          routes.push({
            routeId: `multihop-${route1.from}-${route1.toId}-${hub.chain}-${hub.chainId}-${route2.toId}`,
            hopCount: 2,
            hops: [
              {
                fromChain: route1.from,
                fromChainId: route1.fromId,
                toChain: route1.to,
                toChainId: route1.toId,
                protocol: route1.protocol,
                fee: fee1,
                timeSeconds: route1.timeSeconds,
                availableLiquidity: BigInt(Number.MAX_SAFE_INTEGER),
              },
              {
                fromChain: route2.from,
                fromChainId: route2.fromId,
                toChain: route2.to,
                toChainId: route2.toId,
                protocol: route2.protocol,
                fee: fee2,
                timeSeconds: route2.timeSeconds,
                availableLiquidity: BigInt(Number.MAX_SAFE_INTEGER),
              },
            ],
            totalFee,
            totalTimeSeconds: totalTime,
            effectiveRate: 1,
            minAmount: 0n,
            maxAmount: BigInt(Number.MAX_SAFE_INTEGER),
            reliabilityScore: reliability,
            available: true,
            description: `Multi-hop via ${hub.label}: ${this.chainLabel(route1.from, route1.fromId)} → ${hub.label} → ${this.chainLabel(route2.to, route2.toId)}`,
          });
        }
      }
    }

    return routes;
  }

  // ---- Ranking ----

  private rankRoutes(routes: BridgeRouteOption[], criteria: RankingCriteria): BridgeRouteOption[] {
    const sorted = [...routes];

    switch (criteria) {
      case "lowest_fee":
        sorted.sort((a, b) => Number(a.totalFee - b.totalFee));
        break;
      case "fastest":
        sorted.sort((a, b) => a.totalTimeSeconds - b.totalTimeSeconds);
        break;
      case "most_reliable":
        sorted.sort((a, b) => b.reliabilityScore - a.reliabilityScore);
        break;
      case "best_liquidity":
        sorted.sort((a, b) => Number(b.maxAmount - a.maxAmount));
        break;
      case "balanced":
        sorted.sort((a, b) => {
          // Composite score: lower is better
          const feeScoreA = Number(a.totalFee) / 1e18; // Normalize to ETH
          const feeScoreB = Number(b.totalFee) / 1e18;
          const timeScoreA = a.totalTimeSeconds / 3600; // Normalize to hours
          const timeScoreB = b.totalTimeSeconds / 3600;
          const reliabilityPenaltyA = (100 - a.reliabilityScore) / 100;
          const reliabilityPenaltyB = (100 - b.reliabilityScore) / 100;

          const scoreA = feeScoreA * 0.4 + timeScoreA * 0.3 + reliabilityPenaltyA * 0.3;
          const scoreB = feeScoreB * 0.4 + timeScoreB * 0.3 + reliabilityPenaltyB * 0.3;
          return scoreA - scoreB;
        });
        break;
    }

    return sorted;
  }

  // ---- Helpers ----

  private calculateFee(feeBps: number, amount: bigint): bigint {
    return (amount * BigInt(feeBps)) / 10000n;
  }

  private chainLabel(chain: ChainFamily, chainId: number): string {
    const labels: Record<string, string> = {
      "1": "Ethereum",
      "42161": "Arbitrum",
      "10": "Optimism",
      "137": "Polygon",
      "8453": "Base",
      "101": "Solana",
      "-1": "TON",
    };
    return labels[chainId.toString()] ?? `${chain}:${chainId}`;
  }
}
