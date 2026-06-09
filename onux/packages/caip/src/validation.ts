/**
 * Validate CAIP-2 / CAIP-10 / CAIP-19 strings.
 *
 * Returns `true` / `false` — no exceptions thrown.
 * Uses the same regex patterns as `parse.ts` for consistency.
 */

// ---------------------------------------------------------------------------
// Patterns (same as parse.ts)
// ---------------------------------------------------------------------------

const CAIP2_RE = /^([a-z0-9]{3,8}):([-a-zA-Z0-9]{1,32})$/;

// CAIP-10: namespace:reference:address
const CAIP10_RE = /^([a-z0-9]{3,8}):([-a-zA-Z0-9]{1,32}):(.+)$/;

// CAIP-19: namespace:reference/assetNamespace:assetReference
const CAIP19_RE = /^([a-z0-9]{3,8}):([-a-zA-Z0-9]{1,32})\/([a-z0-9-]+):(.+)$/;

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

/**
 * Check whether a string is a valid CAIP-2 chain identifier.
 *
 * Format: `namespace:reference`
 * - namespace: 3-8 lowercase alphanumeric characters
 * - reference: 1-32 alphanumeric characters (hyphens allowed)
 */
export function isValidCaip2(caip2: string): boolean {
  return CAIP2_RE.test(caip2);
}

/**
 * Check whether a string is a valid CAIP-10 account identifier.
 *
 * Format: `namespace:reference:address`
 */
export function isValidCaip10(caip10: string): boolean {
  return CAIP10_RE.test(caip10);
}

/**
 * Check whether a string is a valid CAIP-19 asset identifier.
 *
 * Format: `namespace:reference/assetNamespace:assetReference`
 */
export function isValidCaip19(caip19: string): boolean {
  return CAIP19_RE.test(caip19);
}
