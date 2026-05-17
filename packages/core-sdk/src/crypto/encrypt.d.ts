/**
 * ChaCha20-Poly1305 AEAD encryption/decryption.
 *
 * Implements the encryption scheme used by WalletConnect v2:
 * - Cipher: ChaCha20-Poly1305 (IETF variant, RFC 8439)
 * - Nonce: 12 bytes (96 bits)
 * - Key: 32 bytes (256 bits) from X25519 shared secret
 *
 * Output format: base64(nonce || ciphertext || tag)
 */
/**
 * Encrypt plaintext using ChaCha20-Poly1305.
 *
 * @param key - 32-byte shared secret (from X25519 DH).
 * @param plaintext - Data to encrypt.
 * @param nonce - 12-byte nonce. If not provided, a random nonce is generated.
 * @returns Base64-encoded encrypted data (nonce || ciphertext || tag).
 */
export declare function encrypt(key: Uint8Array, plaintext: Uint8Array, nonce?: Uint8Array): string;
/**
 * Decrypt ChaCha20-Poly1305 encrypted data.
 *
 * @param key - 32-byte shared secret (from X25519 DH).
 * @param encryptedBase64 - Base64-encoded (nonce || ciphertext || tag).
 * @returns Decrypted plaintext.
 */
export declare function decrypt(key: Uint8Array, encryptedBase64: string): Uint8Array;
/**
 * Generate a random 12-byte nonce for ChaCha20-Poly1305.
 *
 * @returns 12-byte random nonce.
 */
export declare function generateNonce(): Uint8Array;
/**
 * Derive a symmetric encryption key from two public keys.
 * Uses SHA-256 hash of the concatenated public keys.
 *
 * @param publicKeyA - First public key (32 bytes).
 * @param publicKeyB - Second public key (32 bytes).
 * @returns 32-byte symmetric key.
 */
export declare function deriveSymmetricKey(publicKeyA: Uint8Array, publicKeyB: Uint8Array): Uint8Array;
/**
 * Derive a topic identifier from two public keys.
 *
 * @param publicKeyA - First public key.
 * @param publicKeyB - Second public key.
 * @returns 64-character hex string (32 bytes).
 */
export declare function deriveTopic(publicKeyA: Uint8Array, publicKeyB: Uint8Array): string;
//# sourceMappingURL=encrypt.d.ts.map