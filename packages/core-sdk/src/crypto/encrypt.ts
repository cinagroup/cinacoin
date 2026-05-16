/**
 * ChaCha20-Poly1305 encryption/decryption using the Web Crypto API.
 *
 * Implements the AEAD construction used by WalletConnect v2:
 * - Cipher: ChaCha20-Poly1305 (IETF variant, RFC 8439)
 * - Nonce: 12 bytes (96 bits)
 * - Key: 32 bytes (256 bits) from X25519 shared secret
 *
 * Output format: base64(nonce || ciphertext || tag)
 *
 * Note: The Web Crypto API doesn't natively support ChaCha20-Poly1305.
 * For production, use a library like @noble/ciphers or tweetnacl.
 */

/**
 * Encrypt plaintext using ChaCha20-Poly1305.
 *
 * @param key - 32-byte shared secret (from X25519 DH).
 * @param plaintext - Data to encrypt.
 * @returns Base64-encoded encrypted data (nonce || ciphertext || tag).
 */
export async function encrypt(
  key: Uint8Array,
  plaintext: Uint8Array,
): Promise<string> {
  // Web Crypto doesn't support ChaCha20-Poly1305 natively.
  // For production, use: import { chacha20poly1305 } from '@noble/ciphers/chacha'
  //
  // This implementation uses AES-GCM as a fallback with a clear warning.
  console.warn(
    '[OnChainUX] ChaCha20-Poly1305 requires @noble/ciphers. Using AES-GCM fallback.',
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    plaintext.buffer as ArrayBuffer,
  );

  // Combine nonce + ciphertext (AES-GCM includes the tag)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt ChaCha20-Poly1305 encrypted data.
 *
 * @param key - 32-byte shared secret (from X25519 DH).
 * @param encryptedBase64 - Base64-encoded (nonce || ciphertext || tag).
 * @returns Decrypted plaintext.
 */
export async function decrypt(
  key: Uint8Array,
  encryptedBase64: string,
): Promise<Uint8Array> {
  const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));

  if (combined.length < 12) {
    throw new Error('Encrypted data too short (missing nonce)');
  }

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ciphertext.buffer as ArrayBuffer,
  );

  return new Uint8Array(plaintext);
}

/**
 * Derive a symmetric encryption key from two public keys.
 * Uses SHA-256 hash of the concatenated public keys.
 *
 * @param publicKeyA - First public key (32 bytes).
 * @param publicKeyB - Second public key (32 bytes).
 * @returns 32-byte symmetric key.
 */
export async function deriveSymmetricKey(
  publicKeyA: Uint8Array,
  publicKeyB: Uint8Array,
): Promise<Uint8Array> {
  const combined = new Uint8Array(publicKeyA.length + publicKeyB.length);
  combined.set(publicKeyA);
  combined.set(publicKeyB);

  const hash = await crypto.subtle.digest('SHA-256', combined);
  return new Uint8Array(hash);
}

/**
 * Derive a topic identifier from two public keys.
 *
 * @param publicKeyA - First public key.
 * @param publicKeyB - Second public key.
 * @returns 64-character hex string (32 bytes).
 */
export async function deriveTopic(
  publicKeyA: Uint8Array,
  publicKeyB: Uint8Array,
): Promise<string> {
  const key = await deriveSymmetricKey(publicKeyA, publicKeyB);
  return Array.from(key, (b) => b.toString(16).padStart(2, '0')).join('');
}
