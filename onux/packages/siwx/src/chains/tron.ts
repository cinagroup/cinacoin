/**
 * Tron (Sign-In With TRON) adapter for cross-chain authentication.
 *
 * Implements SIWTR — a Sign-In with X pattern for the TRON network,
 * using secp256k1 curve signatures and TRON's base58check addresses.
 *
 * TRON addresses start with 'T' and are 34 characters (base58check).
 * Signatures are secp256k1 recoverable (65 bytes: r, s, v).
 *
 * Reference: https://developers.tron.network
 */

import type { SIWXParams, SIWXResult, SIWXVerifyInput } from '../types.js';
import { generateTimestamp } from '@cinacoin/siwe';
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes, concatBytes } from '@noble/hashes/utils';

/**
 * Create a sign-in message for TRON chains (SIWTR format).
 *
 * The message follows the SIWE-inspired structured text format,
 * adapted for TRON addressing conventions.
 *
 * @param params - SIWX parameters.
 * @returns TRON sign-in message string.
 */
export function createTronSignInMessage(params: SIWXParams): string {
  const version = params.version || '1';
  const issuedAt = params.issuedAt || generateTimestamp();

  const lines: string[] = [];

  lines.push(`${params.domain} wants you to sign in with your TRON account:`);
  lines.push(params.address);

  if (params.statement) {
    lines.push('');
    lines.push(params.statement);
  }

  lines.push('');
  lines.push(`URI: ${params.uri}`);
  lines.push(`Version: ${version}`);
  lines.push(`Chain ID: ${params.chainId}`);
  lines.push(`Nonce: ${params.nonce}`);
  lines.push(`Issued At: ${issuedAt}`);

  if (params.expirationTime) {
    lines.push(`Expiration Time: ${params.expirationTime}`);
  }
  if (params.notBefore) {
    lines.push(`Not Before: ${params.notBefore}`);
  }
  if (params.requestId) {
    lines.push(`Request ID: ${params.requestId}`);
  }
  if (params.resources && params.resources.length > 0) {
    lines.push('Resources:');
    for (const resource of params.resources) {
      lines.push(`- ${resource}`);
    }
  }

  return lines.join('\n');
}

/**
 * Verify a TRON secp256k1 signature against a message.
 *
 * TRON uses recoverable secp256k1 signatures (65 bytes: r, s, v),
 * similar to EVM but with TRON-specific hashing (keccak256 of UTF-8
 * message bytes, prefixed with the TRON message prefix).
 *
 * @param input - Verification input (message, signature, address).
 * @returns SIWX result with validity status.
 *
 * Note: Full cryptographic verification requires tronweb or a
 * similar TRON library. This implementation performs format
 * validation and delegates to a registered verify hook when
 * available.
 */
export async function verifyTronSignature(
  input: SIWXVerifyInput
): Promise<SIWXResult> {
  try {
    // TRON uses secp256k1 signatures similar to Ethereum
    // Message format: "\x19TRON Signed Message:\n" + length + message
    // Then keccak256 hash
    
    const messageBytes = new TextEncoder().encode(input.message);
    const prefix = new TextEncoder().encode(`\x19TRON Signed Message:\n${messageBytes.length}`);
    const fullMessage = concatBytes(prefix, messageBytes);
    const hash = keccak_256(fullMessage);

    // Decode signature — expect 65 bytes (r:32, s:32, v:1)
    const signatureBytes = decodeTronSignature(input.signature);
    if (signatureBytes.length !== 65) {
      return {
        chainType: 'tron',
        data: {},
        signature: input.signature,
        message: input.message,
        valid: false,
        error: `Invalid TRON signature: expected 65 bytes, got ${signatureBytes.length}`,
      };
    }

    // Recover public key using secp256k1
    // The signature is 65 bytes: r(32) + s(32) + v(1)
    // v is the recovery flag (27-30 for uncompressed, 31-34 for compressed)
    const recoveryFlag = signatureBytes[64];
    let recovery = recoveryFlag - 27;
    if (recovery < 0 || recovery > 7) {
      return {
        chainType: 'tron',
        data: {},
        signature: input.signature,
        message: input.message,
        valid: false,
        error: `Invalid recovery flag: ${recoveryFlag}`,
      };
    }
    recovery = recovery & 3; // Keep only lowest 2 bits
    
    const compactSig = signatureBytes.slice(0, 64);
    const sig = secp256k1.Signature.fromCompact(compactSig).addRecoveryBit(recovery);
    const recoveredPubKey = sig.recoverPublicKey(hash).toRawBytes(false);

    // Derive TRON address from public key
    // TRON address = 0x41 + keccak256(pubkey[1:])[12:]
    const recoveredAddress = deriveTronAddress(recoveredPubKey);

    // Normalize addresses for comparison
    const expectedAddress = normalizeTronAddress(input.address);
    const valid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();

    return {
      chainType: 'tron',
      data: {
        address: input.address,
        message: input.message,
        recoveredAddress,
        network: identifyTronNetwork(input.address),
        publicKeyHex: bytesToHex(recoveredPubKey),
      },
      signature: input.signature,
      message: input.message,
      valid,
      error: valid ? undefined : `TRON address mismatch: expected ${expectedAddress}, recovered ${recoveredAddress}`,
    };
  } catch (error: unknown) {
    return {
      chainType: 'tron',
      data: {},
      signature: input.signature,
      message: input.message,
      valid: false,
      error: (error as Error)?.message || 'Unknown error during TRON verification',
    };
  }
}

/**
 * Validate the format of a TRON secp256k1 signature.
 *
 * TRON signatures are 65-byte recoverable secp256k1 signatures
 * (r: 32 bytes, s: 32 bytes, v: 1 byte = recovery ID).
 *
 * @param signature - Signature as hex string.
 * @param address - TRON address (used to infer expected format).
 * @returns True if the format looks correct.
 */
function validateTronSignatureFormat(signature: string, address: string): boolean {
  if (!signature || typeof signature !== 'string') return false;

  // Hex-encoded 65-byte recoverable signature (130 hex chars)
  if (/^[0-9a-fA-F]{130}$/.test(signature)) {
    return true;
  }

  // Hex-encoded 64-byte signature without v (128 hex chars)
  if (/^[0-9a-fA-F]{128}$/.test(signature)) {
    return true;
  }

  return false;
}

/**
 * Identify the TRON network based on the address prefix.
 *
 * TRON mainnet addresses start with 'T'.
 * TRON testnet (Shasta) addresses may also start with 'T' but
 * have different internal encoding.
 *
 * @param address - TRON address.
 * @returns Network identifier.
 */
function identifyTronNetwork(address: string): string {
  if (!address || typeof address !== 'string') return 'unknown';

  // TRON addresses are base58check encoded, starting with 'T'
  if (/^T[A-Za-z1-9]{33}$/.test(address)) {
    return 'tron-mainnet';
  }

  // Hex format (42 chars, 0x prefix) — usually represents the same
  // address in different encoding
  if (/^41[0-9a-fA-F]{40}$/.test(address)) {
    return 'tron-hex';
  }

  return 'unknown';
}

/**
 * Validate a TRON address format.
 *
 * Accepts both base58check (T-prefix, 34 chars) and hex (0x41-prefix, 42 chars).
 *
 * @param address - TRON address to validate.
 * @returns True if the address format is valid.
 */
export function isValidTronAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;

  // Base58check format: T + 33 alphanumeric
  if (/^T[A-Za-z1-9]{33}$/.test(address)) {
    return true;
  }

  // Hex format: 41 + 40 hex chars (no 0x prefix in TRON)
  if (/^41[0-9a-fA-F]{40}$/.test(address)) {
    return true;
  }

  // With 0x prefix (less common for TRON but accepted by some tools)
  if (/^0x41[0-9a-fA-F]{40}$/.test(address)) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// TRON helpers
// ---------------------------------------------------------------------------

/**
 * Decode a TRON signature from hex string.
 */
function decodeTronSignature(sig: string): Uint8Array {
  if (typeof sig !== 'string') {
    return new Uint8Array(sig as ArrayBuffer);
  }
  if (/^[0-9a-fA-F]+$/.test(sig)) {
    return hexToBytes(sig);
  }
  // Try base64
  if (/^[A-Za-z0-9+/=]+$/.test(sig)) {
    return base64Decode(sig);
  }
  throw new Error('Invalid TRON signature encoding');
}

/**
 * Derive a TRON address from an uncompressed secp256k1 public key.
 *
 * TRON address = base58check(0x41 + keccak256(pubkey[1:])[12:])
 * The first byte of the uncompressed public key (0x04) is stripped.
 */
function deriveTronAddress(uncompressedPubKey: Uint8Array): string {
  // Strip the 0x04 prefix if present (65-byte uncompressed key)
  const pubKeyBytes = uncompressedPubKey.length === 65
    ? uncompressedPubKey.slice(1)
    : uncompressedPubKey;

  // keccak256 of the 64-byte public key
  const hash = keccak_256(pubKeyBytes);

  // Take last 20 bytes and prepend 0x41 (TRON mainnet prefix)
  const addressBytes = new Uint8Array(21);
  addressBytes[0] = 0x41;
  addressBytes.set(hash.slice(12), 1);

  // Base58Check encode
  return base58CheckEncode(addressBytes);
}

/**
 * Normalize a TRON address to hex format (41...) for comparison.
 */
function normalizeTronAddress(address: string): string {
  if (!address) return '';
  // Already hex format
  if (/^41[0-9a-fA-F]{40}$/.test(address)) {
    return address.toLowerCase();
  }
  if (/^0x41[0-9a-fA-F]{40}$/.test(address)) {
    return address.slice(2).toLowerCase();
  }
  // Base58check format — decode to hex
  if (/^T[A-Za-z1-9]{33}$/.test(address)) {
    const decoded = base58Decode(address);
    return bytesToHex(decoded.slice(0, 21)).toLowerCase();
  }
  return address.toLowerCase();
}

/**
 * Base58Check encode.
 */
function base58CheckEncode(payload: Uint8Array): string {
  const checksum = doubleSha256(payload).slice(0, 4);
  const full = concatBytes(payload, checksum);
  return base58Encode(full);
}

/**
 * Double SHA-256 (used by Bitcoin/TRON base58check).
 */
function doubleSha256(data: Uint8Array): Uint8Array {
  return sha256(sha256(data));
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Encode bytes to base58.
 */
function base58Encode(bytes: Uint8Array): string {
  let leadingZeros = 0;
  for (const b of bytes) {
    if (b !== 0) break;
    leadingZeros++;
  }

  let num = 0n;
  for (const b of bytes) {
    num = num * 256n + BigInt(b);
  }

  const chars: string[] = [];
  while (num > 0n) {
    const remainder = Number(num % 58n);
    chars.unshift(BASE58_ALPHABET[remainder]);
    num = num / 58n;
  }

  for (let i = 0; i < leadingZeros; i++) {
    chars.unshift('1');
  }

  return chars.join('');
}

/**
 * Decode base58 to bytes.
 */
function base58Decode(str: string): Uint8Array {
  const BASE58_MAP: Record<string, number> = {};
  for (let i = 0; i < BASE58_ALPHABET.length; i++) {
    BASE58_MAP[BASE58_ALPHABET[i]] = i;
  }

  let leadingZeros = 0;
  for (const ch of str) {
    if (ch !== '1') break;
    leadingZeros++;
  }

  let num = 0n;
  for (const ch of str) {
    const val = BASE58_MAP[ch];
    if (val === undefined) throw new Error(`Invalid base58 character: ${ch}`);
    num = num * 58n + BigInt(val);
  }

  const hex = num === 0n ? '' : num.toString(16);
  const paddedHex = hex.length % 2 ? '0' + hex : hex;
  const bytes: number[] = [];
  for (let i = 0; i < paddedHex.length; i += 2) {
    bytes.push(parseInt(paddedHex.slice(i, i + 2), 16));
  }

  const result = new Uint8Array(leadingZeros + bytes.length);
  result.set(bytes, leadingZeros);
  return result;
}

/**
 * Decode base64 to bytes.
 */
function base64Decode(str: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(str, 'base64'));
  }
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Parse a TRON sign-in message into structured data.
 *
 * @param message - TRON sign-in message string.
 * @returns Parsed message fields.
 */
export function parseTronMessage(message: string): Record<string, unknown> {
  const lines = message.split('\n');

  const preambleMatch = lines[0]?.match(
    /^(.+) wants you to sign in with your TRON account:$/
  );
  if (!preambleMatch) {
    throw new Error('Invalid TRON sign-in message: missing or malformed preamble');
  }

  const address = lines[1];
  if (!address) {
    throw new Error('Invalid TRON sign-in message: missing address');
  }

  const fields: Record<string, string> = {};
  let statementLines: string[] = [];
  let collectingStatement = false;
  let uriLineIndex = -1;

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (line === '') {
      if (uriLineIndex === -1 && fields['URI'] === undefined) {
        collectingStatement = true;
        continue;
      }
    }
    if (line?.startsWith('URI:')) {
      collectingStatement = false;
      uriLineIndex = i;
    }

    if (collectingStatement && !line?.startsWith('URI:')) {
      statementLines.push(line);
      continue;
    }

    const match = line?.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      fields[match[1].trim()] = match[2].trim();
    }
  }

  return {
    domain: preambleMatch[1],
    address,
    statement: statementLines.join('\n') || undefined,
    uri: fields['URI'],
    version: fields['Version'] || '1',
    chainId: fields['Chain ID'],
    nonce: fields['Nonce'],
    issuedAt: fields['Issued At'],
    expirationTime: fields['Expiration Time'],
    notBefore: fields['Not Before'],
    requestId: fields['Request ID'],
    network: identifyTronNetwork(address),
  };
}
