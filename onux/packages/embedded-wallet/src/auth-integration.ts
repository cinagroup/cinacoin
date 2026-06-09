/**
 * Passkey and social login integration for embedded wallets.
 *
 * Bridges the authentication result from passkey-auth and social-login
 * into embedded wallet key derivation and session management.
 *
 * @packageDocumentation
 */

import { secp256k1 } from '@noble/curves/secp256k1';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes, bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { EmbeddedWallet } from './EmbeddedWallet';
import { WalletManager } from './WalletManager';
import { AuthMethod, WalletSession, LinkedProvider } from './types';

// ─── Types ──────────────────────────────────────────────────────────────

/** Authentication result from any provider. */
export interface AuthResult {
  /** Authentication method. */
  authMethod: AuthMethod;
  /** User identifier (email, phone, or social provider ID). */
  identifier: string;
  /** Provider name (for social auth). */
  provider?: string;
  /** Provider-specific user ID. */
  providerUserId?: string;
  /** User's email (if available). */
  email?: string;
  /** User's display name. */
  displayName?: string;
  /** Passkey credential ID (for passkey auth). */
  credentialId?: string;
  /** Raw public key from passkey registration. */
  passkeyPublicKey?: string;
}

/** Wallet creation result with session. */
export interface WalletAuthResult {
  /** Active wallet session. */
  session: WalletSession;
  /** Wallet address. */
  walletAddress: string;
  /** Compressed public key. */
  publicKey: string;
  /** Whether this is a new wallet. */
  isNewWallet: boolean;
}

/** Guardian for social recovery. */
export interface RecoveryGuardian {
  /** Guardian identifier (email, social provider ID, etc.). */
  identifier: string;
  /** Guardian's auth method. */
  authMethod: AuthMethod;
  /** Guardian's display name. */
  displayName: string;
  /** Guardian's provider (for social). */
  provider?: string;
}

/** Social recovery configuration. */
export interface SocialRecoveryConfig {
  /** List of guardians. */
  guardians: RecoveryGuardian[];
  /** Required confirmations (M of N). */
  threshold: number;
  /** Recovery delay (time before recovery can complete after initiation). */
  delayMs: number;
}

// ─── Narrow KDFInput ────────────────────────────────────────────────────

function _asKDFInput(buf: Uint8Array): Uint8Array {
  return buf as Uint8Array;
}

// ─── Key Derivation from Auth Credentials ────────────────────────────────

/**
 * Derive a deterministic seed from a passkey credential.
 *
 * Uses the passkey's raw public key combined with a per-user salt
 * to produce a 32-byte seed via PBKDF2.
 *
 * @param publicKey - Passkey public key (hex).
 * @param salt - Per-user salt (hex).
 * @param iterations - PBKDF2 iterations.
 * @returns 32-byte derivation seed.
 */
export function deriveSeedFromPasskey(
  publicKey: string,
  salt: string,
  iterations = 100_000
): Uint8Array {
  return pbkdf2(
    sha256,
    _asKDFInput(hexToBytes(publicKey)),
    _asKDFInput(hexToBytes(salt)),
    { c: iterations, dkLen: 32 }
  );
}

/**
 * Derive a deterministic seed from a social login identity.
 *
 * Combines the provider name, user ID, and optional email
 * into a unique derivation input.
 *
 * @param provider - Social provider name.
 * @param providerUserId - Provider-specific user ID.
 * @param email - Optional email for additional entropy.
 * @param salt - Per-user salt (hex).
 * @param iterations - PBKDF2 iterations.
 * @returns 32-byte derivation seed.
 */
export function deriveSeedFromSocial(
  provider: string,
  providerUserId: string,
  email: string | undefined,
  salt: string,
  iterations = 100_000
): Uint8Array {
  const identity = `${provider}:${providerUserId}${email ? `:${email.toLowerCase()}` : ''}`;
  return pbkdf2(
    sha256,
    _asKDFInput(new TextEncoder().encode(identity)),
    _asKDFInput(hexToBytes(salt)),
    { c: iterations, dkLen: 32 }
  );
}

/**
 * Derive a deterministic seed from any auth result.
 *
 * Routes to the appropriate derivation function based on auth method.
 *
 * @param auth - Authentication result.
 * @param salt - Per-user salt (hex).
 * @param iterations - PBKDF2 iterations.
 * @returns 32-byte derivation seed.
 */
export function deriveSeedFromAuth(
  auth: AuthResult,
  salt: string,
  iterations = 100_000
): Uint8Array {
  switch (auth.authMethod) {
    case 'social':
      return deriveSeedFromSocial(
        auth.provider || 'unknown',
        auth.providerUserId || auth.identifier,
        auth.email,
        salt,
        iterations
      );
    case 'email':
    case 'phone':
      return deriveSeedFromSocial(
        auth.authMethod,
        auth.identifier,
        auth.email,
        salt,
        iterations
      );
    default:
      // Fallback: use identifier directly
      return pbkdf2(
        sha256,
        _asKDFInput(new TextEncoder().encode(auth.identifier)),
        _asKDFInput(hexToBytes(salt)),
        { c: iterations, dkLen: 32 }
      );
  }
}

// ─── Wallet Manager Integration ─────────────────────────────────────────

/**
 * Create or recover a wallet from an authentication result.
 *
 * This is the main integration point between auth providers and
 * the embedded wallet system.
 *
 * @param authResult - Authentication result from any provider.
 * @param manager - WalletManager instance.
 * @returns Wallet authentication result with session.
 */
export async function createOrRecoverWallet(
  authResult: AuthResult,
  manager: WalletManager
): Promise<WalletAuthResult> {
  const identifier = authResult.identifier;

  // Try to login first (existing wallet)
  try {
    const session = await manager.login(identifier);
    const wallet = manager.getWallet(session.walletId);
    if (!wallet) {
      throw new Error('Failed to get wallet after login');
    }
    const account = wallet.getAccount();

    return {
      session,
      walletAddress: account.address,
      publicKey: account.publicKey,
      isNewWallet: false,
    };
  } catch {
    // No existing wallet — create a new one
    const session = await manager.create(
      authResult.authMethod,
      identifier,
      authResult.displayName
    );

    const wallet = manager.getWallet(session.walletId);
    if (!wallet) {
      throw new Error('Failed to get wallet after creation');
    }
    const account = wallet.getAccount();

    // Link provider if social auth
    if (authResult.provider && authResult.providerUserId) {
      await manager.linkProvider(
        session.walletId,
        authResult.provider,
        authResult.providerUserId
      );
    }

    return {
      session,
      walletAddress: account.address,
      publicKey: account.publicKey,
      isNewWallet: true,
    };
  }
}

/**
 * Link multiple social providers to the same wallet.
 *
 * After a user logs in with a new provider, this function links
 * that provider to their existing wallet so they can access it
 * from any of their linked identities.
 *
 * @param walletId - Existing wallet ID.
 * @param manager - WalletManager instance.
 * @param authResult - New authentication result to link.
 * @returns Whether the provider was successfully linked.
 */
export async function linkAuthProvider(
  walletId: string,
  manager: WalletManager,
  authResult: AuthResult
): Promise<LinkedProvider | null> {
  if (!authResult.provider || !authResult.providerUserId) {
    return null;
  }

  return manager.linkProvider(
    walletId,
    authResult.provider,
    authResult.providerUserId
  );
}

/**
 * Recover a wallet through social recovery (multi-guardian).
 *
 * This is a simplified implementation. In production, use the
 * full SocialRecoveryManager from social-login.
 *
 * @param walletId - Wallet to recover.
 * @param newIdentifier - New identity to recover to.
 * @param newAuthMethod - New authentication method.
 * @param manager - WalletManager instance.
 * @returns New wallet session after recovery.
 */
export async function recoverWallet(
  walletId: string,
  newIdentifier: string,
  newAuthMethod: AuthMethod,
  manager: WalletManager
): Promise<WalletSession> {
  // In production, this would:
  // 1. Verify guardian confirmations
  // 2. Wait for recovery delay
  // 3. Transfer wallet to new identity

  // For now, create a new wallet with the new identity
  // and link it to the old wallet ID (conceptually)
  const session = await manager.create(newAuthMethod, newIdentifier, 'Recovered Wallet');
  return session;
}

// ─── Passkey-to-Wallet Flow ─────────────────────────────────────────────

/**
 * Create a wallet from a passkey registration.
 *
 * After a user registers a passkey, this creates an embedded wallet
 * bound to the passkey credential ID.
 *
 * @param credentialId - Passkey credential ID.
 * @param userId - User identifier.
 * @param displayName - User's display name.
 * @param manager - WalletManager instance.
 * @returns Wallet authentication result.
 */
export async function createWalletFromPasskey(
  credentialId: string,
  userId: string,
  displayName: string,
  manager: WalletManager
): Promise<WalletAuthResult> {
  return createOrRecoverWallet({
    authMethod: 'social', // Passkey is treated as a social-like auth method
    identifier: credentialId,
    provider: 'passkey',
    providerUserId: userId,
    displayName,
    credentialId,
  }, manager);
}

/**
 * Recover a wallet from a passkey login.
 *
 * @param credentialId - Passkey credential ID.
 * @param manager - WalletManager instance.
 * @returns Wallet authentication result.
 */
export async function recoverWalletFromPasskey(
  credentialId: string,
  manager: WalletManager
): Promise<WalletAuthResult> {
  return createOrRecoverWallet({
    authMethod: 'social',
    identifier: credentialId,
    provider: 'passkey',
    credentialId,
  }, manager);
}
