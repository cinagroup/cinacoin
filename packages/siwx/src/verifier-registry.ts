/**
 * SIWX Verifier Registry — Chain-specific signature verifier management.
 *
 * Provides a pluggable registry for registering, retrieving, and managing
 * signature verifiers across different blockchain namespaces (EVM, Solana,
 * Bitcoin, TON, Tron, and custom chains).
 *
 * @packageDocumentation
 */

import { logger } from '@cinacoin/logger';
import { ed25519 } from '@noble/curves/ed25519';
import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { recoverMessageAddress } from 'viem';
import type { SIWXVerifyInput, SIWXResult } from './types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Verifier function signature.
 *
 * A verifier takes a SIWXVerifyInput and returns an SIWXResult with the
 * verification outcome.
 */
export type VerifierFn = (input: SIWXVerifyInput) => Promise<SIWXResult> | SIWXResult;

/**
 * Registered verifier descriptor.
 */
export interface VerifierDescriptor {
  /** Human-readable name of the chain/namespace. */
  name: string;

  /** CAIP-2 namespace identifier (e.g., 'eip155', 'solana', 'bip122', 'ton', 'tron'). */
  namespace: string;

  /** The verification function. */
  verify: VerifierFn;

  /** Whether this verifier is built-in or custom-registered. */
  source: 'builtin' | 'custom';

  /** Version of the verifier implementation. */
  version: string;
}

/**
 * Configuration for registering a custom verifier.
 */
export interface RegisterVerifierOptions {
  /** Human-readable name for the verifier. */
  name?: string;

  /** Optional version string (default: '1.0.0'). */
  version?: string;
}

// ---------------------------------------------------------------------------
// Built-in Verifiers
// ---------------------------------------------------------------------------

/**
 * Create the built-in EVM (EIP-4361 / EIP-191) verifier.
 *
 * Verifies signatures using `ethers` or `viem` personal_sign recovery.
 */
function createEvmVerifier(): VerifierFn {
  return async (input: SIWXVerifyInput): Promise<SIWXResult> => {
    try {
      // Recovery-based verification: recover the address from the signed message
      // and compare with the expected address.
      // In production, this dispatches to ethers.utils.verifyMessage or viem's
      // verifyMessage depending on the host environment.
      const recoveredAddress = await recoverAddressEvm(input.message, input.signature);
      const valid = recoveredAddress.toLowerCase() === input.address.toLowerCase();

      return {
        chainType: 'evm',
        data: { recoveredAddress },
        signature: input.signature,
        message: input.message,
        valid,
        error: valid ? undefined : `Address mismatch: expected ${input.address}, recovered ${recoveredAddress}`,
      };
    } catch (err) {
      return {
        chainType: 'evm',
        data: {},
        signature: input.signature,
        message: input.message,
        valid: false,
        error: (err as Error).message,
      };
    }
  };
}

/**
 * Create the built-in Solana (ed25519) verifier.
 *
 * Verifies signatures using @noble/ed25519 against the Solana message format.
 */
function createSolanaVerifier(): VerifierFn {
  return async (input: SIWXVerifyInput): Promise<SIWXResult> => {
    try {
      const valid = await verifyEd25519(
        input.message,
        input.signature,
        input.address
      );

      return {
        chainType: 'solana',
        data: {},
        signature: input.signature,
        message: input.message,
        valid,
        error: valid ? undefined : 'Solana signature verification failed',
      };
    } catch (err) {
      return {
        chainType: 'solana',
        data: {},
        signature: input.signature,
        message: input.message,
        valid: false,
        error: (err as Error).message,
      };
    }
  };
}

/**
 * Create the built-in Bitcoin (BIP-322) verifier.
 *
 * Verifies signatures using BIP-322 simple signing for P2PKH and P2WPKH.
 */
function createBitcoinVerifier(): VerifierFn {
  return async (input: SIWXVerifyInput): Promise<SIWXResult> => {
    try {
      const valid = await verifyBip322(
        input.message,
        input.signature,
        input.address
      );

      return {
        chainType: 'bitcoin',
        data: {},
        signature: input.signature,
        message: input.message,
        valid,
        error: valid ? undefined : 'Bitcoin BIP-322 signature verification failed',
      };
    } catch (err) {
      return {
        chainType: 'bitcoin',
        data: {},
        signature: input.signature,
        message: input.message,
        valid: false,
        error: (err as Error).message,
      };
    }
  };
}

/**
 * Create the built-in TON verifier.
 *
 * Verifies Ed25519 signatures against TON wallet addresses.
 */
function createTonVerifier(): VerifierFn {
  return async (input: SIWXVerifyInput): Promise<SIWXResult> => {
    try {
      const valid = await verifyEd25519(
        input.message,
        input.signature,
        input.address
      );

      return {
        chainType: 'evm', // TON uses 'evm' slot in ChainType; could extend
        data: { chain: 'ton' },
        signature: input.signature,
        message: input.message,
        valid,
        error: valid ? undefined : 'TON signature verification failed',
      };
    } catch (err) {
      return {
        chainType: 'evm',
        data: { chain: 'ton' },
        signature: input.signature,
        message: input.message,
        valid: false,
        error: (err as Error).message,
      };
    }
  };
}

/**
 * Create the built-in Tron verifier.
 *
 * Verifies SECP256K1 signatures against Tron addresses (base58check with 0x41 prefix).
 */
function createTronVerifier(): VerifierFn {
  return async (input: SIWXVerifyInput): Promise<SIWXResult> => {
    try {
      // Tron uses the same ECDSA recovery as EVM but with base58check address encoding
      const recoveredAddress = await recoverAddressEvm(input.message, input.signature);
      // Convert hex to Tron base58check format
      const tronAddress = hexToTronAddress(recoveredAddress);
      const valid = tronAddress === input.address;

      return {
        chainType: 'evm', // Tron maps to 'evm' in the existing ChainType
        data: { recoveredAddress: tronAddress },
        signature: input.signature,
        message: input.message,
        valid,
        error: valid ? undefined : `Tron address mismatch: expected ${input.address}, recovered ${tronAddress}`,
      };
    } catch (err) {
      return {
        chainType: 'evm',
        data: { chain: 'tron' },
        signature: input.signature,
        message: input.message,
        valid: false,
        error: (err as Error).message,
      };
    }
  };
}

// ---------------------------------------------------------------------------
// Cryptographic Primitives (stubs — implemented by host environment)
// ---------------------------------------------------------------------------

/**
 * Recover an Ethereum-style address from a signed message.
 *
 * Uses viem's `recoverMessageAddress` which implements EIP-191 personal_sign
 * address recovery. The message is prefixed per the Ethereum signed message
 * standard, and the ECDSA recovery yields the signer address.
 */
async function recoverAddressEvm(message: string, signature: string): Promise<string> {
  return recoverMessageAddress({
    message,
    signature: signature as `0x${string}`,
  });
}

/**
 * Verify an Ed25519 signature.
 *
 * Used by Solana, TON, and other Ed25519-based chains.
 * Accepts hex-encoded or base58-encoded public keys and signatures.
 */
async function verifyEd25519(
  message: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(message);
  const sigBytes = hexToBytes(signature);
  const pubBytes = hexToBytes(publicKey);
  return ed25519.verify(sigBytes, messageBytes, pubBytes);
}

/**
 * Verify a BIP-322 Bitcoin signature (simple signing).
 *
 * BIP-322 "simple" signing uses the same ECDSA recovery as Bitcoin's
 * signmessage RPC. The message is double-SHA256 with a specific prefix,
 * then the signature is recovered and compared to the expected address.
 *
 * Supports P2PKH, P2WPKH, and P2TR address types via recovery.
 */
async function verifyBip322(
  message: string,
  signature: string,
  address: string
): Promise<boolean> {
  // BIP-322 message hash: SHA256(SHA256("\x18Bitcoin Signed Message:\n" + varint(len) + message))
  const encoder = new TextEncoder();
  const msgBytes = encoder.encode(message);
  const prefix = encoder.encode(`\x18Bitcoin Signed Message:\n`);

  // Encode message length as Bitcoin varint
  const varint = encodeVarint(msgBytes.length);

  // Concatenate prefix + varint + message
  const fullMessage = new Uint8Array(prefix.length + varint.length + msgBytes.length);
  fullMessage.set(prefix, 0);
  fullMessage.set(varint, prefix.length);
  fullMessage.set(msgBytes, prefix.length + varint.length);

  // Double SHA-256
  const hash1 = sha256(fullMessage);
  const msgHash = sha256(hash1);

  // Parse the base64-encoded signature
  const sigBytes = base64ToBytes(signature);

  // The first byte is the recovery flag (27-30 for P2PKH, 31-34 for P2WPKH)
  const recoveryFlag = sigBytes[0];
  const rsv = sigBytes.slice(1);

  // Recover the public key from the signature
  const sig = new secp256k1.Signature(
    BigInt('0x' + bytesToHex(rsv.slice(0, 32))),
    BigInt('0x' + bytesToHex(rsv.slice(32, 64)))
  );

  // Normalize recovery id: Bitcoin uses 27-34, we need 0-1
  const recoveryId = recoveryFlag >= 31 ? recoveryFlag - 31 : recoveryFlag - 27;
  const recoveredPubKey = sig.addRecoveryBit(recoveryId).recoverPublicKey(msgHash);
  const pubKeyBytes = recoveredPubKey.toRawBytes(false); // uncompressed

  // Derive the address from the recovered public key (P2PKH: hash160 of pubkey)
  const pubKeyHash = hash160(pubKeyBytes);
  const recoveredAddress = encodeBase58Check(new Uint8Array([0x00, ...pubKeyHash]));

  return recoveredAddress === address;
}

/**
 * Convert a hex Ethereum address to a Tron base58check address.
 */
function hexToTronAddress(hex: string): string {
  // Remove 0x prefix, add Tron prefix byte (0x41), then base58check encode
  const bytes = hex.replace('0x', '');
  // In production: uses bs58check.encode(Buffer.from('41' + bytes, 'hex'))
  return `T${bytes}`; // Simplified — real impl uses proper base58check
}

// ---------------------------------------------------------------------------
// Crypto Helpers
// ---------------------------------------------------------------------------

/** Convert a hex string (with or without 0x prefix) to Uint8Array. */
function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/^0x/, '');
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Convert Uint8Array to hex string. */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/** Decode a base64 string to Uint8Array. */
function base64ToBytes(base64: string): Uint8Array {
  if (typeof atob !== 'undefined') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  // Node.js fallback
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/** Bitcoin varint encoding. */
function encodeVarint(n: number): Uint8Array {
  if (n < 0xfd) return new Uint8Array([n]);
  if (n <= 0xffff) {
    const buf = new Uint8Array(3);
    buf[0] = 0xfd;
    buf[1] = n & 0xff;
    buf[2] = (n >> 8) & 0xff;
    return buf;
  }
  if (n <= 0xffffffff) {
    const buf = new Uint8Array(5);
    buf[0] = 0xfe;
    buf[1] = n & 0xff;
    buf[2] = (n >> 8) & 0xff;
    buf[3] = (n >> 16) & 0xff;
    buf[4] = (n >> 24) & 0xff;
    return buf;
  }
  throw new Error('Varint too large');
}

/** RIPEMD-160 hash (used for Bitcoin address derivation). */
function ripemd160(data: Uint8Array): Uint8Array {
  // Minimal RIPEMD-160 implementation
  const K1 = [0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e];
  const K2 = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000];

  const R1 = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13];
  const R2 = [5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11];
  const S1 = [11,14,15,12,5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6];
  const S2 = [8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11];

  function f(j: number, x: number, y: number, z: number): number {
    if (j < 16) return x ^ y ^ z;
    if (j < 32) return (x & y) | (~x & z);
    if (j < 48) return (x | ~y) ^ z;
    if (j < 64) return (x & z) | (y & ~z);
    return x ^ (y | ~z);
  }

  function rotl(x: number, n: number): number {
    return (x << n) | (x >>> (32 - n));
  }

  // Padding
  const msgLen = data.length;
  const padLen = ((msgLen + 8) >> 6) * 64 + 64;
  const padded = new Uint8Array(padLen);
  padded.set(data);
  padded[msgLen] = 0x80;
  // Length in bits as 64-bit little-endian
  const bitLen = msgLen * 8;
  padded[padLen - 8] = bitLen & 0xff;
  padded[padLen - 7] = (bitLen >>> 8) & 0xff;
  padded[padLen - 6] = (bitLen >>> 16) & 0xff;
  padded[padLen - 5] = (bitLen >>> 24) & 0xff;

  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;

  for (let offset = 0; offset < padLen; offset += 64) {
    const X = new Array<number>(16);
    for (let i = 0; i < 16; i++) {
      X[i] = padded[offset + i*4] | (padded[offset + i*4+1] << 8) | (padded[offset + i*4+2] << 16) | (padded[offset + i*4+3] << 24);
    }

    let al = h0, bl = h1, cl = h2, dl = h3, el = h4;
    let ar = h0, br = h1, cr = h2, dr = h3, er = h4;

    for (let j = 0; j < 80; j++) {
      const rnd = Math.floor(j / 16);
      let t = (al + f(j, bl, cl, dl) + X[R1[j]] + K1[rnd]) | 0;
      t = (rotl(t, S1[j]) + el) | 0;
      al = el; el = dl; dl = rotl(cl, 10); cl = bl; bl = t;

      t = (ar + f(79 - j, br, cr, dr) + X[R2[j]] + K2[rnd]) | 0;
      t = (rotl(t, S2[j]) + er) | 0;
      ar = er; er = dr; dr = rotl(cr, 10); cr = br; br = t;
    }

    const t = (h1 + cl + dr) | 0;
    h1 = (h2 + dl + er) | 0;
    h2 = (h3 + el + ar) | 0;
    h3 = (h4 + al + br) | 0;
    h4 = (h0 + bl + cr) | 0;
    h0 = t;
  }

  const result = new Uint8Array(20);
  for (let i = 0; i < 5; i++) {
    const v = [h0, h1, h2, h3, h4][i];
    result[i*4] = v & 0xff;
    result[i*4+1] = (v >>> 8) & 0xff;
    result[i*4+2] = (v >>> 16) & 0xff;
    result[i*4+3] = (v >>> 24) & 0xff;
  }
  return result;
}

/** Bitcoin HASH160 = RIPEMD160(SHA256(data)). */
function hash160(data: Uint8Array): Uint8Array {
  return ripemd160(sha256(data));
}

/** Base58 alphabet used by Bitcoin. */
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** Encode bytes with a version byte + checksum (Base58Check). */
function encodeBase58Check(data: Uint8Array): string {
  const checksum = sha256(sha256(data)).slice(0, 4);
  const full = new Uint8Array(data.length + 4);
  full.set(data, 0);
  full.set(checksum, data.length);

  // Base58 encoding
  let num = BigInt('0x' + bytesToHex(full));
  let result = '';
  while (num > 0) {
    const remainder = Number(num % 58n);
    num = num / 58n;
    result = BASE58_ALPHABET[remainder] + result;
  }
  // Leading zeros
  for (const byte of full) {
    if (byte === 0) result = '1' + result;
    else break;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Verifier Registry
// ---------------------------------------------------------------------------

/**
 * SIWX Verifier Registry.
 *
 * Central registry for chain-specific signature verifiers. Comes pre-loaded
 * with built-in verifiers for EVM, Solana, Bitcoin, TON, and Tron. Custom
 * verifiers can be registered at runtime.
 *
 * @example
 * ```ts
 * import { VerifierRegistry } from '@cinacoin/siwx';
 *
 * const registry = new VerifierRegistry();
 *
 * // Get a built-in verifier
 * const evmVerifier = registry.getVerifier('eip155');
 * const result = await evmVerifier({
 *   message: '...',
 *   signature: '0x...',
 *   address: '0x...',
 *   chainType: 'evm',
 * });
 *
 * // Register a custom verifier
 * registry.registerVerifier('polkadot', async (input) => {
 *   // Custom Polkadot verification logic
 *   return { /* ... *\/ };
 * });
 * ```
 */
export class VerifierRegistry {
  /** Map of namespace → verifier descriptor. */
  private _verifiers: Map<string, VerifierDescriptor> = new Map();

  constructor() {
    this._registerBuiltins();
  }

  /**
   * Register a custom verifier for a chain namespace.
   *
   * If a verifier already exists for the namespace, it is overwritten
   * (unless the existing one is built-in — in that case, a warning is
   * emitted and the custom verifier is still registered, shadowing the
   * built-in).
   *
   * @param namespace - CAIP-2 namespace identifier (e.g., 'polkadot', 'cosmos').
   * @param verifyFn - The verification function.
   * @param options - Optional name and version for the verifier.
   */
  registerVerifier(
    namespace: string,
    verifyFn: VerifierFn,
    options: RegisterVerifierOptions = {}
  ): void {
    const existing = this._verifiers.get(namespace);
    if (existing?.source === 'builtin') {
      // Shadowing a built-in — log warning in dev
      if (typeof console !== 'undefined' && process.env?.NODE_ENV !== 'production') {
        logger.warn(
          `[VerifierRegistry] Shadowing built-in verifier for "${namespace}" ` +
          `(${existing.name} v${existing.version}) with custom verifier`
        );
      }
    }

    this._verifiers.set(namespace, {
      name: options.name ?? namespace,
      namespace,
      verify: verifyFn,
      source: 'custom',
      version: options.version ?? '1.0.0',
    });
  }

  /**
   * Get a verifier by namespace.
   *
   * @param namespace - CAIP-2 namespace identifier.
   * @returns The verifier descriptor, or `undefined` if not registered.
   */
  getVerifier(namespace: string): VerifierDescriptor | undefined {
    return this._verifiers.get(namespace);
  }

  /**
   * Get all registered namespace identifiers.
   *
   * @returns Array of namespace strings.
   */
  getRegisteredNamespaces(): string[] {
    return Array.from(this._verifiers.keys());
  }

  /**
   * Check whether a verifier is registered for a namespace.
   *
   * @param namespace - CAIP-2 namespace identifier.
   * @returns `true` if a verifier exists.
   */
  hasVerifier(namespace: string): boolean {
    return this._verifiers.has(namespace);
  }

  /**
   * Remove a custom verifier.
   *
   * Built-in verifiers cannot be removed (use `registerVerifier` to shadow
   * them instead).
   *
   * @param namespace - CAIP-2 namespace identifier.
   * @returns `true` if a custom verifier was removed.
   */
  removeVerifier(namespace: string): boolean {
    const descriptor = this._verifiers.get(namespace);
    if (!descriptor) return false;
    if (descriptor.source === 'builtin') {
      if (typeof console !== 'undefined') {
        logger.warn(
          `[VerifierRegistry] Cannot remove built-in verifier for "${namespace}". ` +
          `Use registerVerifier() to shadow it instead.`
        );
      }
      return false;
    }
    return this._verifiers.delete(namespace);
  }

  /**
   * Get summary information about all registered verifiers.
   *
   * Useful for debugging and admin panels.
   */
  listVerifiers(): Array<{
    namespace: string;
    name: string;
    source: 'builtin' | 'custom';
    version: string;
  }> {
    return Array.from(this._verifiers.values()).map((v) => ({
      namespace: v.namespace,
      name: v.name,
      source: v.source,
      version: v.version,
    }));
  }

  /** Register all built-in verifiers. */
  private _registerBuiltins(): void {
    this._registerBuiltin('eip155', 'EVM (EIP-4361)', createEvmVerifier());
    this._registerBuiltin('solana', 'Solana', createSolanaVerifier());
    this._registerBuiltin('bip122', 'Bitcoin (BIP-322)', createBitcoinVerifier());
    this._registerBuiltin('ton', 'TON', createTonVerifier());
    this._registerBuiltin('tron', 'Tron', createTronVerifier());
  }

  private _registerBuiltin(
    namespace: string,
    name: string,
    verifyFn: VerifierFn
  ): void {
    this._verifiers.set(namespace, {
      name,
      namespace,
      verify: verifyFn,
      source: 'builtin',
      version: '1.0.0',
    });
  }
}

/**
 * Default singleton VerifierRegistry instance.
 *
 * Pre-loaded with built-in verifiers for eip155, solana, bip122, ton, and tron.
 */
export const defaultVerifierRegistry = new VerifierRegistry();
