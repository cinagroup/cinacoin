/**
 * Twitter/X OAuth2 provider for social login.
 *
 * Implements Twitter OAuth2 PKCE flow for authentication
 * and returns a JWT token with a derived wallet address.
 *
 * Reference: https://developer.twitter.com/en/docs/authentication/oauth-2-0
 */
import type { TwitterLoginParams, SocialLoginResult, OAuth2UserProfile } from '../types.js';
/**
 * Generate a PKCE code verifier and challenge.
 *
 * @returns Object with codeVerifier and codeChallenge.
 */
export declare function generatePKCE(): {
    codeVerifier: string;
    codeChallenge: string;
};
/**
 * Build the Twitter OAuth2 authorization URL with PKCE.
 *
 * @param params - Twitter login parameters.
 * @param codeChallenge - PKCE code challenge.
 * @returns Authorization URL to redirect the user to.
 */
export declare function buildTwitterAuthUrl(params: TwitterLoginParams, codeChallenge: string): string;
/**
 * Exchange an authorization code for tokens with Twitter.
 *
 * @param code - Authorization code from Twitter redirect.
 * @param params - Twitter login parameters.
 * @param codeVerifier - PKCE code verifier.
 * @returns Token response with access token.
 */
export declare function exchangeTwitterCode(code: string, params: TwitterLoginParams, codeVerifier: string): Promise<{
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    scope: string;
}>;
/**
 * Fetch the user's profile from Twitter API v2.
 *
 * @param accessToken - OAuth2 access token.
 * @param fields - Optional user fields to request.
 * @returns User profile data.
 */
export declare function fetchTwitterUserProfile(accessToken: string, fields?: string[]): Promise<OAuth2UserProfile & {
    username?: string;
}>;
/**
 * Handle the full Twitter login flow.
 *
 * @param code - Authorization code from Twitter redirect.
 * @param params - Twitter login parameters.
 * @param codeVerifier - PKCE code verifier.
 * @param deriveWallet - Function to derive a wallet address.
 * @returns Social login result.
 */
export declare function loginWithTwitter(code: string, params: TwitterLoginParams, codeVerifier: string, deriveWallet: (userId: string, username: string) => Promise<{
    address: string;
    publicKey?: string;
}>): Promise<SocialLoginResult>;
//# sourceMappingURL=twitter.d.ts.map