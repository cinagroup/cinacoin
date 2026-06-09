/**
 * Google OAuth2 provider for social login.
 *
 * Implements the Google Sign-In flow using OpenID Connect
 * and returns a JWT token with a derived wallet address.
 *
 * Reference: https://developers.google.com/identity/protocols/oauth2
 */

import type { GoogleLoginParams, SocialLoginResult, OAuth2TokenResponse, OAuth2UserProfile } from '../types.js';
import { TokenVerifier, type TokenVerifyResult } from '../token-verifier.js';

/** Google OAuth2 authorization endpoint. */
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

/** Google OAuth2 token endpoint. */
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

/** Google OAuth2 userinfo endpoint. */
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

/** Google token revoke endpoint. */
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

/** Default scopes for Google Sign-In. */
const DEFAULT_SCOPES = ['openid', 'email', 'profile'];

/**
 * Build the Google OAuth2 authorization URL.
 *
 * @param params - Google login parameters.
 * @returns Authorization URL to redirect the user to.
 */
export function buildGoogleAuthUrl(params: GoogleLoginParams): string {
  const scopes = params.scopes || DEFAULT_SCOPES;
  const state = params.state || generateState();

  const query = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  if (params.hostedDomain) {
    query.set('hd', params.hostedDomain);
  }

  return `${GOOGLE_AUTH_URL}?${query.toString()}`;
}

/**
 * Exchange an authorization code for tokens.
 *
 * @param code - Authorization code from the redirect.
 * @param params - Google login parameters (clientId, redirectUri).
 * @param clientSecret - OAuth2 client secret.
 * @returns OAuth2 token response.
 */
export async function exchangeCodeForTokens(
  code: string,
  params: Pick<GoogleLoginParams, 'clientId' | 'redirectUri'>,
  clientSecret: string
): Promise<OAuth2TokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: params.clientId,
      client_secret: clientSecret,
      redirect_uri: params.redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google token exchange failed: ${error}`);
  }

  return response.json() as Promise<OAuth2TokenResponse>;
}

/**
 * Fetch the user's profile from Google.
 *
 * @param accessToken - OAuth2 access token.
 * @returns User profile data.
 */
export async function fetchGoogleUserProfile(accessToken: string): Promise<OAuth2UserProfile> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google userinfo fetch failed: ${error}`);
  }

  return response.json() as Promise<OAuth2UserProfile>;
}

/**
 * Handle the full Google login flow: code exchange → profile fetch → result.
 *
 * @param code - Authorization code from Google redirect.
 * @param params - Google login parameters.
 * @param clientSecret - OAuth2 client secret.
 * @param deriveWallet - Function to derive a wallet address from the user identity.
 * @returns Social login result.
 */
export async function loginWithGoogle(
  code: string,
  params: GoogleLoginParams & { clientSecret: string },
  deriveWallet: (userId: string, email: string) => Promise<{ address: string; publicKey?: string }>
): Promise<SocialLoginResult> {
  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code, params, params.clientSecret);

  // Server-side token verification
  if (tokens.idToken) {
    const verifier = new TokenVerifier({ googleClientId: params.clientId });
    const verification: TokenVerifyResult = await verifier.verify('google', tokens.idToken);
    if (!verification.valid) {
      throw new Error(`Google ID token verification failed: ${verification.error}`);
    }
  }

  // Get user profile
  const profile = await fetchGoogleUserProfile(tokens.accessToken);

  if (!profile.sub) {
    throw new Error('Google login failed: no user ID in profile');
  }

  // Derive wallet
  const wallet = await deriveWallet(profile.sub, profile.email || '');

  return {
    provider: 'google',
    providerUserId: profile.sub,
    email: profile.email,
    displayName: profile.name,
    profilePicture: profile.picture,
    jwtToken: tokens.idToken || tokens.accessToken,
    walletAddress: wallet.address,
    publicKey: wallet.publicKey,
    isNewUser: false, // Should be determined by checking if wallet exists in your DB
    expiresAt: Math.floor(Date.now() / 1000) + (tokens.expiresIn || 3600),
  };
}

/**
 * Generate a random state parameter for CSRF protection.
 */
function generateState(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

// ─── Class-based Provider ───────────────────────────────────────────────

/**
 * Class-based Google OAuth2 provider.
 *
 * Provides an object-oriented interface for Google Sign-In with
 * init, authorize, handleCallback, verifyToken, getUserInfo, and refreshToken.
 */
export class GoogleOAuthProvider {
  private clientId: string = '';
  private redirectUri: string = '';
  private clientSecret: string = '';
  private hostedDomain?: string;
  private scopes: string[] = DEFAULT_SCOPES;
  private tokenVerifier: TokenVerifier | null = null;

  /**
   * Initialize the provider with credentials.
   *
   * @param clientId - Google OAuth2 client ID.
   * @param redirectUri - OAuth2 redirect URI.
   * @param options - Optional configuration.
   */
  init(
    clientId: string,
    redirectUri: string,
    options?: {
      clientSecret?: string;
      hostedDomain?: string;
      scopes?: string[];
    }
  ): void {
    this.clientId = clientId;
    this.redirectUri = redirectUri;
    if (options?.clientSecret) {
      this.clientSecret = options.clientSecret;
    }
    if (options?.hostedDomain) {
      this.hostedDomain = options.hostedDomain;
    }
    if (options?.scopes) {
      this.scopes = options.scopes;
    }
    this.tokenVerifier = new TokenVerifier({ googleClientId: clientId });
  }

  /**
   * Open the Google OAuth2 authorization window (client-side redirect).
   *
   * @param state - Optional state parameter for CSRF.
   * @returns Authorization URL.
   */
  authorize(state?: string): string {
    if (!this.clientId || !this.redirectUri) {
      throw new Error('GoogleOAuthProvider not initialized. Call init() first.');
    }

    const query = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      state: state || generateState(),
      access_type: 'offline',
      prompt: 'consent',
    });

    if (this.hostedDomain) {
      query.set('hd', this.hostedDomain);
    }

    const url = `${GOOGLE_AUTH_URL}?${query.toString()}`;

    // In browser context, redirect
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }

    return url;
  }

  /**
   * Handle the OAuth2 callback: exchange code for tokens and return them.
   *
   * @param code - Authorization code from Google redirect.
   * @param clientSecret - OAuth2 client secret (required for server-side exchange).
   * @returns Token response with access_token, id_token, and refresh_token.
   */
  async handleCallback(
    code: string,
    clientSecret?: string
  ): Promise<{
    accessToken: string;
    idToken?: string;
    refreshToken?: string;
    expiresIn: number;
    tokenType: string;
  }> {
    const secret = clientSecret || this.clientSecret;
    if (!secret) {
      throw new Error('clientSecret is required for token exchange.');
    }

    const tokens = await exchangeCodeForTokens(code, { clientId: this.clientId, redirectUri: this.redirectUri }, secret);

    return {
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: tokens.tokenType,
    };
  }

  /**
   * Verify a Google ID token.
   *
   * @param token - Google ID token (JWT).
   * @returns Verification result.
   */
  async verifyToken(token: string): Promise<TokenVerifyResult> {
    if (!this.tokenVerifier) {
      throw new Error('GoogleOAuthProvider not initialized. Call init() first.');
    }
    return this.tokenVerifier.verify('google', token);
  }

  /**
   * Get user information from Google using an access token.
   *
   * @param accessToken - Google OAuth2 access token.
   * @returns User profile with email, name, and picture.
   */
  async getUserInfo(accessToken: string): Promise<OAuth2UserProfile> {
    return fetchGoogleUserProfile(accessToken);
  }

  /**
   * Refresh an expired access token using a refresh token.
   *
   * @param refreshToken - Google refresh token.
   * @param clientSecret - Optional client secret override.
   * @returns New token response.
   */
  async refreshToken(
    refreshToken: string,
    clientSecret?: string
  ): Promise<{ accessToken: string; expiresIn: number; tokenType: string; scope?: string }> {
    const secret = clientSecret || this.clientSecret;
    if (!secret) {
      throw new Error('clientSecret is required for token refresh.');
    }

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: secret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google token refresh failed: ${error}`);
    }

    return response.json() as Promise<{ accessToken: string; expiresIn: number; tokenType: string; scope?: string }>;
  }

  /**
   * Revoke a token (access or refresh).
   *
   * @param token - Token to revoke.
   */
  async revokeToken(token: string): Promise<void> {
    const response = await fetch(GOOGLE_REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google token revocation failed: ${error}`);
    }
  }
}
