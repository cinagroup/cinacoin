import { encodeChallenge, decodeChallenge } from './crypto.js';
import { fromBase64UrlAllowCredential } from './credentials.js';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from './types.js';

/**
 * WebAuthn API wrapper for browser-based passkey operations.
 */
export class WebAuthnClient {
  /**
   * Check if WebAuthn is available in the current environment.
   */
  static isAvailable(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.PublicKeyCredential !== 'undefined' &&
      typeof window.navigator?.credentials !== 'undefined'
    );
  }

  /**
   * Register a new passkey credential.
   */
  static async register(
    options: PublicKeyCredentialCreationOptionsJSON,
  ): Promise<PublicKeyCredential | null> {
    if (!this.isAvailable()) {
      throw new Error('WebAuthn is not available in this environment');
    }

    const challengeBytes = decodeChallenge(options.challenge);
    const challenge = challengeBytes.buffer.slice(
      challengeBytes.byteOffset,
      challengeBytes.byteOffset + challengeBytes.byteLength
    ) as ArrayBuffer;

    const publicKey: PublicKeyCredentialCreationOptions = {
      challenge,
      user: {
        id: (() => {
          const bytes = decodeChallenge(options.user.id);
          return bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength
          ) as ArrayBuffer;
        })(),
        name: options.user.name,
        displayName: options.user.displayName,
      },
      rp: options.rp,
      pubKeyCredParams: options.pubKeyCredParams as PublicKeyCredentialCreationOptions['pubKeyCredParams'],
      timeout: options.timeout,
      attestation: (options.attestation || 'none') as AttestationConveyancePreference,
      authenticatorSelection: options.authenticatorSelection as PublicKeyCredentialCreationOptions['authenticatorSelection'],
    };

    const credential = (await navigator.credentials.create({
      publicKey,
    })) as PublicKeyCredential | null;

    return credential;
  }

  /**
   * Authenticate with an existing passkey credential.
   */
  static async authenticate(
    options: PublicKeyCredentialRequestOptionsJSON,
  ): Promise<PublicKeyCredential | null> {
    if (!this.isAvailable()) {
      throw new Error('WebAuthn is not available in this environment');
    }

    const challengeBytes = decodeChallenge(options.challenge);
    const challenge = challengeBytes.buffer.slice(
      challengeBytes.byteOffset,
      challengeBytes.byteOffset + challengeBytes.byteLength
    ) as ArrayBuffer;

    const allowCredentials = options.allowCredentials?.map(c => ({
      type: c.type as PublicKeyCredentialDescriptor['type'],
      id: (() => {
        const bytes = fromBase64UrlAllowCredential(c.id);
        return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      })(),
      transports: c.transports as AuthenticatorTransport[],
    }));

    const publicKey: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: options.timeout,
      rpId: options.rpId,
      allowCredentials,
      userVerification: (options.userVerification || 'required') as UserVerificationRequirement,
    };

    const credential = (await navigator.credentials.get({
      publicKey,
    })) as PublicKeyCredential | null;

    return credential;
  }

  /**
   * Check if conditional UI (autofill) is supported.
   */
  static async isConditionalMediationAvailable(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    return (
      window.PublicKeyCredential.isConditionalMediationAvailable?.() ?? false
    );
  }

  /**
   * Check if a specific authenticator attachment is available.
   */
  static async isUserVerifyingPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    return (
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.() ??
      false
    );
  }
}

/**
 * Build WebAuthn registration options from config.
 */
export function buildRegistrationOptions(config: {
  rpName: string;
  rpId: string;
  userId: string;
  userName: string;
  displayName: string;
  challenge: Uint8Array;
  timeout?: number;
  userVerification?: string;
}): PublicKeyCredentialCreationOptionsJSON {
  return {
    rp: { name: config.rpName, id: config.rpId },
    user: {
      id: encodeChallenge(new Uint8Array(Array.from(config.userId).map((c) => c.charCodeAt(0)))),
      name: config.userName,
      displayName: config.displayName,
    },
    challenge: encodeChallenge(config.challenge),
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    timeout: config.timeout || 60000,
    attestation: 'none',
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: config.userVerification || 'required',
    },
  };
}

/**
 * Build WebAuthn authentication options from config.
 */
export function buildAuthenticationOptions(config: {
  rpId: string;
  challenge: Uint8Array;
  timeout?: number;
  userVerification?: string;
  allowCredentials?: Array<{ type: string; id: string }>;
}): PublicKeyCredentialRequestOptionsJSON {
  return {
    challenge: encodeChallenge(config.challenge),
    timeout: config.timeout || 60000,
    rpId: config.rpId,
    allowCredentials: config.allowCredentials,
    userVerification: config.userVerification || 'required',
  };
}
