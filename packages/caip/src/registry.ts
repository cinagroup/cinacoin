/**
 * Map numeric EIP-155 chain IDs to CAIP-2 strings and back.
 *
 * This module provides a registry for converting between integer chain IDs
 * (the format used by JSON-RPC `eth_chainId`) and CAIP-2 identifiers.
 *
 * For non-EIP-155 namespaces the caller supplies the namespace explicitly.
 */

import type { Caip2ChainId } from './types.js';
import { parseCaip2 } from './parse.js';

// ---------------------------------------------------------------------------
// Supported namespaces
// ---------------------------------------------------------------------------

/**
 * All CAIP-2 namespaces currently supported by Cinacoin.
 */
export const SUPPORTED_NAMESPACES = [
  'eip155',
  'solana',
  'bip122',
  'cosmos',
  'polkadot',
  'tron',
  'hedera',
  'near',
  'stacks',
  'tezos',
] as const;

export type SupportedNamespace = (typeof SUPPORTED_NAMESPACES)[number];

// ---------------------------------------------------------------------------
// chainId ↔ CAIP-2 conversion
// ---------------------------------------------------------------------------

/**
 * Convert a numeric chain ID to a {@link Caip2ChainId}.
 *
 * By default the namespace is `'eip155'`. Pass a different namespace for
 * non-EVM chains (note: non-EVM chains may not use numeric IDs the same way).
 *
 * @param chainId   - Numeric chain ID.
 * @param namespace - CAIP-2 namespace (default `'eip155'`).
 */
export function chainIdToCaip2(
  chainId: number,
  namespace: string = 'eip155',
): Caip2ChainId {
  const reference = String(chainId);
  return {
    namespace,
    reference,
    toString: () => `${namespace}:${reference}`,
  };
}

/**
 * Parse a CAIP-2 string and, if the namespace is `eip155`, return the numeric
 * chain ID.
 *
 * @returns Object with `namespace` and `chainId` (as a number for eip155,
 *          or `NaN` for non-numeric references).
 */
export function caip2ToChainId(caip2: string): { namespace: string; chainId: number } {
  const parsed = parseCaip2(caip2);
  return {
    namespace: parsed.namespace,
    chainId: parseInt(parsed.reference, 10),
  };
}
