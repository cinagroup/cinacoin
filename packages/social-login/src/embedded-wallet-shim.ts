/**
 * Embedded wallet shim — local type declarations.
 *
 * This file provides inline types to avoid a hard peer dependency at build time.
 *
 * NOTE: The original ./embedded-wallet-shim package has been removed.
 * These stubs throw errors at runtime. Replace with @reown/appkit's
 * embedded wallet / social login when migrating to Reown.
 */

/** Supported authentication methods for wallet creation and recovery. */
export type AuthMethod = 'email' | 'social' | 'phone';

/** Configuration passed when creating an embedded wallet. */
export interface EmbeddedWalletConfig {
  id: string;
  authMethod: AuthMethod;
  identifier: string;
  label?: string;
  createdAt: string;
  lastAccessedAt?: string;
}

/** A linked social or external provider for multi-provider access. */
export interface LinkedProvider {
  providerId: string;
  provider: string;
  externalId: string;
  linkedAt: string;
}

/** Encrypted backup payload for wallet recovery. */
export interface WalletBackup {
  walletId: string;
  encryptedKey: string;
  iv: string;
  authTag: string;
  salt: string;
  iterations: number;
  createdAt: string;
}

/** Active wallet session state. */
export interface WalletSession {
  walletId: string;
  authMethod: AuthMethod;
  identifier: string;
  createdAt: string;
  expiresAt: string | null;
}

/** Transaction shape that can be signed by the wallet. */
export interface UnsignedTransaction {
  data: string | Uint8Array;
  metadata?: Record<string, unknown>;
}

/** Signed transaction result. */
export interface SignedTransaction {
  data: string | Uint8Array;
  signature: string;
  signatureRecoverable: string;
  publicKey: string;
}

/**
 * Embedded wallet with secp256k1 key pair derived from auth identifier + salt.
 *
 * NOTE: This is a type-only shim. The actual implementation lives in
 * ./embedded-wallet-shim. At runtime, replace with the real class.
 */
export class EmbeddedWallet {
  readonly walletId!: string;
  readonly authMethod!: AuthMethod;
  readonly identifier!: string;
  readonly salt!: Uint8Array;

  static deriveKeys(
    _authMethod: AuthMethod,
    _identifier: string,
    _salt?: Uint8Array
  ): { privateKey: Uint8Array; salt: Uint8Array; publicKey: Uint8Array; address: string } {
    throw new Error('EmbeddedWallet.deriveKeys is not available — TODO: migrate to @reown/appkit embedded wallet');
  }

  static create(_walletId: string, _authMethod: AuthMethod, _identifier: string): EmbeddedWallet {
    throw new Error('EmbeddedWallet.create is not available — TODO: migrate to @reown/appkit embedded wallet');
  }

  static recover(
    _walletId: string,
    _authMethod: AuthMethod,
    _identifier: string,
    _salt: Uint8Array
  ): EmbeddedWallet {
    throw new Error('EmbeddedWallet.recover is not available — TODO: migrate to @reown/appkit embedded wallet');
  }

  getAccount(): { address: string; publicKey: string } {
    throw new Error('EmbeddedWallet.getAccount is not available — TODO: migrate to @reown/appkit embedded wallet');
  }

  exportPrivateKey(): string {
    throw new Error('EmbeddedWallet.exportPrivateKey is not available — TODO: migrate to @reown/appkit embedded wallet');
  }

  signTransaction(_tx: UnsignedTransaction): SignedTransaction {
    throw new Error('EmbeddedWallet.signTransaction is not available — TODO: migrate to @reown/appkit embedded wallet');
  }
}

/**
 * High-level wallet lifecycle manager.
 *
 * NOTE: This is a type-only shim. The original ./embedded-wallet-shim
 * has been removed. Replace with @reown/appkit when migrating.
 */
export class WalletManager {
  constructor(_config: EmbeddedWalletConfig) {}

  async create(_authMethod: AuthMethod, _identifier: string, _label?: string): Promise<WalletSession> {
    throw new Error('WalletManager.create is not available — TODO: migrate to @reown/appkit');
  }

  async login(_identifier: string): Promise<WalletSession> {
    throw new Error('WalletManager.login is not available — TODO: migrate to @reown/appkit');
  }

  logout(_walletId?: string): void {}

  async listWallets(_identifier?: string): Promise<WalletSession[]> {
    return [];
  }

  async linkProvider(_walletId: string, _provider: string, _externalId: string): Promise<LinkedProvider> {
    throw new Error('WalletManager.linkProvider is not available — TODO: migrate to @reown/appkit');
  }

  async unlinkProvider(_walletId: string, _providerId: string): Promise<void> {
    throw new Error('WalletManager.unlinkProvider is not available — TODO: migrate to @reown/appkit');
  }

  async backup(_walletId: string, _password: string): Promise<WalletBackup> {
    throw new Error('WalletManager.backup is not available — TODO: migrate to @reown/appkit');
  }

  async restoreFromBackup(_backup: WalletBackup, _password: string): Promise<WalletSession> {
    throw new Error('WalletManager.restoreFromBackup is not available — TODO: migrate to @reown/appkit');
  }

  getWallet(_walletId: string): EmbeddedWallet | undefined {
    return undefined;
  }
}
