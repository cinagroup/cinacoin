/**
 * Bridge Routes — Supported cross-chain bridge pairs
 *
 * P0 Routes:
 *   ETH ↔ Arbitrum (L2)
 *   ETH ↔ Optimism (L2)
 *   ETH ↔ Polygon (sidechain)
 *   ETH ↔ Base (L2)
 *
 * Each route is bidirectional and defines:
 *   - Chain IDs, names
 *   - Estimated bridge time
 *   - Fee percentage
 *   - Min/max amounts
 *   - Protocol used
 */

import type { BridgeRoute } from "./types.js";

// ============================================================
// Chain Constants
// ============================================================

export const CHAIN_IDS = {
  ETHEREUM: 1,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  POLYGON: 137,
  BASE: 8453,
} as const;

export const CHAIN_NAMES: Record<number, string> = {
  [CHAIN_IDS.ETHEREUM]: "eth",
  [CHAIN_IDS.ARBITRUM]: "arbitrum",
  [CHAIN_IDS.OPTIMISM]: "optimism",
  [CHAIN_IDS.POLYGON]: "polygon",
  [CHAIN_IDS.BASE]: "base",
};

// ============================================================
// Bridge Route Definitions
// ============================================================

/** Native token amounts for min/max in wei */
const MIN_BRIDGE_NATIVE = 100000n; // 0.0001 ETH minimum
const MAX_BRIDGE_NATIVE = 100000000000000000000n; // 100 ETH maximum

export const BRIDGE_ROUTES: BridgeRoute[] = [
  // ─── ETH → Arbitrum ───
  {
    id: "eth-arb",
    fromChain: "eth",
    fromChainId: CHAIN_IDS.ETHEREUM,
    toChain: "arbitrum",
    toChainId: CHAIN_IDS.ARBITRUM,
    estimatedTimeSeconds: 900, // ~15 min (L1 → L2 via message relay)
    feePercent: 0.05, // 0.05%
    minAmount: MIN_BRIDGE_NATIVE,
    maxAmount: MAX_BRIDGE_NATIVE,
    active: true,
    protocol: "relay-server",
  },
  {
    id: "arb-eth",
    fromChain: "arbitrum",
    fromChainId: CHAIN_IDS.ARBITRUM,
    toChain: "eth",
    toChainId: CHAIN_IDS.ETHEREUM,
    estimatedTimeSeconds: 604800, // ~7 days (L2 → L1 challenge period)
    feePercent: 0.05,
    minAmount: MIN_BRIDGE_NATIVE,
    maxAmount: MAX_BRIDGE_NATIVE,
    active: true,
    protocol: "relay-server",
  },

  // ─── ETH → Optimism ───
  {
    id: "eth-op",
    fromChain: "eth",
    fromChainId: CHAIN_IDS.ETHEREUM,
    toChain: "optimism",
    toChainId: CHAIN_IDS.OPTIMISM,
    estimatedTimeSeconds: 900, // ~15 min
    feePercent: 0.05,
    minAmount: MIN_BRIDGE_NATIVE,
    maxAmount: MAX_BRIDGE_NATIVE,
    active: true,
    protocol: "relay-server",
  },
  {
    id: "op-eth",
    fromChain: "optimism",
    fromChainId: CHAIN_IDS.OPTIMISM,
    toChain: "eth",
    toChainId: CHAIN_IDS.ETHEREUM,
    estimatedTimeSeconds: 604800, // ~7 days (L2 → L1 challenge period)
    feePercent: 0.05,
    minAmount: MIN_BRIDGE_NATIVE,
    maxAmount: MAX_BRIDGE_NATIVE,
    active: true,
    protocol: "relay-server",
  },

  // ─── ETH → Polygon ───
  {
    id: "eth-poly",
    fromChain: "eth",
    fromChainId: CHAIN_IDS.ETHEREUM,
    toChain: "polygon",
    toChainId: CHAIN_IDS.POLYGON,
    estimatedTimeSeconds: 1800, // ~30 min (PoS bridge)
    feePercent: 0.1, // 0.1% (sidechain, higher fees)
    minAmount: MIN_BRIDGE_NATIVE,
    maxAmount: MAX_BRIDGE_NATIVE,
    active: true,
    protocol: "relay-server",
  },
  {
    id: "poly-eth",
    fromChain: "polygon",
    fromChainId: CHAIN_IDS.POLYGON,
    toChain: "eth",
    toChainId: CHAIN_IDS.ETHEREUM,
    estimatedTimeSeconds: 1800, // ~30 min (PoS checkpoint)
    feePercent: 0.1,
    minAmount: MIN_BRIDGE_NATIVE,
    maxAmount: MAX_BRIDGE_NATIVE,
    active: true,
    protocol: "relay-server",
  },

  // ─── ETH → Base ───
  {
    id: "eth-base",
    fromChain: "eth",
    fromChainId: CHAIN_IDS.ETHEREUM,
    toChain: "base",
    toChainId: CHAIN_IDS.BASE,
    estimatedTimeSeconds: 900, // ~15 min
    feePercent: 0.05,
    minAmount: MIN_BRIDGE_NATIVE,
    maxAmount: MAX_BRIDGE_NATIVE,
    active: true,
    protocol: "relay-server",
  },
  {
    id: "base-eth",
    fromChain: "base",
    fromChainId: CHAIN_IDS.BASE,
    toChain: "eth",
    toChainId: CHAIN_IDS.ETHEREUM,
    estimatedTimeSeconds: 604800, // ~7 days (L2 → L1 challenge period)
    feePercent: 0.05,
    minAmount: MIN_BRIDGE_NATIVE,
    maxAmount: MAX_BRIDGE_NATIVE,
    active: true,
    protocol: "relay-server",
  },
];

// ============================================================
// Route Lookup Functions
// ============================================================

/**
 * Get a route by from/to chain names.
 */
export function getRoute(
  fromChain: string,
  toChain: string,
): BridgeRoute | undefined {
  return BRIDGE_ROUTES.find(
    (r) =>
      r.fromChain.toLowerCase() === fromChain.toLowerCase() &&
      r.toChain.toLowerCase() === toChain.toLowerCase(),
  );
}

/**
 * Get a route by from/to chain IDs.
 */
export function getRouteById(
  fromChainId: number,
  toChainId: number,
): BridgeRoute | undefined {
  return BRIDGE_ROUTES.find(
    (r) => r.fromChainId === fromChainId && r.toChainId === toChainId,
  );
}

/**
 * Get a route by its ID string.
 */
export function getRouteByIdString(id: string): BridgeRoute | undefined {
  return BRIDGE_ROUTES.find((r) => r.id === id);
}

/**
 * Check if a chain pair is supported.
 */
export function isSupportedPair(
  fromChain: string,
  toChain: string,
): boolean {
  return getRoute(fromChain, toChain) !== undefined;
}

/**
 * Get all routes from a specific chain.
 */
export function getRoutesFromChain(chain: string): BridgeRoute[] {
  return BRIDGE_ROUTES.filter(
    (r) => r.fromChain.toLowerCase() === chain.toLowerCase() && r.active,
  );
}

/**
 * Get all routes to a specific chain.
 */
export function getRoutesToChain(chain: string): BridgeRoute[] {
  return BRIDGE_ROUTES.filter(
    (r) => r.toChain.toLowerCase() === chain.toLowerCase() && r.active,
  );
}

/**
 * Get all active routes.
 */
export function getActiveRoutes(): BridgeRoute[] {
  return BRIDGE_ROUTES.filter((r) => r.active);
}
