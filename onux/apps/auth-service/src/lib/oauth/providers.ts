/**
 * OAuth 2.0 Provider Configuration
 * Uses arctic library for OAuth 2.0 / OIDC flows
 */
import { Google, GitHub, Discord } from 'arctic';
import { getConfig } from '../config.js';
import type { OAuthProvider, OAuthUserProfile } from '../types.js';

/**
 * Get OAuth provider instance
 */
export function getOAuthProvider(provider: OAuthProvider) {
  const config = getConfig().oauth[provider];

  if (!config.clientId || !config.clientSecret) {
    throw new Error(`OAuth provider ${provider} is not configured`);
  }

  switch (provider) {
    case 'google':
      return new Google(
        config.clientId,
        config.clientSecret,
        config.redirectUri
      );
    case 'github':
      return new GitHub(
        config.clientId,
        config.clientSecret,
        config.redirectUri
      );
    case 'discord':
      return new Discord(
        config.clientId,
        config.clientSecret,
        config.redirectUri
      );
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
}

/**
 * Get OAuth authorization URL with state
 * Note: arctic v3 createAuthorizationURL is synchronous
 * For Google, codeVerifier is required for PKCE
 */
export function getAuthorizationUrl(
  provider: OAuthProvider,
  state: string,
  codeVerifier?: string
): { url: URL; state: string } {
  const oauthProvider = getOAuthProvider(provider);
  const scopes = getProviderScopes(provider);

  let url: URL;

  // arctic v3: Google requires codeVerifier for PKCE
  if (provider === 'google') {
    if (!codeVerifier) {
      throw new Error('Google OAuth requires a code verifier for PKCE');
    }
    url = oauthProvider.createAuthorizationURL(state, codeVerifier, scopes);
    // Request offline access for refresh tokens
    url.searchParams.set('access_type', 'offline');
  } else {
    // GitHub and Discord don't require PKCE
    url = oauthProvider.createAuthorizationURL(state, scopes);
  }

  return { url, state };
}

/**
 * Validate OAuth callback and get user profile
 */
export async function validateCallback(
  provider: OAuthProvider,
  code: string,
  codeVerifier?: string
): Promise<OAuthUserProfile> {
  const oauthProvider = getOAuthProvider(provider);

  let tokens: any;

  if (codeVerifier && provider === 'google') {
    tokens = await oauthProvider.validateAuthorizationCode(code, codeVerifier);
  } else {
    tokens = await oauthProvider.validateAuthorizationCode(code);
  }

  const accessToken = tokens.accessToken();

  // Fetch user profile from provider
  switch (provider) {
    case 'google':
      return fetchGoogleProfile(accessToken);
    case 'github':
      return fetchGitHubProfile(accessToken);
    case 'discord':
      return fetchDiscordProfile(accessToken);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Get default scopes for each provider
 */
function getProviderScopes(provider: OAuthProvider): string[] {
  switch (provider) {
    case 'google':
      return ['openid', 'profile', 'email'];
    case 'github':
      return ['user:email'];
    case 'discord':
      return ['identify', 'email'];
    default:
      return [];
  }
}

/**
 * Fetch Google user profile
 */
async function fetchGoogleProfile(accessToken: string): Promise<OAuthUserProfile> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Google profile');
  }

  const data = await response.json();

  return {
    id: data.id,
    email: data.email,
    emailVerified: data.verified_email === true,
    name: data.name,
    displayName: data.name,
    avatarUrl: data.picture,
    raw: data,
  };
}

/**
 * Fetch GitHub user profile
 */
async function fetchGitHubProfile(accessToken: string): Promise<OAuthUserProfile> {
  // Fetch user info
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'Cinacoin-Auth-Service',
    },
  });

  if (!userResponse.ok) {
    throw new Error('Failed to fetch GitHub profile');
  }

  const userData = await userResponse.json();

  // Fetch email (GitHub requires separate endpoint)
  let email: string | null = userData.email;
  if (!email) {
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'Cinacoin-Auth-Service',
      },
    });

    if (emailsResponse.ok) {
      const emails = await emailsResponse.json();
      const primaryEmail = emails.find((e: any) => e.primary && e.verified);
      if (primaryEmail) {
        email = primaryEmail.email;
      }
    }
  }

  return {
    id: String(userData.id),
    email,
    emailVerified: true, // GitHub emails are verified
    name: userData.name,
    displayName: userData.login,
    avatarUrl: userData.avatar_url,
    raw: userData,
  };
}

/**
 * Fetch Discord user profile
 */
async function fetchDiscordProfile(accessToken: string): Promise<OAuthUserProfile> {
  const response = await fetch('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Discord profile');
  }

  const data = await response.json();

  // Discord avatar URL construction
  let avatarUrl: string | null = null;
  if (data.avatar) {
    avatarUrl = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`;
  }

  return {
    id: data.id,
    email: data.email,
    emailVerified: data.verified === true,
    name: data.global_name || data.username,
    displayName: data.username,
    avatarUrl,
    raw: data,
  };
}

/**
 * Check if a provider is configured and available
 */
export function isProviderConfigured(provider: OAuthProvider): boolean {
  try {
    const config = getConfig().oauth[provider];
    return !!(config.clientId && config.clientSecret);
  } catch {
    return false;
  }
}

/**
 * Get list of available OAuth providers
 */
export function getAvailableProviders(): OAuthProvider[] {
  const providers: OAuthProvider[] = ['google', 'github', 'discord'];
  return providers.filter(isProviderConfigured);
}
