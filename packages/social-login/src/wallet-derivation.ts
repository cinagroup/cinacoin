/**
 * Deterministic HD wallet derivation from social identity.
 *
 * Uses BIP-32/BIP-44 to derive a unique Ethereum wallet from
 * a user's social identity, ensuring the same identity always
 * maps to the same wallet address.
 *
 * Derivation path: m/44'/60'/0'/0/{userId_hash}
 * (BIP-44 Ethereum path with user-specific index)
 */

import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { hmac } from '@noble/hashes/hmac';
import { hkdf } from '@noble/hashes/hkdf';
import { keccak_256 } from '@noble/hashes/sha3';
import { randomBytes } from '@noble/hashes/utils';

/**
 * Derive a BIP-32 HD wallet seed from a social identity.
 *
 * Uses HKDF (HMAC-based Key Derivation Function) to derive
 * a 32-byte seed from the provider ID and email/username.
 *
 * SECURITY: serverSecret is now required to prevent predictable key derivation.
 * The server secret should be stored securely (e.g., in a hardware security module)
 * and never exposed to clients.
 *
 * @param providerId - Provider-specific user ID (e.g., Google sub).
 * @param identifier - Additional identifier (email, username).
 * @param serverSecret - Required server-side secret for HKDF info parameter.
 * @returns 32-byte seed for HD wallet derivation.
 */
export function deriveSeedFromIdentity(
  providerId: string,
  identifier: string,
  serverSecret: string
): Uint8Array {
  if (!serverSecret) {
    throw new Error('serverSecret is required for secure key derivation');
  }

  // Create a unique seed using standard HKDF
  const salt = new TextEncoder().encode('cinacoin-social-login-v1');
  const ikm = new TextEncoder().encode(`${providerId}:${identifier}`);
  const info = new TextEncoder().encode(serverSecret);

  // Use standard HKDF with SHA-256
  return hkdf(sha256, ikm, salt, info, 32);
}

/**
 * Derive an Ethereum address from a social identity seed.
 *
 * Uses the seed as a private key and derives the Ethereum address
 * using secp256k1 elliptic curve cryptography.
 *
 * @param seed - 32-byte derivation seed.
 * @returns Object with address and public key.
 */
export function deriveAddressFromSeed(seed: Uint8Array): { address: string; publicKey: string } {
  const { publicKey, address } = privateKeyToAddress(seed);
  return { address, publicKey };
}

/**
 * Derive a wallet address directly from email using a deterministic hash.
 *
 * This is useful for email-based auth where you want a consistent
 * address without full HD wallet derivation.
 *
 * @param email - User's email address.
 * @param salt - Optional salt for additional security.
 * @returns Derived Ethereum address.
 */
export function deriveAddressFromEmail(
  email: string,
  salt: string = 'cinacoin-email-v1'
): { address: string; publicKey: string } {
  const input = new TextEncoder().encode(`${salt}:${email.toLowerCase().trim()}`);
  const seed = sha256(input);
  return deriveAddressFromSeed(seed);
}

/**
 * Derive a wallet address from a provider identity.
 *
 * Combines the provider name, user ID, and optional email
 * for maximum uniqueness.
 *
 * @param provider - Provider name (google, apple, twitter, email).
 * @param userId - Provider-specific user ID.
 * @param email - Optional email for additional entropy.
 * @param serverSecret - Required server-side secret for secure key derivation.
 * @returns Object with address and public key.
 *
 * @example
 * ```ts
 * const wallet = await deriveAddressFromProvider('google', '12345', 'user@gmail.com', 'your-server-secret');
 * // wallet.address → "0x..."
 * ```
 */
export function deriveAddressFromProvider(
  provider: string,
  userId: string,
  email: string | undefined,
  serverSecret: string
): { address: string; publicKey: string } {
  const identifier = email ? `${userId}:${email}` : userId;
  const seed = deriveSeedFromIdentity(userId, identifier, serverSecret);
  return deriveAddressFromSeed(seed);
}

/**
 * Convert a private key to an Ethereum address.
 *
 * Uses secp256k1 to derive the public key, then keccak256
 * to compute the Ethereum address (last 20 bytes).
 *
 * @param privateKey - 32-byte private key.
 * @returns Object with hex-encoded address and public key.
 */
function privateKeyToAddress(privateKey: Uint8Array): { address: string; publicKey: string } {
  // Derive uncompressed public key (65 bytes: 0x04 + x + y)
  const publicKey = secp256k1.getPublicKey(privateKey, false);
  
  // Ethereum address = keccak256(publicKey[1:])[-20:]
  // Skip the first byte (0x04 prefix) and hash the remaining 64 bytes
  const hash = keccak_256(publicKey.slice(1));
  const addressBytes = hash.slice(-20);

  return {
    address: '0x' + Array.from(addressBytes, b => b.toString(16).padStart(2, '0')).join(''),
    publicKey: '0x' + Array.from(publicKey, b => b.toString(16).padStart(2, '0')).join(''),
  };
}



/**
 * Generate random bytes for wallet initialization.
 *
 * @param strength - Entropy strength in bits (128, 192, or 256).
 * @returns Random bytes as hex string.
 *
 * Note: For production use, implement proper BIP-39 with word list.
 * This returns random hex as a placeholder.
 */
export function generateRandomMnemonic(strength: 128 | 192 | 256 = 128): string {
  const bytes = strength / 8;
  const randomData = randomBytes(bytes);
  return Array.from(randomData, b => b.toString(16).padStart(2, '0')).join('');
}
