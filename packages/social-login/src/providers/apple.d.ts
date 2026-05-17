/**
 * Apple Sign-In provider for social login.
 *
 * Implements Sign in with Apple using OAuth2 and JWT-based
 * client authentication (per Apple's requirements).
 *
 * Reference: https://developer.apple.com/sign-in-with-apple/
 */
import type { AppleLoginParams, SocialLoginResult, OAuth2UserProfile } from '../types.js';
/**
 * Generate an Apple client_secret JWT.
 *
 * Apple requires a JWT signed with your private key as the client_secret.
 *
 * @param params - Apple login parameters.
 * @returns JWT client_secret string.
 *
 * Note: In production, use the `jose` library for proper JWT generation.
 * This is a placeholder showing the required claims structure.
 */
export declare function generateAppleClientSecret(params: AppleLoginParams): Promise<string>;
/**
 * Build the Apple Sign-In authorization URL.
 *
 * @param params - Apple login parameters.
 * @returns Authorization URL to redirect the user to.
 */
export declare function buildAppleAuthUrl(params: AppleLoginParams): string;
/**
 * Exchange an authorization code for tokens with Apple.
 *
 * @param code - Authorization code from Apple redirect.
 * @param params - Apple login parameters.
 * @param clientSecret - JWT client_secret (generated via generateAppleClientSecret).
 * @returns Token response (Apple doesn't return refresh tokens on web).
 */
export declare function exchangeAppleCode(code: string, params: Pick<AppleLoginParams, 'clientId' | 'redirectUri'>, clientSecret: string): Promise<{
    idToken: string;
    accessToken?: string;
    expiresIn: number;
}>;
/**
 * Decode the Apple ID token to extract user profile.
 *
 * Apple returns the ID token as a JWT with user claims.
 * On first login only, Apple also returns user name/email in the form POST body.
 *
 * @param idToken - Apple ID token (JWT).
 * @returns Decoded user profile.
 */
export declare function decodeAppleIdToken(idToken: string): OAuth2UserProfile;
/**
 * Handle the full Apple login flow.
 *
 * @param code - Authorization code from Apple redirect.
 * @param params - Apple login parameters.
 * @param clientSecret - JWT client_secret.
 * @param deriveWallet - Function to derive a wallet address.
 * @param appleUserData - Optional user data from form POST (first login only).
 * @returns Social login result.
 */
export declare function loginWithApple(code: string, params: AppleLoginParams, deriveWallet: (userId: string, email: string) => Promise<{
    address: string;
    publicKey?: string;
}>, appleUserData?: {
    name?: {
        firstName?: string;
        lastName?: string;
    };
    email?: string;
}): Promise<SocialLoginResult>;
/**
 * Verify an Apple ID token's signature.
 *
 * Apple publishes their public keys at a well-known URL.
 *
 * @param idToken - Apple ID token.
 * @returns True if the token signature is valid.
 */
export declare function verifyAppleToken(idToken: string): Promise<boolean>;
//# sourceMappingURL=apple.d.ts.map