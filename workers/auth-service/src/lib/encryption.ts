/**
 * AES-256-GCM encryption utilities for sensitive data at rest.
 * Uses Web Crypto API (available in Cloudflare Workers).
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * Derive a CryptoKey from a base64-encoded secret.
 * The secret should be stored in wrangler secret (env.ENCRYPTION_KEY).
 */
async function getCryptoKey(secretBase64: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(secretBase64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns base64-encoded string: iv + ciphertext + tag
 */
export async function encrypt(plaintext: string, secretBase64: string): Promise<string> {
  const key = await getCryptoKey(secretBase64);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH * 8 },
    key,
    encoder.encode(plaintext)
  );

  // Combine iv + ciphertext (includes tag)
  const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), IV_LENGTH);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt ciphertext encrypted with encrypt().
 * Input: base64-encoded string (iv + ciphertext + tag)
 */
export async function decrypt(encryptedBase64: string, secretBase64: string): Promise<string> {
  const key = await getCryptoKey(secretBase64);
  const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));

  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH * 8 },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}
