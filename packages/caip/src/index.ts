/**
 * @cinacoin/caip — CAIP-2 / CAIP-10 / CAIP-19 utilities.
 *
 * Provides types, parsing, formatting, registry helpers, and validation for
 * Chain Agnostic Improvement Proposal identifiers.
 */

// Types
export type { Caip2ChainId, Caip10AccountId, Caip19AssetId } from './types.js';

// Parse & format
export {
  parseCaip2,
  parseCaip10,
  parseCaip19,
  formatCaip2,
  formatCaip10,
} from './parse.js';

// Registry
export {
  chainIdToCaip2,
  caip2ToChainId,
  SUPPORTED_NAMESPACES,
  type SupportedNamespace,
} from './registry.js';

// Validation
export { isValidCaip2, isValidCaip10, isValidCaip19 } from './validation.js';
