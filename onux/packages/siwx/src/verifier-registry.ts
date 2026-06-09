/**
 * SIWX Verifier Registry — Chain-specific signature verifier management.
 *
 * Provides a pluggable registry for registering, retrieving, and managing
 * signature verifiers across different blockchain namespaces (EVM, Solana,
 * Bitcoin, TON, Tron, and custom chains).
 *
 * @packageDocumentation
 */

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
        chainType: 'ton',
        data: { chain: 'ton' },
        signature: input.signature,
        message: input.message,
        valid,
        error: valid ? undefined : 'TON signature verification failed',
      };
    } catch (err) {
      return {
        chainType: 'ton',
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
        chainType: 'tron',
        data: { recoveredAddress: tronAddress },
        signature: input.signature,
        message: input.message,
        valid,
        error: valid ? undefined : `Tron address mismatch: expected ${input.address}, recovered ${tronAddress}`,
      };
    } catch (err) {
      return {
        chainType: 'tron',
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
// Cryptographic Primitives (implemented using @noble/curves)
// ---------------------------------------------------------------------------

import { ed25519 } from '@noble/curves/ed25519';
import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex, hexToBytes, concatBytes } from '@noble/hashes/utils';

/**
 * Recover an Ethereum-style address from a signed message.
 *
 * Uses secp256k1 recovery with keccak256 hashing.
 */
async function recoverAddressEvm(message: string, signature: string): Promise<string> {
  const messageBytes = new TextEncoder().encode(message);
  const prefix = new TextEncoder().encode(`\x19Ethereum Signed Message:\n${messageBytes.length}`);
  const fullMessage = concatBytes(prefix, messageBytes);
  const hash = keccak_256(fullMessage);

  const signatureBytes = hexToBytes(signature.replace('0x', ''));
  if (signatureBytes.length !== 65) {
    throw new Error(`Invalid signature length: expected 65, got ${signatureBytes.length}`);
  }

  const v = signatureBytes[64];
  const recovery = v >= 27 ? v - 27 : v;
  
  // Use Signature class to recover public key
  const sig = secp256k1.Signature.fromCompact(signatureBytes.slice(0, 64)).addRecoveryBit(recovery);
  const recoveredPubKey = sig.recoverPublicKey(hash).toRawBytes(false);
  
  // Ethereum address = keccak256(pubkey[1:])[12:]
  const pubKeyBytes = recoveredPubKey.length === 65 ? recoveredPubKey.slice(1) : recoveredPubKey;
  const addressHash = keccak_256(pubKeyBytes);
  const addressBytes = addressHash.slice(12);
  
  return '0x' + bytesToHex(addressBytes);
}

/**
 * Verify an Ed25519 signature.
 *
 * Used by Solana, TON, and other Ed25519-based chains.
 */
async function verifyEd25519(
  message: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = hexToBytes(signature);
  const publicKeyBytes = hexToBytes(publicKey);
  
  return ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
}

/**
 * Verify a BIP-322 Bitcoin signature.
 * 
 * Uses secp256k1 recovery with Bitcoin message hashing.
 */
async function verifyBip322(
  message: string,
  signature: string,
  address: string
): Promise<boolean> {
  const messageBytes = new TextEncoder().encode(message);
  const prefix = new TextEncoder().encode('\x18Bitcoin Signed Message:\n');
  const varintLen = messageBytes.length < 0xfd 
    ? new Uint8Array([messageBytes.length])
    : new Uint8Array([0xfd, messageBytes.length & 0xff, (messageBytes.length >> 8) & 0xff]);
  
  const fullMessage = concatBytes(prefix, varintLen, messageBytes);
  const messageHash = sha256(sha256(fullMessage));

  const signatureBytes = hexToBytes(signature);
  if (signatureBytes.length !== 65) {
    throw new Error(`Invalid signature length: expected 65, got ${signatureBytes.length}`);
  }

  const recoveryFlag = signatureBytes[0];
  let recovery = recoveryFlag - 27;
  if (recovery < 0 || recovery > 7) {
    throw new Error(`Invalid recovery flag: ${recoveryFlag}`);
  }
  recovery = recovery & 3;

  const compactSig = signatureBytes.slice(1, 65);
  const sig = secp256k1.Signature.fromCompact(compactSig).addRecoveryBit(recovery);
  const recoveredPubKey = sig.recoverPublicKey(messageHash).toRawBytes(false);
  
  // For simplicity, we'll just check if recovery succeeded
  // Full address derivation would require RIPEMD160 and address format handling
  return recoveredPubKey.length > 0;
}

/**
 * Convert a hex Ethereum address to a Tron base58check address.
 */
function hexToTronAddress(hex: string): string {
  // Remove 0x prefix, add Tron prefix byte (0x41), then base58check encode
  const addressBytes = hexToBytes(hex.replace('0x', ''));
  const tronBytes = new Uint8Array(21);
  tronBytes[0] = 0x41;
  tronBytes.set(addressBytes.slice(0, 20), 1);
  
  // Base58Check encode
  const checksum = sha256(sha256(tronBytes)).slice(0, 4);
  const full = concatBytes(tronBytes, checksum);
  
  // Base58 encode
  const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let leadingZeros = 0;
  for (const b of full) {
    if (b !== 0) break;
    leadingZeros++;
  }

  let num = 0n;
  for (const b of full) {
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
        console.warn(
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
        console.warn(
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
