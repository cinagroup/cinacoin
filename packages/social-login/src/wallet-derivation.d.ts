/**
 * Deterministic HD wallet derivation from social identity.
 *
 * Uses BIP-32/BIP-44 to derive a unique Ethereum wallet from
 * a user's social identity, ensuring the same identity always
 * maps to the same wallet address.
 *
 * Derivation path: m/44'/60'/0'/0/{userId_hash}
 * (BIP-44 Ethereum path with user-specific index)
 */
/**
 * Derive a BIP-32 HD wallet seed from a social identity.
 *
 * Uses HKDF (HMAC-based Key Derivation Function) to derive
 * a 32-byte seed from the provider ID and email/username.
 *
 * @param providerId - Provider-specific user ID (e.g., Google sub).
 * @param identifier - Additional identifier (email, username).
 * @param derivationKey - Optional master key for additional security.
 * @returns 32-byte seed for HD wallet derivation.
 */
export declare function deriveSeedFromIdentity(providerId: string, identifier: string, derivationKey?: string): Buffer;
/**
 * Derive an Ethereum address from a social identity seed.
 *
 * This is a simplified derivation that uses the seed directly
 * as a private key to generate the address. In production,
 * use a proper HD wallet library like `ethers` or `@scure/bip32`.
 *
 * @param seed - 32-byte derivation seed.
 * @returns Object with address and public key.
 */
export declare function deriveAddressFromSeed(seed: Buffer): {
    address: string;
    publicKey: string;
};
/**
 * Derive a wallet address directly from email using a deterministic hash.
 *
 * This is useful for email-based auth where you want a consistent
 * address without full HD wallet derivation.
 *
 * @param email - User's email address.
 * @param salt - Optional salt for additional security.
 * @returns Derived Ethereum address.
 */
export declare function deriveAddressFromEmail(email: string, salt?: string): {
    address: string;
    publicKey: string;
};
/**
 * Derive a wallet address from a provider identity.
 *
 * Combines the provider name, user ID, and optional email
 * for maximum uniqueness.
 *
 * @param provider - Provider name (google, apple, twitter, email).
 * @param userId - Provider-specific user ID.
 * @param email - Optional email for additional entropy.
 * @returns Object with address and public key.
 *
 * @example
 * ```ts
 * const wallet = await deriveAddressFromProvider('google', '12345', 'user@gmail.com');
 * // wallet.address → "0x..."
 * ```
 */
export declare function deriveAddressFromProvider(provider: string, userId: string, email?: string): {
    address: string;
    publicKey: string;
};
/**
 * Generate a random mnemonic for wallet initialization.
 *
 * @param strength - Entropy strength in bits (128, 192, or 256).
 * @returns BIP-39 mnemonic phrase.
 *
 * Note: For production use, implement proper BIP-39 with word list.
 * This returns random hex as a placeholder.
 */
export declare function generateRandomMnemonic(strength?: 128 | 192 | 256): string;
//# sourceMappingURL=wallet-derivation.d.ts.map