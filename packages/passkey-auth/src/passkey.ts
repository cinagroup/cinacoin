import { generateChallenge, deriveAddress } from './crypto.js';
import { defaultStorage } from './storage.js';
import type {
  PasskeyConfig,
  PasskeyStorage,
  StoredPasskey,
  RegistrationResult,
  AuthenticationResult,
} from './types.js';
import {
  WebAuthnClient,
  buildRegistrationOptions,
  buildAuthenticationOptions,
} from './webauthn.js';

/**
 * Passkey — High-level passkey authentication manager.
 * Handles registration, authentication, listing, and removal of passkeys.
 */
export class PasskeyManager {
  private config: PasskeyConfig;
  private storage: PasskeyStorage;

  constructor(config: PasskeyConfig, storage?: PasskeyStorage) {
    this.config = {
      challengeLength: config.challengeLength ?? 32,
      timeout: config.timeout ?? 60000,
      userVerification: config.userVerification ?? 'required',
      rpName: config.rpName,
      rpId: config.rpId,
    };
    this.storage = storage ?? defaultStorage;
  }

  /**
   * Register a new passkey credential.
   */
  async register(
    userId: string,
    userName: string,
    displayName: string
  ): Promise<RegistrationResult> {
    try {
      const challenge = generateChallenge(this.config.challengeLength);
      const options = buildRegistrationOptions({
        rpName: this.config.rpName,
        rpId: this.config.rpId,
        userId,
        userName,
        displayName,
        challenge,
        timeout: this.config.timeout,
        userVerification: this.config.userVerification,
      });

      if (!WebAuthnClient.isAvailable()) {
        // SECURITY FIX: Do NOT fall back to unauthenticated keypair generation.
        // WebAuthn unavailability must result in registration failure,
        // not a bypass that creates credentials without a hardware authenticator.
        return {
          success: false,
          credentialId: '',
          publicKey: '',
          error:
            'WebAuthn is not available in this environment; registration requires a hardware authenticator',
        };
      }

      const credential = await WebAuthnClient.register(options);
      if (!credential) {
        return { success: false, credentialId: '', publicKey: '', error: 'Registration cancelled' };
      }

      const stored: StoredPasskey = {
        id: credential.id,
        publicKey: '',
        name: displayName,
        createdAt: Date.now(),
      };
      await this.storage.save(stored);

      return {
        success: true,
        credentialId: credential.id,
        publicKey: stored.publicKey,
      };
    } catch (error) {
      return {
        success: false,
        credentialId: '',
        publicKey: '',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Authenticate with a passkey.
   */
  async authenticate(credentialId?: string): Promise<AuthenticationResult> {
    try {
      const challenge = generateChallenge(this.config.challengeLength);

      const allowCredentials = credentialId
        ? [{ type: 'public-key' as const, id: credentialId }]
        : undefined;

      const options = buildAuthenticationOptions({
        rpId: this.config.rpId,
        challenge,
        timeout: this.config.timeout,
        userVerification: this.config.userVerification,
        allowCredentials,
      });

      if (!WebAuthnClient.isAvailable()) {
        // SECURITY FIX: Do NOT fall back to unauthenticated success.
        // WebAuthn unavailability must result in authentication failure,
        // not a bypass that returns success with an empty signature.
        return {
          success: false,
          credentialId: credentialId ?? '',
          signature: '',
          authenticatorData: '',
          clientDataJSON: '',
          error:
            'WebAuthn is not available in this environment; authentication requires a hardware authenticator',
        };
      }

      const credential = await WebAuthnClient.authenticate(options);
      if (!credential) {
        return {
          success: false,
          credentialId: '',
          signature: '',
          authenticatorData: '',
          clientDataJSON: '',
          error: 'Authentication cancelled',
        };
      }

      // Update last used timestamp
      const stored = await this.storage.load(credential.id);
      if (stored) {
        stored.lastUsed = Date.now();
        await this.storage.save(stored);
      }

      return {
        success: true,
        credentialId: credential.id,
        signature: '',
        authenticatorData: '',
        clientDataJSON: '',
        userHandle: credential.id,
      };
    } catch (error) {
      return {
        success: false,
        credentialId: '',
        signature: '',
        authenticatorData: '',
        clientDataJSON: '',
        error: (error as Error).message,
      };
    }
  }

  /**
   * List all stored passkeys.
   */
  async list(): Promise<StoredPasskey[]> {
    return this.storage.list();
  }

  /**
   * Remove a passkey by ID.
   */
  async remove(id: string): Promise<boolean> {
    return this.storage.remove(id);
  }

  /**
   * Get the derived address for a passkey.
   */
  getDerivedAddress(publicKey: string): string {
    return deriveAddress(publicKey);
  }

  /**
   * Clear all stored passkeys.
   */
  async clear(): Promise<void> {
    await this.storage.clear();
  }
}
