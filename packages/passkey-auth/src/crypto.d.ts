export { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import type { CryptoKeypair } from './types.js';
/**
 * Generate a P-256 keypair for passkey operations.
 */
export declare function generateKeypair(): CryptoKeypair;
/**
 * Create a cryptographic challenge for WebAuthn registration/authentication.
 */
export declare function generateChallenge(length?: number): Uint8Array;
/**
 * Encode a challenge to base64url for WebAuthn.
 */
export declare function encodeChallenge(challenge: Uint8Array): string;
/**
 * Decode a base64url challenge back to Uint8Array.
 */
export declare function decodeChallenge(challengeBase64: string): Uint8Array;
/**
 * Sign data with a P-256 private key.
 */
export declare function signData(privateKeyHex: string, data: Uint8Array): Uint8Array;
/**
 * Verify a signature against a P-256 public key.
 */
export declare function verifySignature(publicKeyHex: string, data: Uint8Array, signatureHex: string): boolean;
/**
 * Hash a public key to derive an Ethereum-style address.
 * Returns last 20 bytes of keccak-256 equivalent (sha256 for P-256).
 */
export declare function deriveAddress(publicKeyHex: string): string;
/**
 * Compress a public key to its compressed form (33 bytes).
 */
export declare function compressPublicKey(publicKeyHex: string): string;
//# sourceMappingURL=crypto.d.ts.map