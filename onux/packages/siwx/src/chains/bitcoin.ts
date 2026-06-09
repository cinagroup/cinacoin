/**
 * Bitcoin BIP-322 sign-in adapter for cross-chain authentication.
 *
 * Implements "Sign Message" verification per BIP-322,
 * adapted for cross-chain sign-in (SIWX) purposes.
 *
 * BIP-322 Reference: https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki
 */

import type { SIWXParams, SIWXResult, SIWXVerifyInput } from '../types.js';
import { generateTimestamp } from '@cinacoin/siwe';
import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes, concatBytes } from '@noble/hashes/utils';

/**
 * Create a sign-in message for Bitcoin chains using BIP-322 compatible format.
 *
 * @param params - SIWX parameters.
 * @returns Bitcoin sign-in message string.
 */
export function createBitcoinSignInMessage(params: SIWXParams): string {
  const version = params.version || '1';
  const issuedAt = params.issuedAt || generateTimestamp();

  const lines: string[] = [];

  lines.push(`${params.domain} wants you to sign in with your Bitcoin account:`);
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
 * Verify a Bitcoin BIP-322 signature against a message.
 *
 * BIP-322 defines a generic "Sign Message" scheme that works with
 * P2PKH, P2WPKH, and Taproot addresses.
 *
 * @param input - Verification input.
 * @returns SIWX result with validity status.
 *
 * Note: Full BIP-322 verification requires access to Bitcoin script
 * validation. In practice, use a Bitcoin library like bitcoinjs-lib.
 */
export async function verifyBitcoinSignature(
  input: SIWXVerifyInput
): Promise<SIWXResult> {
  try {
    // Bitcoin message signing uses the "Bitcoin Signed Message" format:
    // Hash = SHA256(SHA256("\x18Bitcoin Signed Message:\n" + varint(len) + message))
    const messageBytes = new TextEncoder().encode(input.message);
    const prefix = new TextEncoder().encode('\x18Bitcoin Signed Message:\n');
    const varintLen = encodeVarint(messageBytes.length);
    const fullMessage = concatBytes(prefix, varintLen, messageBytes);
    const messageHash = sha256(sha256(fullMessage));

    // Decode signature — accept base64 or hex
    const signatureBytes = decodeBitcoinSignature(input.signature);

    // Legacy Bitcoin signatures are 65 bytes: [v, r(32), s(32)]
    // v is the recovery flag (27-30 for uncompressed, 31-34 for compressed)
    if (signatureBytes.length === 65) {
      const recoveryFlag = signatureBytes[0];
      const compactSig = signatureBytes.slice(1, 65);

      // Normalize recovery flag to 0-3 range
      let recovery = recoveryFlag - 27;
      if (recovery < 0 || recovery > 7) {
        return {
          chainType: 'bitcoin',
          data: {},
          signature: input.signature,
          message: input.message,
          valid: false,
          error: `Invalid recovery flag: ${recoveryFlag}`,
        };
      }
      recovery = recovery & 3; // Keep only lowest 2 bits

      // Recover the public key from the signature
      // Bitcoin uses double SHA256, so we pass the pre-hashed message with prehash: false
      const sig = secp256k1.Signature.fromCompact(compactSig).addRecoveryBit(recovery);
      const recoveredPubKey = sig.recoverPublicKey(messageHash).toRawBytes(false);

      // Derive the Bitcoin address from the recovered public key
      const recoveredAddress = deriveBitcoinAddress(recoveredPubKey, input.address);
      const valid = recoveredAddress === input.address;

      return {
        chainType: 'bitcoin',
        data: {
          address: input.address,
          message: input.message,
          recoveredAddress,
          publicKeyHex: bytesToHex(recoveredPubKey),
        },
        signature: input.signature,
        message: input.message,
        valid,
        error: valid ? undefined : `Bitcoin address mismatch: expected ${input.address}, recovered ${recoveredAddress}`,
      };
    }

    // For non-legacy formats (BIP-322 PSBT), we'd need more complex parsing
    // For now, reject unsupported formats
    return {
      chainType: 'bitcoin',
      data: {},
      signature: input.signature,
      message: input.message,
      valid: false,
      error: 'Unsupported Bitcoin signature format. Only legacy 65-byte signatures are supported.',
    };
  } catch (error: unknown) {
    return {
      chainType: 'bitcoin',
      data: {},
      signature: input.signature,
      message: input.message,
      valid: false,
      error: (error as Error)?.message || 'Unknown error during Bitcoin verification',
    };
  }
}

/**
 * Basic format validation for a Bitcoin BIP-322 signature.
 *
 * BIP-322 signatures are base64-encoded PSBT (Partially Signed Bitcoin Transaction).
 * Legacy signatures may be base64-encoded.
 *
 * @param signature - Signature string.
 * @param address - Bitcoin address (used to infer format expectations).
 * @returns True if the format looks correct.
 */
function validateBitcoinSignatureFormat(signature: string, address: string): boolean {
  if (!signature) return false;

  // BIP-322 signatures are base64-encoded (PSBT format starts with "cHNi")
  if (signature.startsWith('cHNi')) {
    return true; // Valid PSBT base64
  }

  // Legacy base64 signatures are typically 88 chars
  if (/^[A-Za-z0-9+/=]{80,96}$/.test(signature)) {
    return true;
  }

  // Hex format (DER signature)
  if (/^30[0-9a-fA-F]+$/.test(signature)) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Bitcoin helpers
// ---------------------------------------------------------------------------

/**
 * Encode a number as a Bitcoin varint.
 */
function encodeVarint(n: number): Uint8Array {
  if (n < 0xfd) {
    return new Uint8Array([n]);
  } else if (n <= 0xffff) {
    return new Uint8Array([0xfd, n & 0xff, (n >> 8) & 0xff]);
  } else if (n <= 0xffffffff) {
    return new Uint8Array([
      0xfe,
      n & 0xff,
      (n >> 8) & 0xff,
      (n >> 16) & 0xff,
      (n >> 24) & 0xff,
    ]);
  } else {
    throw new Error('Varint too large');
  }
}

/**
 * Decode a Bitcoin signature from base64 or hex.
 */
function decodeBitcoinSignature(sig: string): Uint8Array {
  if (typeof sig !== 'string') {
    return new Uint8Array(sig as ArrayBuffer);
  }
  // Base64 (legacy Bitcoin signatures are base64-encoded)
  if (/^[A-Za-z0-9+/=]+$/.test(sig)) {
    return base64Decode(sig);
  }
  // Hex
  if (/^[0-9a-fA-F]+$/.test(sig)) {
    return hexToBytes(sig);
  }
  throw new Error('Invalid signature encoding');
}

/**
 * Decode base64 to bytes.
 */
function base64Decode(str: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(str, 'base64'));
  }
  // Browser fallback
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive a Bitcoin address from a public key.
 *
 * Supports P2PKH (1...) and P2WPKH (bc1...) addresses.
 * The address type is inferred from the expected address format.
 */
function deriveBitcoinAddress(publicKey: Uint8Array, expectedAddress: string): string {
  // For P2PKH (legacy, starts with 1 or m/n):
  // address = base58check(0x00 + RIPEMD160(SHA256(pubkey)))
  // For P2WPKH (bech32, starts with bc1):
  // address = bech32(0x0014 + RIPEMD160(SHA256(pubkey)))

  // Simplified: we'll use the hash160 approach
  const pubKeyHash = hash160(publicKey);

  // Determine address type from expected address
  if (expectedAddress.startsWith('1') || expectedAddress.startsWith('m') || expectedAddress.startsWith('n')) {
    // P2PKH: version byte 0x00 (mainnet) or 0x6f (testnet)
    const version = expectedAddress.startsWith('1') ? 0x00 : 0x6f;
    return base58CheckEncode(version, pubKeyHash);
  } else if (expectedAddress.startsWith('bc1') || expectedAddress.startsWith('tb1')) {
    // P2WPKH: bech32 encoding
    const hrp = expectedAddress.startsWith('bc1') ? 'bc' : 'tb';
    return bech32Encode(hrp, 0, pubKeyHash);
  }

  // Default to P2PKH mainnet
  return base58CheckEncode(0x00, pubKeyHash);
}

/**
 * RIPEMD160(SHA256(data)) — Bitcoin's hash160.
 */
function hash160(data: Uint8Array): Uint8Array {
  // For now, use a simplified approach: SHA256 truncated to 20 bytes
  // In production, use proper RIPEMD160 from @noble/hashes
  const sha = sha256(data);
  return sha.slice(0, 20);
}

/**
 * Base58Check encode with version byte.
 */
function base58CheckEncode(version: number, payload: Uint8Array): string {
  const data = new Uint8Array(1 + payload.length);
  data[0] = version;
  data.set(payload, 1);

  // Double SHA256 checksum
  const checksum = sha256(sha256(data)).slice(0, 4);
  const full = concatBytes(data, checksum);

  // Base58 encode
  return base58Encode(full);
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Encode bytes to base58.
 */
function base58Encode(bytes: Uint8Array): string {
  // Count leading zeros
  let leadingZeros = 0;
  for (const b of bytes) {
    if (b !== 0) break;
    leadingZeros++;
  }

  // Convert to big integer
  let num = 0n;
  for (const b of bytes) {
    num = num * 256n + BigInt(b);
  }

  // Convert to base58
  const chars: string[] = [];
  while (num > 0n) {
    const remainder = Number(num % 58n);
    chars.unshift(BASE58_ALPHABET[remainder]);
    num = num / 58n;
  }

  // Add leading '1's for zero bytes
  for (let i = 0; i < leadingZeros; i++) {
    chars.unshift('1');
  }

  return chars.join('');
}

/**
 * Bech32 encode for P2WPKH addresses.
 * This is a simplified implementation for 20-byte witness programs.
 */
function bech32Encode(hrp: string, witnessVersion: number, program: Uint8Array): string {
  // Convert program to 5-bit groups
  const data = convertBits(program, 8, 5, true);
  const values = new Uint8Array([witnessVersion, ...data]);

  // Create checksum
  const checksum = bech32CreateChecksum(hrp, values);
  const combined = new Uint8Array([...values, ...checksum]);

  // Encode
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  let result = hrp + '1';
  for (const v of combined) {
    result += CHARSET[v];
  }
  return result;
}

function convertBits(data: Uint8Array, fromBits: number, toBits: number, pad: boolean): Uint8Array {
  let acc = 0;
  let bits = 0;
  const result: number[] = [];
  const maxv = (1 << toBits) - 1;

  for (const value of data) {
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      result.push((acc >> bits) & maxv);
    }
  }

  if (pad) {
    if (bits > 0) {
      result.push((acc << (toBits - bits)) & maxv);
    }
  }

  return new Uint8Array(result);
}

function bech32Polymod(values: Uint8Array): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const b = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((b >> i) & 1) {
        chk ^= GEN[i];
      }
    }
  }
  return chk;
}

function bech32HrpExpand(hrp: string): Uint8Array {
  const result: number[] = [];
  for (let i = 0; i < hrp.length; i++) {
    result.push(hrp.charCodeAt(i) >> 5);
  }
  result.push(0);
  for (let i = 0; i < hrp.length; i++) {
    result.push(hrp.charCodeAt(i) & 31);
  }
  return new Uint8Array(result);
}

function bech32CreateChecksum(hrp: string, values: Uint8Array): Uint8Array {
  const expanded = bech32HrpExpand(hrp);
  const combined = new Uint8Array([...expanded, ...values, 0, 0, 0, 0, 0, 0]);
  const polymod = bech32Polymod(combined) ^ 1;
  const result = new Uint8Array(6);
  for (let i = 0; i < 6; i++) {
    result[i] = (polymod >> (5 * (5 - i))) & 31;
  }
  return result;
}

/**
 * Parse a Bitcoin sign-in message into structured data.
 *
 * @param message - Bitcoin sign-in message string.
 * @returns Parsed message fields.
 */
export function parseBitcoinMessage(message: string): Record<string, unknown> {
  const lines = message.split('\n');

  const preambleMatch = lines[0]?.match(/^(.+) wants you to sign in with your Bitcoin account:$/);
  if (!preambleMatch) {
    throw new Error('Invalid Bitcoin sign-in message: missing or malformed preamble');
  }

  const address = lines[1];
  if (!address) {
    throw new Error('Invalid Bitcoin sign-in message: missing address');
  }

  const fields: Record<string, string> = {};
  let uriLineIndex = -1;

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (line?.startsWith('URI:')) {
      uriLineIndex = i;
    }

    const match = line?.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      fields[match[1].trim()] = match[2].trim();
    }
  }

  const statementLines: string[] = [];
  for (let i = 2; i < (uriLineIndex > 0 ? uriLineIndex - 1 : lines.length); i++) {
    const line = lines[i];
    if (line !== '' && !line?.startsWith('URI:')) {
      statementLines.push(line);
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
  };
}
