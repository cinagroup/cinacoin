/**
 * Utility functions for SIWE message generation and parsing.
 */
/**
 * Generate a cryptographically secure random nonce.
 * Default length is 8 bytes (16 hex characters).
 *
 * @param byteLength - Number of random bytes (default: 8).
 * @returns Hex-encoded nonce string.
 */
export declare function generateNonce(byteLength?: number): string;
/**
 * Generate a SIWE-compatible timestamp in ISO 8601 format.
 * Uses the current time by default.
 *
 * @param date - Optional Date object. Defaults to now.
 * @returns ISO 8601 timestamp string (e.g., "2024-01-15T10:30:00.000Z").
 */
export declare function generateTimestamp(date?: Date): string;
/**
 * Parse an ISO 8601 timestamp string into a Date object.
 *
 * @param timestamp - ISO 8601 timestamp string.
 * @returns Parsed Date object.
 * @throws Error if the timestamp is invalid.
 */
export declare function parseTimestamp(timestamp: string): Date;
/**
 * Validate an Ethereum address format (EIP-55 checksum-aware).
 *
 * @param address - Ethereum address string.
 * @returns True if the address format is valid.
 */
export declare function isValidEthereumAddress(address: string): boolean;
/**
 * Validate an RFC 3986 URI format.
 *
 * @param uri - URI string to validate.
 * @returns True if the URI format appears valid.
 */
export declare function isValidUri(uri: string): boolean;
/**
 * Normalize an Ethereum address to lowercase checksummed form.
 *
 * @param address - Ethereum address string.
 * @returns Normalized address.
 */
export declare function normalizeAddress(address: string): string;
/**
 * Extract the origin from a URI string.
 *
 * @param uri - Full URI string.
 * @returns Origin string (e.g., "https://example.com").
 */
export declare function getOrigin(uri: string): string;
//# sourceMappingURL=utils.d.ts.map