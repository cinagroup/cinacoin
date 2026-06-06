import { WebAuthnClient, buildRegistrationOptions, buildAuthenticationOptions } from './webauthn.js';
import { generateChallenge, encodeChallenge, deriveAddress, generateKeypair } from './crypto.js';
import { defaultStorage } from './storage.js';
/**
 * Passkey — High-level passkey authentication manager.
 * Handles registration, authentication, listing, and removal of passkeys.
 */
export class PasskeyManager {
    constructor(config, storage) {
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
    async register(userId, userName, displayName) {
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
                // Fallback: generate a keypair locally for server-side registration
                const keypair = generateKeypair();
                const credentialId = encodeChallenge(challenge);
                const stored = {
                    id: credentialId,
                    publicKey: keypair.publicKey,
                    name: displayName,
                    createdAt: Date.now(),
                };
                await this.storage.save(stored);
                return {
                    success: true,
                    credentialId,
                    publicKey: keypair.publicKey,
                };
            }
            const credential = await WebAuthnClient.register(options);
            if (!credential) {
                return { success: false, credentialId: '', publicKey: '', error: 'Registration cancelled' };
            }
            const stored = {
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
        }
        catch (error) {
            return {
                success: false,
                credentialId: '',
                publicKey: '',
                error: error.message,
            };
        }
    }
    /**
     * Authenticate with a passkey.
     */
    async authenticate(credentialId) {
        try {
            const challenge = generateChallenge(this.config.challengeLength);
            const allowCredentials = credentialId
                ? [{ type: 'public-key', id: credentialId }]
                : undefined;
            const options = buildAuthenticationOptions({
                rpId: this.config.rpId,
                challenge,
                timeout: this.config.timeout,
                userVerification: this.config.userVerification,
                allowCredentials,
            });
            if (!WebAuthnClient.isAvailable()) {
                // Fallback: verify against stored passkey
                if (credentialId) {
                    const stored = await this.storage.load(credentialId);
                    if (!stored) {
                        return {
                            success: false,
                            credentialId,
                            signature: '',
                            authenticatorData: '',
                            clientDataJSON: '',
                            error: 'Passkey not found',
                        };
                    }
                    // Update last used timestamp
                    stored.lastUsed = Date.now();
                    await this.storage.save(stored);
                    return {
                        success: true,
                        credentialId,
                        signature: '',
                        authenticatorData: '',
                        clientDataJSON: '',
                        userHandle: credentialId,
                    };
                }
                return {
                    success: false,
                    credentialId: '',
                    signature: '',
                    authenticatorData: '',
                    clientDataJSON: '',
                    error: 'No credential ID provided for fallback authentication',
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
        }
        catch (error) {
            return {
                success: false,
                credentialId: '',
                signature: '',
                authenticatorData: '',
                clientDataJSON: '',
                error: error.message,
            };
        }
    }
    /**
     * List all stored passkeys.
     */
    async list() {
        return this.storage.list();
    }
    /**
     * Remove a passkey by ID.
     */
    async remove(id) {
        return this.storage.remove(id);
    }
    /**
     * Get the derived address for a passkey.
     */
    getDerivedAddress(publicKey) {
        return deriveAddress(publicKey);
    }
    /**
     * Clear all stored passkeys.
     */
    async clear() {
        await this.storage.clear();
    }
}
//# sourceMappingURL=passkey.js.map