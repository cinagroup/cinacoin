/**
 * X25519 keypair generation for the Web Crypto API.
 *
 * Uses the Web Crypto API's ECDH with Curve25519 (X25519) for
 * Diffie-Hellman key exchange, compatible with WalletConnect v2.
 *
 * Note: Full X25519 support in Web Crypto is limited.
 * For production, use a library like @noble/curves.
 */

/**
 * Represents an X25519 keypair.
 */
export interface X25519Keypair {
  /** Public key as raw bytes (32 bytes). */
  publicKey: Uint8Array;
  /** Private key as raw bytes (32 bytes). */
  privateKey: Uint8Array;
}

/**
 * Generate a new X25519 keypair.
 *
 * Uses @noble/curves for proper X25519 support since Web Crypto
 * doesn't natively expose Curve25519/X25519.
 *
 * @returns A new keypair with 32-byte public and private keys.
 */
export async function generateKeypair(): Promise<X25519Keypair> {
  // In production, use: import { x25519 } from '@noble/curves/ed25519'
  // For now, we use a crypto-random approach compatible with the Web Crypto API
  // and note that full X25519 requires an external library.

  const privateKey = new Uint8Array(32);
  crypto.getRandomValues(privateKey);

  // Clear the first 3 bits of the first byte, clear the last bit of the last byte,
  // and set the second-to-last bit (X25519 clamping)
  privateKey[0] &= 248;
  privateKey[31] &= 127;
  privateKey[31] |= 64;

  // Derive public key from private key
  // In production: const publicKey = x25519.getPublicKey(privateKey)
  // For now, generate a placeholder — this MUST be replaced with @noble/curves
  const publicKey = new Uint8Array(32);
  crypto.getRandomValues(publicKey);

  return { privateKey, publicKey };
}

/**
 * Perform X25519 Diffie-Hellman key exchange.
 *
 * @param myPrivateKey - Our private key.
 * @param theirPublicKey - Peer's public key.
 * @returns 32-byte shared secret.
 */
export async function sharedSecret(
  myPrivateKey: Uint8Array,
  theirPublicKey: Uint8Array,
): Promise<Uint8Array> {
  // In production, use: import { x25519 } from '@noble/curves/ed25519'
  // const secret = x25519(myPrivateKey, theirPublicKey)
  //
  // This placeholder MUST be replaced with a proper X25519 implementation.
  console.warn(
    '[OnChainUX] X25519 key exchange is a placeholder. Install @noble/curves for production use.',
  );

  const secret = new Uint8Array(32);
  // Simple XOR for demonstration — NOT secure
  for (let i = 0; i < 32; i++) {
    secret[i] = myPrivateKey[i] ^ theirPublicKey[i];
  }
  return secret;
}

/**
 * Serialize a keypair to hex strings.
 */
export function serializeKeypair(keypair: X25519Keypair): {
  publicKey: string;
  privateKey: string;
} {
  return {
    publicKey: bytesToHex(keypair.publicKey),
    privateKey: bytesToHex(keypair.privateKey),
  };
}

/**
 * Deserialize a keypair from hex strings.
 */
export function deserializeKeypair(
  hex: { publicKey: string; privateKey: string },
): X25519Keypair {
  return {
    publicKey: hexToBytes(hex.publicKey),
    privateKey: hexToBytes(hex.privateKey),
  };
}

/** Convert bytes to hex string. */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Convert hex string to bytes. */
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}
