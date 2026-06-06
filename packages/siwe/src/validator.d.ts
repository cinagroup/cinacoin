/**
 * SIWE message validation per EIP-4361 specification.
 *
 * Validates RFC 4566 URI format, domain matching, expiration checks,
 * and structural integrity of SIWE messages.
 */
import type { SIWEParams, ParsedSIWE, SIWEValidationError } from './types.js';
/**
 * Validate SIWE parameters before message generation.
 *
 * @param params - SIWE parameters to validate.
 * @returns Array of validation errors. Empty array means valid.
 */
export declare function validateSIWEParams(params: SIWEParams): SIWEValidationError[];
/**
 * Validate a parsed SIWE message against temporal constraints.
 *
 * Checks:
 * - Expiration time has not passed
 * - Not-before time has been reached
 *
 * @param data - Parsed SIWE message data.
 * @param now - Optional reference time. Defaults to current time.
 * @returns Array of validation errors. Empty means temporally valid.
 */
export declare function validateTemporalConstraints(data: ParsedSIWE, now?: Date): SIWEValidationError[];
/**
 * Validate that the request domain matches the SIWE message domain.
 *
 * @param requestDomain - The domain making the request (e.g., window.location.origin).
 * @param messageDomain - The domain embedded in the SIWE message.
 * @returns True if domains match.
 */
export declare function validateDomainMatch(requestDomain: string, messageDomain: string): boolean;
/**
 * Full validation pipeline for SIWE verification.
 *
 * @param data - Parsed SIWE message data.
 * @param signature - The signature to validate (hex string).
 * @param requestDomain - Optional requesting domain for domain matching.
 * @returns Combined validation errors.
 */
export declare function fullValidation(data: ParsedSIWE, signature: string, requestDomain?: string): SIWEValidationError[];
//# sourceMappingURL=validator.d.ts.map