/**
 * X25519 keypair generation and Diffie-Hellman key exchange.
 *
 * Uses @noble/curves for real X25519 (Curve25519) operations,
 * compatible with WalletConnect v2.
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
 * Generate a new X25519 keypair using a cryptographically secure RNG.
 *
 * @returns A new keypair with 32-byte public and private keys.
 */
export declare function generateKeypair(): X25519Keypair;
/**
 * Perform X25519 Diffie-Hellman key exchange.
 *
 * @param privateKey - Our private key (32 bytes).
 * @param peerPublicKey - Peer's public key (32 bytes).
 * @returns 32-byte shared secret.
 */
export declare function sharedSecret(privateKey: Uint8Array, peerPublicKey: Uint8Array): Uint8Array;
/**
 * Serialize a keypair to hex strings.
 */
export declare function serializeKeypair(keypair: X25519Keypair): {
    publicKey: string;
    privateKey: string;
};
/**
 * Deserialize a keypair from hex strings.
 */
export declare function deserializeKeypair(hex: {
    publicKey: string;
    privateKey: string;
}): X25519Keypair;
/** Convert bytes to hex string. */
export declare function bytesToHex(bytes: Uint8Array): string;
/** Convert hex string to bytes. */
export declare function hexToBytes(hex: string): Uint8Array;
//# sourceMappingURL=keypair.d.ts.map