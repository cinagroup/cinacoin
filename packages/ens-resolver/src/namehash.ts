/**
 * ENS Namehash Implementation
 *
 * Implements the complete ENS namehash algorithm as specified in EIP-137:
 *   namehash('') = 0x0000000000000000000000000000000000000000000000000000000000000000
 *   namehash('foo.eth') = keccak256(namehash('eth') || keccak256('foo'))
 *
 * Uses @noble/hashes for the keccak256 implementation — fixes the
 * simpleKeccak returning 0x00...00 problem.
 */

import { keccak_256 } from '@noble/hashes/sha3.js';

const EMPTY_HASH = '0'.repeat(64);

/**
 * Compute keccak256 hash.
 *
 * @param input - Input bytes
 * @returns Hex string with "0x" prefix
 */
export function keccak256(input: Uint8Array | string): string {
  const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  return '0x' + bytesToHex(keccak_256(data));
}

/**
 * Compute the ENS namehash of a domain name.
 *
 * Algorithm (EIP-137):
 *   namehash('') = 0x00...00
 *   namehash(FQDN) = keccak256(namehash(parent) || keccak256(label))
 *
 * @param name - ENS domain name (e.g. "vitalik.eth")
 * @returns 32-byte namehash as hex string with "0x" prefix
 */
export function namehash(name: string): `0x${string}` {
  // Normalize: lowercase and handle trailing dots
  let normalized = name.toLowerCase().replace(/\.$/, '');

  if (normalized === '') {
    return `0x${EMPTY_HASH}`;
  }

  const labels = normalized.split('.');
  let node = EMPTY_HASH;

  // Process labels from right (TLD) to left
  for (let i = labels.length - 1; i >= 0; i--) {
    const labelBytes = new TextEncoder().encode(labels[i]);
    const labelHash = keccak256(labelBytes).slice(2); // Remove "0x" prefix
    // Concatenate node bytes + label hash bytes, then keccak256 the result
    const combined = hexToBytes(node + labelHash);
    node = keccak256(combined).slice(2);
  }

  return `0x${node}`;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
