/**
 * Google OAuth2 provider for social login.
 *
 * Implements the Google Sign-In flow using OpenID Connect
 * and returns a JWT token with a derived wallet address.
 *
 * Reference: https://developers.google.com/identity/protocols/oauth2
 */
import type { GoogleLoginParams, SocialLoginResult, OAuth2TokenResponse, OAuth2UserProfile } from '../types.js';
/**
 * Build the Google OAuth2 authorization URL.
 *
 * @param params - Google login parameters.
 * @returns Authorization URL to redirect the user to.
 */
export declare function buildGoogleAuthUrl(params: GoogleLoginParams): string;
/**
 * Exchange an authorization code for tokens.
 *
 * @param code - Authorization code from the redirect.
 * @param params - Google login parameters (clientId, redirectUri).
 * @param clientSecret - OAuth2 client secret.
 * @returns OAuth2 token response.
 */
export declare function exchangeCodeForTokens(code: string, params: Pick<GoogleLoginParams, 'clientId' | 'redirectUri'>, clientSecret: string): Promise<OAuth2TokenResponse>;
/**
 * Fetch the user's profile from Google.
 *
 * @param accessToken - OAuth2 access token.
 * @returns User profile data.
 */
export declare function fetchGoogleUserProfile(accessToken: string): Promise<OAuth2UserProfile>;
/**
 * Handle the full Google login flow: code exchange → profile fetch → result.
 *
 * @param code - Authorization code from Google redirect.
 * @param params - Google login parameters.
 * @param clientSecret - OAuth2 client secret.
 * @param deriveWallet - Function to derive a wallet address from the user identity.
 * @returns Social login result.
 */
export declare function loginWithGoogle(code: string, params: GoogleLoginParams & {
    clientSecret: string;
}, deriveWallet: (userId: string, email: string) => Promise<{
    address: string;
    publicKey?: string;
}>): Promise<SocialLoginResult>;
//# sourceMappingURL=google.d.ts.map