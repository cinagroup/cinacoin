/**
 * Solana sign-in adapter for cross-chain authentication.
 *
 * Implements Solana's sign-message flow (ed25519 signatures)
 * for cross-chain sign-in compatible with SIWX.
 */

import type { SIWXParams, SIWXResult, SIWXVerifyInput } from '../types.js';
import { generateTimestamp } from '@cinacoin/siwe';
import { ed25519 } from '@noble/curves/ed25519';
import { hexToBytes } from '@noble/hashes/utils';

/**
 * Create a sign-in message for Solana chains.
 *
 * Solana doesn't have an EIP-4361 equivalent, so we use a
 * structured plain-text format inspired by the SIWE specification.
 *
 * @param params - SIWX parameters.
 * @returns Solana sign-in message string.
 */
export function createSolanaSignInMessage(params: SIWXParams): string {
  const version = params.version || '1';
  const issuedAt = params.issuedAt || generateTimestamp();

  const lines: string[] = [];

  lines.push(`${params.domain} wants you to sign in with your Solana account:`);
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
 * Verify a Solana ed25519 signature against a message.
 *
 * Solana uses ed25519 signatures which require the public key
 * to be available for verification (no recovery like ECDSA).
 *
 * @param input - Verification input.
 * @returns SIWX result with validity status.
 */
export async function verifySolanaSignature(
  input: SIWXVerifyInput
): Promise<SIWXResult> {
  try {
    // Solana addresses are base58-encoded public keys (32 bytes)
    const publicKeyBytes = base58Decode(input.address);
    
    // Decode signature from hex
    const signatureBytes = hexToBytes(input.signature);
    
    // Encode message to bytes
    const messageBytes = new TextEncoder().encode(input.message);
    
    // Verify using ed25519
    const isValid = ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);

    return {
      chainType: 'solana',
      data: { address: input.address, message: input.message },
      signature: input.signature,
      message: input.message,
      valid: isValid,
      error: isValid ? undefined : 'Solana signature verification failed',
    };
  } catch (error: unknown) {
    return {
      chainType: 'solana',
      data: {},
      signature: input.signature,
      message: input.message,
      valid: false,
      error: (error as Error)?.message || 'Unknown error during Solana verification',
    };
  }
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Decode base58 string to bytes.
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
 * Basic format validation for a Solana signature.
 *
 * Solana signatures are 64-byte ed25519 signatures.
 *
 * @param signature - Signature as hex string or byte array.
 * @returns True if the format looks correct.
 */
function validateSolanaSignatureFormat(signature: string): boolean {
  if (typeof signature === 'string') {
    // Hex string should be 128 chars (64 bytes)
    if (/^[0-9a-fA-F]{128}$/.test(signature)) {
      return true;
    }
    // Base58 Solana signatures are typically 87-88 chars
    if (/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(signature)) {
      return true;
    }
  }
  return false;
}

/**
 * Parse a Solana sign-in message into structured data.
 *
 * @param message - Solana sign-in message string.
 * @returns Parsed message fields.
 */
export function parseSolanaMessage(message: string): Record<string, unknown> {
  const lines = message.split('\n');

  const preambleMatch = lines[0]?.match(/^(.+) wants you to sign in with your Solana account:$/);
  if (!preambleMatch) {
    throw new Error('Invalid Solana sign-in message: missing or malformed preamble');
  }

  const address = lines[1];
  if (!address) {
    throw new Error('Invalid Solana sign-in message: missing address');
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
  };
}
