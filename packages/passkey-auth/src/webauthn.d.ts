import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from './types.js';
/**
 * WebAuthn API wrapper for browser-based passkey operations.
 */
export declare class WebAuthnClient {
    /**
     * Check if WebAuthn is available in the current environment.
     */
    static isAvailable(): boolean;
    /**
     * Register a new passkey credential.
     */
    static register(options: PublicKeyCredentialCreationOptionsJSON): Promise<PublicKeyCredential | null>;
    /**
     * Authenticate with an existing passkey credential.
     */
    static authenticate(options: PublicKeyCredentialRequestOptionsJSON): Promise<PublicKeyCredential | null>;
    /**
     * Check if conditional UI (autofill) is supported.
     */
    static isConditionalMediationAvailable(): Promise<boolean>;
    /**
     * Check if a specific authenticator attachment is available.
     */
    static isUserVerifyingPlatformAuthenticatorAvailable(): Promise<boolean>;
}
/**
 * Build WebAuthn registration options from config.
 */
export declare function buildRegistrationOptions(config: {
    rpName: string;
    rpId: string;
    userId: string;
    userName: string;
    displayName: string;
    challenge: Uint8Array;
    timeout?: number;
    userVerification?: string;
}): PublicKeyCredentialCreationOptionsJSON;
/**
 * Build WebAuthn authentication options from config.
 */
export declare function buildAuthenticationOptions(config: {
    rpId: string;
    challenge: Uint8Array;
    timeout?: number;
    userVerification?: string;
    allowCredentials?: Array<{
        type: string;
        id: string;
    }>;
}): PublicKeyCredentialRequestOptionsJSON;
//# sourceMappingURL=webauthn.d.ts.map