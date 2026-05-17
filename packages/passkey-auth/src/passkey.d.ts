import type { PasskeyConfig, PasskeyStorage, StoredPasskey, RegistrationResult, AuthenticationResult } from './types.js';
/**
 * Passkey — High-level passkey authentication manager.
 * Handles registration, authentication, listing, and removal of passkeys.
 */
export declare class PasskeyManager {
    private config;
    private storage;
    constructor(config: PasskeyConfig, storage?: PasskeyStorage);
    /**
     * Register a new passkey credential.
     */
    register(userId: string, userName: string, displayName: string): Promise<RegistrationResult>;
    /**
     * Authenticate with a passkey.
     */
    authenticate(credentialId?: string): Promise<AuthenticationResult>;
    /**
     * List all stored passkeys.
     */
    list(): Promise<StoredPasskey[]>;
    /**
     * Remove a passkey by ID.
     */
    remove(id: string): Promise<boolean>;
    /**
     * Get the derived address for a passkey.
     */
    getDerivedAddress(publicKey: string): string;
    /**
     * Clear all stored passkeys.
     */
    clear(): Promise<void>;
}
//# sourceMappingURL=passkey.d.ts.map