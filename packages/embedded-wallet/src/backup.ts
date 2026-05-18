import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes, bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { WalletBackup } from './types';

// ─── Web Crypto helpers ─────────────────────────────────────────────────────

/** Narrow `Uint8Array<ArrayBufferLike>` to `BufferSource` for SubtleCrypto. */
function _bs(buf: Uint8Array): BufferSource {
  return buf as unknown as BufferSource;
}

function _getSubtle(): SubtleCrypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error(
    'SubtleCrypto unavailable. Use HTTPS or Node ≥19.'
  );
}

/**
 * Derive AES-GCM-256 key from password + salt (PBKDF2, 310k iters).
 */
async function _deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle = _getSubtle();
  const material = await subtle.importKey(
    'raw',
    _bs(new TextEncoder().encode(password)),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return subtle.deriveKey(
    { name: 'PBKDF2', salt: _bs(salt), iterations: 310_000, hash: 'SHA-256' } as Pbkdf2Params,
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a hex private key with AES-GCM.
 */
async function _encrypt(
  privateKeyHex: string,
  password: string
): Promise<Omit<WalletBackup, 'walletId' | 'createdAt'>> {
  const subtle = _getSubtle();
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await _deriveKey(password, salt);
  const encoded = new TextEncoder().encode(privateKeyHex);

  const ciphertextWithAuthTag = await subtle.encrypt(
    { name: 'AES-GCM', iv: _bs(iv) },
    key,
    _bs(encoded)
  );
  const full = new Uint8Array(ciphertextWithAuthTag);
  const ciphertext = full.slice(0, -16);
  const authTag = full.slice(-16);

  return {
    encryptedKey: bytesToHex(ciphertext),
    iv: bytesToHex(iv),
    authTag: bytesToHex(authTag),
    salt: bytesToHex(salt),
    iterations: 310_000,
  };
}

/**
 * Backup (encrypt) a wallet's private key with a user password.
 *
 * @param walletId      - Unique wallet identifier.
 * @param privateKeyHex - Hex-encoded secp256k1 private key.
 * @param password      - User passphrase.
 * @returns Encrypted backup payload.
 */
export async function backupWallet(
  walletId: string,
  privateKeyHex: string,
  password: string
): Promise<WalletBackup> {
  const encrypted = await _encrypt(privateKeyHex, password);
  return {
    walletId,
    ...encrypted,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Recover a wallet's private key from an encrypted backup.
 *
 * @param walletId - Must match `backup.walletId`.
 * @param backup   - Encrypted backup payload from `backupWallet`.
 * @param password - User passphrase used during backup.
 * @returns Hex-encoded private key.
 */
export async function recoverWallet(
  walletId: string,
  backup: WalletBackup,
  password: string
): Promise<string> {
  if (backup.walletId !== walletId) {
    throw new Error(`walletId mismatch: expected "${walletId}", got "${backup.walletId}"`);
  }

  const subtle = _getSubtle();
  const salt = hexToBytes(backup.salt);
  const iv = hexToBytes(backup.iv);
  const ct = hexToBytes(backup.encryptedKey);
  const tag = hexToBytes(backup.authTag);

  // Reassemble ciphertext || tag for AES-GCM decrypt
  const full = new Uint8Array(ct.length + tag.length);
  full.set(ct);
  full.set(tag, ct.length);

  const key = await _deriveKey(password, salt);
  const decrypted = await subtle.decrypt(
    { name: 'AES-GCM', iv: _bs(iv) },
    key,
    _bs(full)
  );
  return new TextDecoder().decode(decrypted);
}
