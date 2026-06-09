/**
 * CAIP-2 / CAIP-10 / CAIP-19 type definitions.
 *
 * These types model cross-chain identifiers following the Chain Agnostic
 * Improvement Proposal standards:
 *
 * - CAIP-2  — Chain identifiers  (e.g. `eip155:1`)
 * - CAIP-10 — Account identifiers (e.g. `eip155:1:0xabc...`)
 * - CAIP-19 — Asset identifiers   (e.g. `eip155:1/erc20:0xabc...`)
 *
 * @see https://chainagnostic.org/
 */

// ---------------------------------------------------------------------------
// CAIP-2 — Chain Identifier
// ---------------------------------------------------------------------------

/**
 * A CAIP-2 chain identifier object.
 *
 * @example
 * ```ts
 * const ethMain: Caip2ChainId = {
 *   namespace: 'eip155',
 *   reference: '1',
 *   toString: () => 'eip155:1',
 * };
 * ```
 */
export interface Caip2ChainId {
  /**
   * The chain namespace (e.g. `"eip155"`, `"solana"`, `"bip122"`).
   */
  namespace: string;

  /**
   * The chain-specific reference within the namespace
   * (e.g. `"1"` for Ethereum mainnet, `"5eykt4UsFv8P..."` for Solana).
   */
  reference: string;

  /**
   * Serialises to the canonical CAIP-2 string (`namespace:reference`).
   */
  toString(): string; // e.g. "eip155:1"
}

// ---------------------------------------------------------------------------
// CAIP-10 — Account Identifier
// ---------------------------------------------------------------------------

/**
 * A CAIP-10 account identifier object.
 *
 * @example
 * ```ts
 * const account: Caip10AccountId = {
 *   chainId:   { namespace: 'eip155', reference: '1', toString: () => 'eip155:1' },
 *   address:   '0xabc123...',
 *   toString:  () => 'eip155:1:0xabc123...',
 * };
 * ```
 */
export interface Caip10AccountId {
  /** The chain this account belongs to. */
  chainId: Caip2ChainId;

  /** The account address on the chain (format is namespace-specific). */
  address: string;

  /**
   * Serialises to the canonical CAIP-10 string
   * (`namespace:reference:address`).
   */
  toString(): string; // e.g. "eip155:1:0xabc..."
}

// ---------------------------------------------------------------------------
// CAIP-19 — Asset Identifier
// ---------------------------------------------------------------------------

/**
 * A CAIP-19 asset identifier object.
 *
 * @example
 * ```ts
 * const usdc: Caip19AssetId = {
 *   chainId:        { namespace: 'eip155', reference: '1', toString: () => 'eip155:1' },
 *   assetNamespace: 'erc20',
 *   assetReference: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
 *   toString:       () => 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
 * };
 * ```
 */
export interface Caip19AssetId {
  /** The chain this asset belongs to. */
  chainId: Caip2ChainId;

  /**
   * The asset namespace within the chain
   * (e.g. `"erc20"`, `"erc721"`, `"slip44"`, `"native"`).
   */
  assetNamespace: string;

  /**
   * The asset-specific reference (contract address, slip44 coin type, etc.).
   */
  assetReference: string;

  /**
   * Serialises to the canonical CAIP-19 string
   * (`namespace:reference/assetNamespace:assetReference`).
   */
  toString(): string; // e.g. "eip155:1/erc20:0xabc..."
}
