import { encodeChallenge, decodeChallenge } from './crypto.js';
/**
 * WebAuthn API wrapper for browser-based passkey operations.
 */
export class WebAuthnClient {
    /**
     * Check if WebAuthn is available in the current environment.
     */
    static isAvailable() {
        return (typeof window !== 'undefined' &&
            typeof window.PublicKeyCredential !== 'undefined' &&
            typeof window.navigator?.credentials !== 'undefined');
    }
    /**
     * Register a new passkey credential.
     */
    static async register(options) {
        if (!this.isAvailable()) {
            throw new Error('WebAuthn is not available in this environment');
        }
        const publicKey = {
            ...options,
            challenge: decodeChallenge(options.challenge),
            user: {
                ...options.user,
                id: decodeChallenge(options.user.id),
            },
        };
        const credential = (await navigator.credentials.create({
            publicKey,
        }));
        return credential;
    }
    /**
     * Authenticate with an existing passkey credential.
     */
    static async authenticate(options) {
        if (!this.isAvailable()) {
            throw new Error('WebAuthn is not available in this environment');
        }
        const publicKey = {
            ...options,
            challenge: decodeChallenge(options.challenge),
        };
        const credential = (await navigator.credentials.get({
            publicKey,
        }));
        return credential;
    }
    /**
     * Check if conditional UI (autofill) is supported.
     */
    static async isConditionalMediationAvailable() {
        if (!this.isAvailable())
            return false;
        return (window.PublicKeyCredential.isConditionalMediationAvailable?.() ?? false);
    }
    /**
     * Check if a specific authenticator attachment is available.
     */
    static async isUserVerifyingPlatformAuthenticatorAvailable() {
        if (!this.isAvailable())
            return false;
        return (window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.() ??
            false);
    }
}
/**
 * Build WebAuthn registration options from config.
 */
export function buildRegistrationOptions(config) {
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
export function buildAuthenticationOptions(config) {
    return {
        challenge: encodeChallenge(config.challenge),
        timeout: config.timeout || 60000,
        rpId: config.rpId,
        allowCredentials: config.allowCredentials,
        userVerification: config.userVerification || 'required',
    };
}
//# sourceMappingURL=webauthn.js.map