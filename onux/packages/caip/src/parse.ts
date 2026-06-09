/**
 * Parse and format CAIP-2 / CAIP-10 / CAIP-19 strings.
 *
 * Implements round-trip `parse → toString → parse` for all three CAIP formats.
 */

import type { Caip2ChainId, Caip10AccountId, Caip19AssetId } from './types.js';

// ---------------------------------------------------------------------------
// CAIP-2
// ---------------------------------------------------------------------------

/**
 * Parse a CAIP-2 string (`namespace:reference`) into a {@link Caip2ChainId}.
 *
 * @throws Error if the string does not match the CAIP-2 format.
 */
export function parseCaip2(caip2: string): Caip2ChainId {
  const match = /^([a-z0-9]{3,8}):([-a-zA-Z0-9]{1,32})$/.exec(caip2);
  if (!match) throw new Error(`Invalid CAIP-2 string: "${caip2}"`);

  const namespace = match[1];
  const reference = match[2];

  return {
    namespace,
    reference,
    toString: () => `${namespace}:${reference}`,
  };
}

/**
 * Format a {@link Caip2ChainId} into its canonical string.
 */
export function formatCaip2(chainId: Caip2ChainId): string {
  return `${chainId.namespace}:${chainId.reference}`;
}

// ---------------------------------------------------------------------------
// CAIP-10
// ---------------------------------------------------------------------------

/**
 * Parse a CAIP-10 string (`namespace:reference:address`) into a {@link Caip10AccountId}.
 *
 * @throws Error if the string does not match the CAIP-10 format.
 */
export function parseCaip10(caip10: string): Caip10AccountId {
  // Split into at most 3 parts (address may contain colons in some namespaces).
  const firstColon = caip10.indexOf(':');
  if (firstColon === -1) throw new Error(`Invalid CAIP-10 string: "${caip10}"`);

  const namespace = caip10.slice(0, firstColon);
  const rest = caip10.slice(firstColon + 1);
  const secondColon = rest.indexOf(':');
  if (secondColon === -1) throw new Error(`Invalid CAIP-10 string: "${caip10}"`);

  const reference = rest.slice(0, secondColon);
  const address = rest.slice(secondColon + 1);

  if (!namespace || !reference || !address) {
    throw new Error(`Invalid CAIP-10 string: "${caip10}"`);
  }

  const chainId: Caip2ChainId = {
    namespace,
    reference,
    toString: () => `${namespace}:${reference}`,
  };

  return {
    chainId,
    address,
    toString: () => `${namespace}:${reference}:${address}`,
  };
}

/**
 * Format a {@link Caip10AccountId} into its canonical string.
 */
export function formatCaip10(accountId: Caip10AccountId): string {
  return `${accountId.chainId.namespace}:${accountId.chainId.reference}:${accountId.address}`;
}

// ---------------------------------------------------------------------------
// CAIP-19
// ---------------------------------------------------------------------------

/**
 * Parse a CAIP-19 string (`namespace:reference/assetNamespace:assetReference`)
 * into a {@link Caip19AssetId}.
 *
 * @throws Error if the string does not match the CAIP-19 format.
 */
export function parseCaip19(caip19: string): Caip19AssetId {
  const slashIndex = caip19.indexOf('/');
  if (slashIndex === -1) throw new Error(`Invalid CAIP-19 string: "${caip19}"`);

  const chainPart = caip19.slice(0, slashIndex);
  const assetPart = caip19.slice(slashIndex + 1);

  const chainId = parseCaip2(chainPart);

  const assetColon = assetPart.indexOf(':');
  if (assetColon === -1) throw new Error(`Invalid CAIP-19 string: "${caip19}"`);

  const assetNamespace = assetPart.slice(0, assetColon);
  const assetReference = assetPart.slice(assetColon + 1);

  if (!assetNamespace || !assetReference) {
    throw new Error(`Invalid CAIP-19 string: "${caip19}"`);
  }

  return {
    chainId,
    assetNamespace,
    assetReference,
    toString: () => `${chainId.namespace}:${chainId.reference}/${assetNamespace}:${assetReference}`,
  };
}
