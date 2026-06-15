/**
 * Utility functions for SIWE message generation and parsing.
 */

import { keccak_256 } from '@noble/hashes/keccak';

/**
 * Generate a cryptographically secure random nonce.
 * Default length is 8 bytes (16 hex characters).
 *
 * Works in both Node.js and browser environments.
 *
 * @param byteLength - Number of random bytes (default: 8).
 * @returns Hex-encoded nonce string.
 */
export function generateNonce(byteLength: number = 8): string {
  // Browser: use crypto.getRandomValues
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Node.js: use crypto module
  const nodeCrypto = require('crypto');
  const bytes = nodeCrypto.randomBytes(byteLength);
  return bytes.toString('hex');
}

/**
 * Generate a SIWE-compatible timestamp in ISO 8601 format.
 * Uses the current time by default.
 *
 * @param date - Optional Date object. Defaults to now.
 * @returns ISO 8601 timestamp string (e.g., "2024-01-15T10:30:00.000Z").
 */
export function generateTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Parse an ISO 8601 timestamp string into a Date object.
 *
 * @param timestamp - ISO 8601 timestamp string.
 * @returns Parsed Date object.
 * @throws Error if the timestamp is invalid.
 */
export function parseTimestamp(timestamp: string): Date {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ISO 8601 timestamp: ${timestamp}`);
  }
  return date;
}

/**
 * Validate an Ethereum address format (EIP-55 checksum-aware).
 *
 * @param address - Ethereum address string.
 * @returns True if the address format is valid.
 */
export function isValidEthereumAddress(address: string): boolean {
  if (!address) return false;
  // Must be 0x + 40 hex characters
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return false;
  return true;
}

/**
 * Validate an RFC 3986 URI format.
 *
 * @param uri - URI string to validate.
 * @returns True if the URI format appears valid.
 */
export function isValidUri(uri: string): boolean {
  try {
    const parsed = new URL(uri);
    // Must have a protocol and hostname
    return !!parsed.protocol && !!parsed.hostname;
  } catch {
    return false;
  }
}

/**
 * Normalize an Ethereum address to EIP-55 checksummed form.
 *
 * M-002: Implements EIP-55 mixed-case checksum encoding.
 *
 * @param address - Ethereum address string.
 * @returns EIP-55 checksummed address.
 */
export function normalizeAddress(address: string): string {
  // Remove 0x prefix and lowercase
  const addr = address.toLowerCase().replace('0x', '');

  // Validate format
  if (!/^[0-9a-f]{40}$/.test(addr)) {
    throw new Error(`Invalid Ethereum address format: ${address}`);
  }

  // Compute EIP-55 checksum using keccak256
  const hashBytes = keccak_256(new TextEncoder().encode(addr));
  const hashHex = Array.from(hashBytes, b => b.toString(16).padStart(2, '0')).join('');

  let checksummed = '0x';
  for (let i = 0; i < 40; i++) {
    // If the corresponding character in the hash is >= 8, uppercase it
    if (parseInt(hashHex[i], 16) >= 8) {
      checksummed += addr[i].toUpperCase();
    } else {
      checksummed += addr[i];
    }
  }

  return checksummed;
}

/**
 * Extract the origin from a URI string.
 *
 * @param uri - Full URI string.
 * @returns Origin string (e.g., "https://example.com").
 */
export function getOrigin(uri: string): string {
  const parsed = new URL(uri);
  return parsed.origin;
}
