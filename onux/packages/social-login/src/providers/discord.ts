/**
 * Discord OAuth2 provider for social login.
 *
 * Implements the Discord Sign-In flow using OAuth2 PKCE
 * and returns user profile data with a derived wallet address.
 *
 * Reference: https://discord.com/developers/docs/topics/oauth2
 */

import type { SocialLoginResult, OAuth2UserProfile } from '../types.js';
import { TokenVerifier, type TokenVerifyResult } from '../token-verifier.js';

/** Discord OAuth2 authorization endpoint. */
const DISCORD_AUTH_URL = 'https://discord.com/api/oauth2/authorize';

/** Discord OAuth2 token endpoint. */
const DISCORD_TOKEN_URL = 'https://discord.com/api/oauth2/token';

/** Discord API current user endpoint. */
const DISCORD_ME_URL = 'https://discord.com/api/users/@me';

/** Default scopes for Discord Sign-In. */
const DEFAULT_SCOPES = ['identify', 'email'];

/**
 * Generate a PKCE code verifier and challenge.
 *
 * @returns Object with codeVerifier and codeChallenge.
 */
export async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = base64URLEncode(await sha256(codeVerifier));
  return { codeVerifier, codeChallenge };
}

/**
 * Build the Discord OAuth2 authorization URL with PKCE.
 *
 * @param params - Discord login parameters.
 * @param codeChallenge - PKCE code challenge.
 * @returns Authorization URL.
 */
export function buildDiscordAuthUrl(
  params: {
    clientId: string;
    redirectUri: string;
    scopes?: string[];
    state?: string;
  },
  codeChallenge: string
): string {
  const scopes = params.scopes || DEFAULT_SCOPES;
  const state = params.state || generateState();

  const query = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${DISCORD_AUTH_URL}?${query.toString()}`;
}

/**
 * Exchange an authorization code for tokens.
 *
 * @param code - Authorization code from the redirect.
 * @param clientId - Discord OAuth app client ID.
 * @param redirectUri - Redirect URI.
 * @param codeVerifier - PKCE code verifier.
 * @param clientSecret - OAuth2 client secret.
 * @returns OAuth2 token response.
 */
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  redirectUri: string,
  codeVerifier: string,
  clientSecret: string
): Promise<{
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string;
  scope: string;
}> {
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(DISCORD_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Discord token exchange failed: ${error}`);
  }

  return response.json() as Promise<{
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    refreshToken: string;
    scope: string;
  }>;
}

/**
 * Fetch the user's profile from Discord.
 *
 * @param accessToken - OAuth2 access token.
 * @returns User profile data.
 */
export async function fetchDiscordUserProfile(accessToken: string): Promise<OAuth2UserProfile> {
  const response = await fetch(DISCORD_ME_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Discord user fetch failed: ${error}`);
  }

  const data = await response.json() as Record<string, unknown>;

  // Build avatar URL
  let picture: string | undefined;
  if (data.avatar && data.id) {
    const ext = (data.avatar as string).startsWith('a_') ? 'gif' : 'png';
    picture = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.${ext}?size=128`;
  } else if (data.discriminator === '0') {
    // Default avatar based on user ID
    const defaultAvatarIndex = Number(BigInt(data.id as string) >> 22n) % 5;
    picture = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
  }

  return {
    sub: String(data.id || ''),
    email: (data.email as string) || undefined,
    name: (data.global_name as string) || (data.username as string) || '',
    picture,
    emailVerified: data.verified === true,
  };
}

/**
 * Handle the full Discord login flow.
 *
 * @param code - Authorization code from Discord redirect.
 * @param params - Discord login parameters.
 * @param codeVerifier - PKCE code verifier.
 * @param deriveWallet - Function to derive a wallet address.
 * @returns Social login result.
 */
export async function loginWithDiscord(
  code: string,
  params: {
    clientId: string;
    redirectUri: string;
    clientSecret: string;
  },
  codeVerifier: string,
  deriveWallet: (userId: string, email: string) => Promise<{ address: string; publicKey?: string }>
): Promise<SocialLoginResult> {
  const tokens = await exchangeCodeForTokens(
    code,
    params.clientId,
    params.redirectUri,
    codeVerifier,
    params.clientSecret
  );

  // Server-side token verification via Discord API
  const verifier = new TokenVerifier();
  const verification: TokenVerifyResult = await verifier.verify('discord', tokens.accessToken);
  if (!verification.valid) {
    throw new Error(`Discord access token verification failed: ${verification.error}`);
  }

  const profile = await fetchDiscordUserProfile(tokens.accessToken);

  if (!profile.sub) {
    throw new Error('Discord login failed: no user ID in profile');
  }

  const wallet = await deriveWallet(profile.sub, profile.email || '');

  return {
    provider: 'discord',
    providerUserId: profile.sub,
    email: profile.email,
    displayName: profile.name,
    profilePicture: profile.picture,
    jwtToken: tokens.accessToken,
    walletAddress: wallet.address,
    publicKey: wallet.publicKey,
    isNewUser: false,
    expiresAt: Math.floor(Date.now() / 1000) + tokens.expiresIn,
  };
}

// ─── Utility functions ─────────────────────────────────────────────────

function generateRandomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64URLEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function sha256(input: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
}

function generateState(): string {
  return generateRandomString(32);
}
