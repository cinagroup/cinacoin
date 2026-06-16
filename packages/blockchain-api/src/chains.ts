/**
 * Chain registry and viem client builder.
 *
 * Provides a minimal chain registry for quick lookup and a factory
 * function to create viem PublicClient instances.
 * Extracted from client.ts to reduce file size and improve modularity.
 */

import {
  createPublicClient,
  http,
  type PublicClient,
} from "viem";
import {
  mainnet,
  polygon,
  bsc,
  arbitrum,
  optimism,
  base,
  avalanche,
  type Chain,
} from "viem/chains";

// ---------------------------------------------------------------------------
// Chain registry
// ---------------------------------------------------------------------------

/** Minimal chain registry for quick lookup. Extend as needed. */
export const chainsByChainId: Record<number, Chain> = {
  1: mainnet,
  137: polygon,
  56: bsc,
  42161: arbitrum,
  10: optimism,
  8453: base,
  43114: avalanche,
};

// ---------------------------------------------------------------------------
// Client factory
// ---------------------------------------------------------------------------

/**
 * Build a viem PublicClient for a given chain id.
 *
 * @param chainId - The EVM chain ID
 * @param rpcUrl - Optional custom RPC URL (overrides default)
 * @returns A configured viem PublicClient instance
 */
export function buildClient(chainId: number, rpcUrl?: string): PublicClient {
  const chain = Object.values(chainsByChainId).find(
    (c) => c.id === chainId
  ) as Chain | undefined;

  return createPublicClient({
    chain: chain ?? ({ id: chainId, name: `Chain ${chainId}` } as Chain),
    transport: http(rpcUrl),
  });
}
