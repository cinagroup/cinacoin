/**
 * Signature Verification & Nonce Management for WalletConnect v2.
 *
 * Provides:
 * - EIP-191 personal signature verification (personal_sign)
 * - EIP-712 typed data signature verification (eth_signTypedData_v4)
 * - ECDSA secp256k1 recovery
 * - Nonce generation, tracking, and replay attack protection
 * - HMAC-based message authentication
 * - SIWE (Sign-In With Ethereum) signature verification
 *
 * All verification functions recover the signing address from a
 * signature and compare it against the expected address.
 *
 * @packageDocumentation
 */

import { keccak_256 } from '@noble/hashes/sha3.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { hmac } from '@noble/hashes/hmac.js';
import { hexToBytes, bytesToHex } from './crypto.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';

// ============================================================
// Types
// ============================================================

/** EIP-712 typed data domain. */
export interface TypedDataDomain {
  name?: string;
  version?: string;
  chainId?: number | string;
  verifyingContract?: string;
  salt?: string;
}

/** EIP-712 type field definition. */
export interface TypedDataField {
  name: string;
  type: string;
}

/** EIP-712 typed data. */
export interface TypedData {
  types: Record<string, TypedDataField[]>;
  domain: TypedDataDomain;
  primaryType: string;
  message: Record<string, unknown>;
}

/** Nonce entry for replay protection. */
export interface NonceEntry {
  nonce: string;
  createdAt: number;
  used: boolean;
  usedAt?: number;
  address?: string;
  purpose?: string;
}

/** Verification result. */
export interface VerificationResult {
  /** Whether the signature is valid. */
  valid: boolean;
  /** The recovered signing address. */
  recoveredAddress: string;
  /** The expected address. */
  expectedAddress: string;
  /** Error message if invalid. */
  error?: string;
}

// ============================================================
// Constants
// ============================================================

const DOMAIN_TYPE = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
  { name: 'salt', type: 'bytes32' },
];

const MAX_NONCE_AGE_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================
// ECDSA Signature Recovery
// ============================================================

/**
 * Recover the Ethereum address from an EIP-191 personal signature.
 *
 * The signature can be in 65-byte format (r || s || v) with v in
 * [27, 28] or [0, 3] range. Handles the EIP-155 v offset.
 *
 * @param message - The original message that was signed.
 * @param signature - Hex-encoded signature (with or without 0x prefix).
 * @returns The recovered Ethereum address (lowercase, with 0x prefix).
 */
export function recoverPersonalSignature(
  message: string,
  signature: string,
): string {
  const msgHash = hashPersonalMessage(message);
  const { r, s, v } = parseSignature(signature);

  // Use secp256k1 to recover the public key
  const publicKey = recoverPublicKey(msgHash, r, s, v);
  return publicKeyToAddress(publicKey);
}

/**
 * Hash a message according to EIP-191 (personal_sign).
 *
 * Format: keccak256("\x19Ethereum Signed Message:\n" + length + message)
 */
function hashPersonalMessage(message: string): Uint8Array {
  const messageBytes = message.startsWith('0x')
    ? hexToBytes(message.slice(2))
    : new TextEncoder().encode(message);

  const prefix = `\x19Ethereum Signed Message:\n${messageBytes.length}`;
  const prefixBytes = new TextEncoder().encode(prefix);

  const combined = new Uint8Array(prefixBytes.length + messageBytes.length);
  combined.set(prefixBytes);
  combined.set(messageBytes, prefixBytes.length);

  return keccak_256(combined);
}

/**
 * Parse a hex-encoded signature into r, s, v components.
 */
function parseSignature(signature: string): { r: bigint; s: bigint; v: number } {
  const clean = signature.startsWith('0x') ? signature.slice(2) : signature;

  if (clean.length !== 130) {
    throw new Error(`Invalid signature length: expected 130 hex chars, got ${clean.length}`);
  }

  const r = BigInt('0x' + clean.slice(0, 64));
  const s = BigInt('0x' + clean.slice(64, 128));
  let v = parseInt(clean.slice(128, 130), 16);

  // Normalize v to [0, 3] range
  if (v >= 27) {
    v -= 27;
  }

  return { r, s, v };
}

/**
 * Recover the public key from an ECDSA signature.
 *
 * Uses the secp256k1 curve to recover the uncompressed public key
 * from the message hash and signature components.
 */
function recoverPublicKey(
  hash: Uint8Array,
  r: bigint,
  s: bigint,
  v: number,
): Uint8Array {
  const sig = new secp256k1.Signature(r, s, v);
  return sig.recoverPublicKey(hash).toBytes(false);
}

/**
 * Convert a number to a hex string padded to the specified byte length.
 */
function bytesToHexPadded(value: bigint, byteLength: number): string {
  let hex = value.toString(16);
  while (hex.length < byteLength * 2) {
    hex = '0' + hex;
  }
  return hex;
}

/**
 * Convert a raw public key (33-byte compressed or 65-byte uncompressed)
 * to an Ethereum address.
 */
function publicKeyToAddress(publicKey: Uint8Array): string {
  let pubKeyBytes: Uint8Array;

  if (publicKey.length === 65) {
    // Uncompressed: 0x04 || x || y
    pubKeyBytes = publicKey.slice(1);
  } else if (publicKey.length === 33) {
    // Compressed: decompress
    // Decompress the point and get uncompressed form
    const hexKey = bytesToHex(publicKey);
    pubKeyBytes = (secp256k1 as unknown).Point.fromHex(hexKey).toBytes(false).slice(1);
  } else {
    throw new Error(`Invalid public key length: ${publicKey.length}`);
  }

  const hash = keccak_256(pubKeyBytes);
  const addressBytes = hash.slice(-20);
  return '0x' + Array.from(addressBytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// EIP-191 Signature Verification
// ============================================================

/**
 * Verify an EIP-191 personal signature.
 *
 * Recovers the signing address from the signature and compares
 * it against the expected address (case-insensitive).
 *
 * @param message - The original message.
 * @param signature - Hex-encoded signature.
 * @param expectedAddress - The expected signer address.
 * @returns Verification result.
 */
export function verifyPersonalSignature(
  message: string,
  signature: string,
  expectedAddress: string,
): VerificationResult {
  try {
    const recoveredAddress = recoverPersonalSignature(message, signature);
    const valid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();

    return {
      valid,
      recoveredAddress,
      expectedAddress,
      error: valid ? undefined : `Address mismatch: recovered ${recoveredAddress}, expected ${expectedAddress}`,
    };
  } catch (err) {
    return {
      valid: false,
      recoveredAddress: '',
      expectedAddress,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ============================================================
// EIP-712 Typed Data Verification
// ============================================================

/**
 * Verify an EIP-712 typed data signature.
 *
 * Recovers the signing address from the signature of the typed data
 * hash and compares it against the expected address.
 *
 * @param typedData - The EIP-712 typed data object.
 * @param signature - Hex-encoded signature.
 * @param expectedAddress - The expected signer address.
 * @returns Verification result.
 */
export function verifyTypedDataSignature(
  typedData: TypedData,
  signature: string,
  expectedAddress: string,
): VerificationResult {
  try {
    const typeHash = hashTypedData(typedData);
    const recoveredAddress = recoverSignature(typeHash, signature);
    const valid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();

    return {
      valid,
      recoveredAddress,
      expectedAddress,
      error: valid ? undefined : `Address mismatch: recovered ${recoveredAddress}, expected ${expectedAddress}`,
    };
  } catch (err) {
    return {
      valid: false,
      recoveredAddress: '',
      expectedAddress,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Recover an address from a raw 32-byte hash and signature.
 */
function recoverSignature(hash: Uint8Array, signature: string): string {
  const { r, s, v } = parseSignature(signature);
  const publicKey = recoverPublicKey(hash, r, s, v);
  return publicKeyToAddress(publicKey);
}

/**
 * Hash typed data according to EIP-712.
 *
 * Computes: keccak256(
 *   "\x19\x01" || domainSeparator || hashStruct(message)
 * )
 */
function hashTypedData(typedData: TypedData): Uint8Array {
  const domainSeparator = hashDomain(typedData.domain, typedData.types.domain || []);
  const messageHash = hashStruct(
    typedData.primaryType,
    typedData.message,
    typedData.types,
  );

  const prefix = new Uint8Array([0x19, 0x01]);
  const combined = new Uint8Array(
    prefix.length + domainSeparator.length + messageHash.length,
  );
  combined.set(prefix);
  combined.set(domainSeparator, prefix.length);
  combined.set(messageHash, prefix.length + domainSeparator.length);

  return keccak_256(combined);
}

/**
 * Hash the EIP-712 domain separator.
 */
function hashDomain(domain: TypedDataDomain, domainTypes: TypedDataField[]): Uint8Array {
  const typeHash = hashType('EIP712Domain', domainTypes);

  // Build the data hash
  const dataParts: Uint8Array[] = [typeHash];

  for (const field of domainTypes) {
    const value = (domain as Record<string, unknown>)[field.name];
    dataParts.push(encodeValue(field.type, value as never));
  }

  const combined = concatenateUint8Arrays(dataParts);
  return keccak_256(combined);
}

/**
 * Hash a struct type according to EIP-712.
 */
function hashStruct(
  typeName: string,
  data: Record<string, unknown>,
  types: Record<string, TypedDataField[]>,
): Uint8Array {
  const typeHash = hashType(typeName, types[typeName] || []);

  const dataParts: Uint8Array[] = [typeHash];

  for (const field of types[typeName] || []) {
    const value = data[field.name];
    dataParts.push(encodeValue(field.type, value as never));
  }

  const combined = concatenateUint8Arrays(dataParts);
  return keccak_256(combined);
}

/**
 * Hash a type string: keccak256("TypeName(field1Type field1Name,...)")
 */
function hashType(typeName: string, fields: TypedDataField[]): Uint8Array {
  let typeString = typeName + '(';
  typeString += fields.map((f) => `${f.type} ${f.name}`).join(',');
  typeString += ')';

  return keccak_256(new TextEncoder().encode(typeString));
}

/**
 * Encode a value according to its EIP-712 type.
 */
function encodeValue(type: string, value: unknown): Uint8Array {
  if (type === 'string') {
    // Strings and bytes are encoded as keccak256 of the value
    const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value as Uint8Array;
    return keccak_256(bytes);
  }

  if (type === 'bytes') {
    const bytes = typeof value === 'string' ? hexToBytes(value.startsWith('0x') ? value.slice(2) : value) : value as Uint8Array;
    return keccak_256(bytes);
  }

  if (type.startsWith('bytes')) {
    const fixedLength = parseInt(type.slice(5));
    const bytes = typeof value === 'string' ? hexToBytes(value.startsWith('0x') ? value.slice(2) : value) : value as Uint8Array;
    const padded = new Uint8Array(fixedLength);
    padded.set(bytes);
    return padded;
  }

  if (type === 'address') {
    const addr = (value as string).startsWith('0x') ? value as string : '0x' + value;
    return hexToBytes(addr.slice(2).padStart(64, '0'));
  }

  if (type === 'bool') {
    const boolValue = value ? 1 : 0;
    return new Uint8Array(32).fill(0).map((_, i) => i === 31 ? boolValue : 0);
  }

  if (type.startsWith('uint') || type.startsWith('int')) {
    // Encode as 32-byte big-endian
    const numValue = BigInt(value as string | number);
    const bytes = new Uint8Array(32);
    let n = numValue < 0n ? numValue + (1n << 256n) : numValue;
    for (let i = 31; i >= 0; i--) {
      bytes[i] = Number(n & 0xffn);
      n >>= 8n;
    }
    return bytes;
  }

  // Check if it's an array type (e.g., 'uint256[]', 'address[]')
  if (type.endsWith('[]')) {
    const baseType = type.slice(0, -2);
    if (Array.isArray(value)) {
      // Array values are encoded as keccak256 of concatenated encodings
      const encodedItems = value.map((item) => encodeValue(baseType, item));
      return keccak_256(concatenateUint8Arrays(encodedItems));
    }
    return encodeValue('bytes32', value);
  }

  // Check if it's a fixed-size array (e.g., 'uint256[3]')
  const fixedArrayMatch = type.match(/^(.+)\[(\d+)]$/);
  if (fixedArrayMatch) {
    const baseType = fixedArrayMatch[1];
    if (Array.isArray(value)) {
      const encodedItems = value.map((item) => encodeValue(baseType, item));
      return keccak_256(concatenateUint8Arrays(encodedItems));
    }
    return encodeValue('bytes32', value);
  }

  // Check if it's a custom struct type — encode as keccak256 of the struct hash
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return keccak_256(hashStruct(type, value as Record<string, unknown>, {}));
  }

  // Default: treat as bytes32
  return encodeValue('bytes32', value);
}

/**
 * Concatenate multiple Uint8Arrays.
 */
function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// ============================================================
// SIWE Signature Verification
// ============================================================

/**
 * Verify a Sign-In With Ethereum (EIP-4361) signature.
 *
 * Parses the SIWE message, extracts the expected address, and
 * verifies the signature matches.
 *
 * @param message - The SIWE message string.
 * @param signature - Hex-encoded signature.
 * @returns Verification result.
 */
export function verifySiweSignature(
  message: string,
  signature: string,
): VerificationResult {
  try {
    // Extract the address from the first line of the SIWE message
    // Format: "<domain> wants you to sign in with your Ethereum account:\n<address>\n..."
    const lines = message.split('\n');
    const addressLine = lines[2]; // Third line is the address
    if (!addressLine || !addressLine.startsWith('0x')) {
      return {
        valid: false,
        recoveredAddress: '',
        expectedAddress: '',
        error: 'Invalid SIWE message format: missing address',
      };
    }

    const expectedAddress = addressLine.trim();
    return verifyPersonalSignature(message, signature, expectedAddress);
  } catch (err) {
    return {
      valid: false,
      recoveredAddress: '',
      expectedAddress: '',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Parse a SIWE message into its structured components.
 *
 * Returns a parsed object with all SIWE fields extracted.
 * Throws if the message format is invalid.
 *
 * @param message - The SIWE message string.
 * @returns Parsed SIWE components.
 */
export function parseSiweMessage(
  message: string,
): {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
} {
  const lines = message.split('\n');
  if (lines.length < 10) {
    throw new Error('Invalid SIWE message: too few lines');
  }

  // Line 0: "<domain> wants you to sign in with your Ethereum account:"
  const domainMatch = lines[0].match(/^(.+) wants you to sign in with your Ethereum account:$/);
  if (!domainMatch) {
    throw new Error('Invalid SIWE message: missing domain line');
  }
  const domain = domainMatch[1];

  // Line 1: "0x..." (address)
  const address = lines[1].trim();
  if (!address.startsWith('0x')) {
    throw new Error('Invalid SIWE message: invalid address');
  }

  // Line 2: blank separator or statement
  let statement: string | undefined;
  let dataStartIndex = 2;
  if (lines[2].trim() !== '') {
    // The spec says line 2 should be blank, but some implementations put the statement here
    statement = lines[2].trim();
    dataStartIndex = 3;
  }

  // Parse key-value fields from line 3 onwards
  const fields: Record<string, string> = {};
  let resourcesStartIndex = -1;

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('- ')) {
      // Resource line
      if (resourcesStartIndex === -1) {
        resourcesStartIndex = i;
      }
      continue;
    }

    if (resourcesStartIndex === -1) {
      const kvMatch = line.match(/^([^:]+): (.+)$/);
      if (kvMatch) {
        fields[kvMatch[1].trim()] = kvMatch[2].trim();
      }
    }
  }

  const resources: string[] = [];
  if (resourcesStartIndex !== -1) {
    for (let i = resourcesStartIndex; i < lines.length; i++) {
      if (lines[i].startsWith('- ')) {
        resources.push(lines[i].slice(2).trim());
      }
    }
  }

  return {
    domain,
    address,
    statement,
    uri: fields.URI ?? '',
    version: fields.Version ?? '',
    chainId: parseInt(fields['Chain ID'] ?? '1', 10),
    nonce: fields.Nonce ?? '',
    issuedAt: fields['Issued At'] ?? '',
    expirationTime: fields['Expiration Time'],
    notBefore: fields['Not Before'],
    requestId: fields['Request ID'],
    resources: resources.length > 0 ? resources : undefined,
  };
}

// ============================================================
// Nonce Manager
// ============================================================

/**
 * NonceManager provides nonce generation, tracking, and replay
 * attack protection for authentication flows.
 *
 * Each nonce is single-use and has a configurable expiry time.
 * Attempting to reuse a nonce will be detected as a replay attack.
 */
export class NonceManager {
  private nonces: Map<string, NonceEntry> = new Map();
  private maxAge: number;

  /**
   * @param maxAgeMs - Maximum age of a nonce in milliseconds (default: 5 minutes).
   */
  constructor(maxAgeMs: number = MAX_NONCE_AGE_MS) {
    this.maxAge = maxAgeMs;
  }

  /**
   * Generate a cryptographically random nonce.
   *
   * @returns A 64-character hex string.
   */
  generate(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const nonce = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

    this.nonces.set(nonce, {
      nonce,
      createdAt: Date.now(),
      used: false,
    });

    return nonce;
  }

  /**
   * Consume a nonce. Returns true if the nonce was valid and unused.
   * Returns false if the nonce was already used (replay attack) or
   * expired.
   *
   * @param nonce - The nonce to consume.
   * @returns Whether the nonce was valid.
   */
  consume(nonce: string): boolean {
    const entry = this.nonces.get(nonce);
    if (!entry) return false;
    if (entry.used) return false; // Replay attack detected
    if (Date.now() - entry.createdAt > this.maxAge) {
      this.nonces.delete(nonce);
      return false; // Expired
    }

    entry.used = true;
    entry.usedAt = Date.now();
    return true;
  }

  /**
   * Check if a nonce has been used.
   */
  isUsed(nonce: string): boolean {
    return this.nonces.get(nonce)?.used ?? false;
  }

  /**
   * Attach metadata to a nonce (e.g., the address it was issued to).
   */
  attachMetadata(nonce: string, metadata: { address?: string; purpose?: string }): void {
    const entry = this.nonces.get(nonce);
    if (entry) {
      entry.address = metadata.address;
      entry.purpose = metadata.purpose;
    }
  }

  /**
   * Clean up expired nonces.
   *
   * @returns The number of nonces cleaned.
   */
  cleanup(): number {
    const cutoff = Date.now() - this.maxAge;
    let count = 0;

    for (const [nonce, entry] of this.nonces) {
      if (entry.createdAt < cutoff) {
        this.nonces.delete(nonce);
        count++;
      }
    }

    return count;
  }

  /**
   * Get the number of tracked nonces.
   */
  get size(): number {
    return this.nonces.size;
  }

  /**
   * Clear all tracked nonces.
   */
  clear(): void {
    this.nonces.clear();
  }
}

// ============================================================
// HMAC Authentication
// ============================================================

/**
 * Compute HMAC-SHA256 over data.
 *
 * Used for integrity verification of relay messages and session data.
 *
 * @param key - HMAC key (any length).
 * @param data - Data to authenticate.
 * @returns 32-byte HMAC tag.
 */
export function computeHmac(key: Uint8Array, data: Uint8Array): Uint8Array {
  return hmac(sha256, key, data);
}

/**
 * Verify an HMAC tag using constant-time comparison.
 *
 * @param key - HMAC key.
 * @param data - Original data.
 * @param expectedTag - Expected HMAC tag.
 * @returns Whether the tag is valid.
 */
export function verifyHmac(
  key: Uint8Array,
  data: Uint8Array,
  expectedTag: Uint8Array,
): boolean {
  if (expectedTag.length !== 32) return false;
  const computed = hmac(sha256, key, data);
  if (computed.length !== expectedTag.length) return false;

  // Constant-time comparison to prevent timing attacks
  let result = 0;
  for (let i = 0; i < computed.length; i++) {
    result |= computed[i] ^ expectedTag[i];
  }
  return result === 0;
}

/**
 * Derive an authentication key from a shared secret.
 *
 * @param sharedSecret - 32-byte shared secret.
 * @param context - Context string (e.g., 'auth', 'relay').
 * @returns 32-byte authentication key.
 */
export function deriveAuthKey(sharedSecret: Uint8Array, context: string): Uint8Array {
  const contextBytes = new TextEncoder().encode(context);
  const combined = new Uint8Array(sharedSecret.length + contextBytes.length);
  combined.set(sharedSecret);
  combined.set(contextBytes);
  return sha256(combined);
}

// ============================================================
// Utility: Generate Authentication Challenge
// ============================================================

/**
 * Generate a nonce-based authentication challenge message
 * for Sign-In With Ethereum or similar flows.
 *
 * @param domain - The requesting domain.
 * @param address - The wallet address.
 * @param nonce - The nonce to include (or generate one).
 * @param issuedAt - ISO timestamp (defaults to now).
 * @returns The challenge message string.
 */
export function generateAuthChallenge(
  domain: string,
  address: string,
  nonce?: string,
  issuedAt?: string,
): string {
  const nonceValue = nonce || crypto.randomUUID?.() || generateRandomHex(32);
  const issuedAtValue = issuedAt || new Date().toISOString();

  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    'Sign in with Ethereum to the app.',
    '',
    `URI: https://${domain}`,
    `Version: 1`,
    `Chain ID: 1`,
    `Nonce: ${nonceValue}`,
    `Issued At: ${issuedAtValue}`,
  ].join('\n');
}

/**
 * Generate a random hex string.
 */
function generateRandomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// Address Validation
// ============================================================

/**
 * Validate an Ethereum address format.
 *
 * Checks that the address is a valid 0x-prefixed 40-character hex string.
 * Optionally validates the checksum (EIP-55) if the address contains
 * mixed-case letters.
 *
 * @param address - The address to validate.
 * @param checkChecksum - Whether to validate EIP-55 checksum (default: true).
 * @returns Whether the address is valid.
 */
export function isValidAddress(address: string, checkChecksum: boolean = true): boolean {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return false;
  }

  if (!checkChecksum) return true;

  // Check if the address has mixed case (EIP-55 checksum encoding)
  const hasUpperCase = /[A-F]/.test(address);
  const hasLowerCase = /[a-f]/.test(address);

  if (!hasUpperCase || !hasLowerCase) {
    // All lowercase or all uppercase — checksum not enforced
    return true;
  }

  // Validate EIP-55 checksum
  return toChecksumAddress(address) === address;
}

/**
 * Convert an address to its EIP-55 checksummed form.
 *
 * @param address - The address (with or without 0x prefix).
 * @returns Checksummed address with 0x prefix.
 */
export function toChecksumAddress(address: string): string {
  const clean = address.toLowerCase().replace('0x', '');
  const hash = keccak_256(new TextEncoder().encode(clean));
  const hashHex = Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('');

  let result = '0x';
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (parseInt(hashHex[i], 16) >= 8) {
      result += char.toUpperCase();
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Normalize an address to lowercase with 0x prefix.
 *
 * Useful for case-insensitive address comparison.
 *
 * @param address - The address to normalize.
 * @returns Lowercase address with 0x prefix.
 */
export function normalizeAddress(address: string): string {
  const clean = address.replace('0x', '').toLowerCase();
  return `0x${clean}`;
}
