import { secp256k1 } from '@noble/curves/secp256k1';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes, bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { AuthMethod, UnsignedTransaction, SignedTransaction } from './types';

/** Narrow `Uint8Array<ArrayBufferLike>` to `Uint8Array` for noble-hashes KDFInput. */
function _asKDFInput(buf: Uint8Array): Uint8Array {
  return buf as Uint8Array;
}

/**
 * Embedded wallet with secp256k1 key pair derived from auth identifier + salt.
 *
 * Key derivation: PBKDF2-HMAC-SHA256(identifier, salt, 100_000, 32) → seed → private key
 */
export class EmbeddedWallet {
  readonly walletId: string;
  readonly authMethod: AuthMethod;
  readonly identifier: string;
  readonly salt: Uint8Array;

  private _privateKey: Uint8Array;
  private _publicKey: Uint8Array;

  constructor(
    walletId: string,
    authMethod: AuthMethod,
    identifier: string,
    privateKey: Uint8Array,
    salt: Uint8Array
  ) {
    this.walletId = walletId;
    this.authMethod = authMethod;
    this.identifier = identifier;
    this.salt = salt;
    this._privateKey = privateKey;
    this._publicKey = secp256k1.getPublicKey(privateKey, false);
  }

  // ─── Static Factories ─────────────────────────────────────────────────────

  /**
   * Derive deterministic key pair from identifier + salt via PBKDF2.
   */
  static deriveKeys(
    authMethod: AuthMethod,
    identifier: string,
    salt?: Uint8Array
  ): { privateKey: Uint8Array; salt: Uint8Array; publicKey: Uint8Array; address: string } {
    const s = salt ?? randomBytes(16);
    const seed = pbkdf2(
      sha256,
      _asKDFInput(new TextEncoder().encode(identifier.normalize('NFKC'))),
      _asKDFInput(s),
      { c: 100_000, dkLen: 32 }
    );
    const scalar = secp256k1.utils.normPrivateKeyToScalar(seed);
    const privateKey = EmbeddedWallet._scalarToBytes(scalar);
    const publicKey = secp256k1.getPublicKey(scalar, false);
    const address = EmbeddedWallet._publicKeyToAddress(publicKey);
    return { privateKey, salt: s, publicKey, address };
  }

  /** Create a brand-new wallet (generates fresh salt). */
  static create(walletId: string, authMethod: AuthMethod, identifier: string): EmbeddedWallet {
    const { privateKey, salt } = EmbeddedWallet.deriveKeys(authMethod, identifier);
    return new EmbeddedWallet(walletId, authMethod, identifier, privateKey, salt);
  }

  /** Recover a wallet by re-deriving from identifier + stored salt. */
  static recover(
    walletId: string,
    authMethod: AuthMethod,
    identifier: string,
    salt: Uint8Array
  ): EmbeddedWallet {
    const { privateKey } = EmbeddedWallet.deriveKeys(authMethod, identifier, salt);
    return new EmbeddedWallet(walletId, authMethod, identifier, privateKey, salt);
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /** Returns account info (address + compressed public key). */
  getAccount(): { address: string; publicKey: string } {
    return {
      address: EmbeddedWallet._publicKeyToAddress(this._publicKey),
      publicKey: bytesToHex(secp256k1.getPublicKey(this._privateKey, true)),
    };
  }

  /** Export the private key as hex. Use with extreme caution. */
  exportPrivateKey(): string {
    return bytesToHex(this._privateKey);
  }

  /** Sign transaction data with the embedded key. */
  signTransaction(tx: UnsignedTransaction): SignedTransaction {
    const msgBytes = typeof tx.data === 'string' ? hexToBytes(tx.data) : tx.data;
    const hash = sha256(msgBytes);
    const sig = secp256k1.sign(hash, this._privateKey);

    return {
      data: tx.data,
      signature: sig.toCompactHex(),
      signatureRecoverable: bytesToHex(sig.toCompactRawBytes()) +
        sig.recovery.toString(16).padStart(2, '0'),
      publicKey: bytesToHex(secp256k1.getPublicKey(this._privateKey, true)),
    };
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  private static _scalarToBytes(n: bigint): Uint8Array {
    const hex = n.toString(16).padStart(64, '0');
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  private static _publicKeyToAddress(publicKey: Uint8Array): string {
    const pub = publicKey.length === 65 ? publicKey.slice(1) : publicKey;
    const hash = sha256(pub);
    const raw = hash.slice(-20);
    return EmbeddedWallet._checksumAddress(raw);
  }

  private static _checksumAddress(raw: Uint8Array): string {
    const hex = bytesToHex(raw);
    const hashHex = bytesToHex(sha256(new TextEncoder().encode(hex)));
    let out = '0x';
    for (let i = 0; i < hex.length; i++) {
      out += parseInt(hashHex[i], 16) >= 8 ? hex[i].toUpperCase() : hex[i].toLowerCase();
    }
    return out;
  }
}
