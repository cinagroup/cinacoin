/**
 * OAuth routes - provider redirect, callback, accounts management
 * Security: tokens are NEVER passed via URL. Callback issues a short-lived
 * authorization code that the frontend exchanges for tokens via POST.
 */
import { Hono } from 'hono';
import type { Env, OAuthProvider } from '../../lib/types.js';
import { requireAuth, type AuthContext } from '../../middleware/auth.js';
import { withRateLimit } from '../../middleware/rate-limit.js';
import { uuidv4, now, addMinutes, sha256 } from '../../lib/utils.js';
import { findUserByEmail, createUser } from '../../db/users.js';
import { generateTokenPair } from '../../lib/jwt.js';
import { toPublicUser } from '../../lib/types.js';
import { encrypt } from '../../lib/encryption.js';

/** Allowed redirect origins – set via ALLOWED_REDIRECT_ORIGINS env var (comma-separated). */
function getAllowedOrigins(env: Env): string[] {
  const raw = (env as unknown).ALLOWED_REDIRECT_ORIGINS;
  if (!raw) return [];
  return raw.split(',').map((o: string) => o.trim()).filter(Boolean);
}

/** Validate return_url against allowed origins to prevent open redirect. */
function isAllowedReturnUrl(url: string, env: Env): boolean {
  const allowed = getAllowedOrigins(env);
  if (allowed.length === 0) {
    // If no origins configured, only allow relative paths
    return url.startsWith('/') && !url.startsWith('//');
  }
  try {
    const parsed = new URL(url, 'https://placeholder.invalid');
    // Allow relative paths
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return url.startsWith('/') && !url.startsWith('//');
    }
    return allowed.some((origin) => parsed.origin === origin);
  } catch {
    return false;
  }
}

/**
 * PKCE (Proof Key for Code Exchange) helpers — RFC 7636
 * Uses S256 method (SHA-256) instead of plain for security.
 */

/** Generate a cryptographically random code_verifier (43–128 chars, base64url). */
function generateCodeVerifier(): string {
  // 32 random bytes → 43 base64url characters (meets RFC 7636 §4.1 length requirement)
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/** Compute code_challenge = BASE64URL(SHA-256(code_verifier)) per RFC 7636 §4.2. */
async function computeCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

/** Base64url encode without padding (RFC 7636 §3). */
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const oauth = new Hono<{ Bindings: Env }>();

/**
 * GET /oauth/:provider - Start OAuth flow
 */
oauth.get('/:provider', withRateLimit('oauth'), async (c) => {
  try {
    const provider = c.req.param('provider') as OAuthProvider;
    const validProviders: OAuthProvider[] = ['google', 'github', 'discord'];

    if (!validProviders.includes(provider)) {
      return c.json({ error: 'Bad Request', message: 'Invalid OAuth provider' }, 400);
    }

    const clientId = c.env[`${provider.toUpperCase()}_CLIENT_ID`];
    if (!clientId) {
      return c.json({ error: 'Internal server error', message: 'OAuth provider not configured' }, 500);
    }

    // Generate state
    const state = uuidv4();

    // Generate PKCE code_verifier and code_challenge (S256 method)
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await computeCodeChallenge(codeVerifier);

    // Store state in KV (includes code_verifier for token exchange)
    await c.env.KV.put(
      `oauth:state:${state}`,
      JSON.stringify({ provider, codeVerifier, createdAt: now() }),
      { expirationTtl: 600 } // 10 minutes
    );

    // Build authorization URL
    const redirectUri = `${new URL(c.req.url).origin}/auth/oauth/${provider}/callback`;
    let authUrl: string;

    switch (provider) {
      case 'google':
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${encodeURIComponent(clientId)}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=${encodeURIComponent('openid email profile')}` +
          `&state=${encodeURIComponent(state)}` +
          `&code_challenge=${encodeURIComponent(codeChallenge)}` +
          `&code_challenge_method=S256`;
        break;
      case 'github':
        authUrl = `https://github.com/login/oauth/authorize?` +
          `client_id=${encodeURIComponent(clientId)}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&scope=${encodeURIComponent('user:email')}` +
          `&state=${encodeURIComponent(state)}`;
        break;
      case 'discord':
        authUrl = `https://discord.com/api/oauth2/authorize?` +
          `client_id=${encodeURIComponent(clientId)}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=${encodeURIComponent('identify email')}` +
          `&state=${encodeURIComponent(state)}`;
        break;
      default:
        return c.json({ error: 'Bad Request', message: 'Unsupported provider' }, 400);
    }

    return c.redirect(authUrl);
  } catch (error) {
    console.error('OAuth start error:', error);
    return c.json({ error: 'Internal server error', message: 'Failed to start OAuth flow' }, 500);
  }
});

/**
 * GET /oauth/:provider/callback - OAuth callback
 */
oauth.get('/:provider/callback', async (c) => {
  try {
    const provider = c.req.param('provider') as OAuthProvider;
    const code = c.req.query('code');
    const state = c.req.query('state');

    if (!code || !state) {
      return c.json({ error: 'Bad Request', message: 'Missing code or state' }, 400);
    }

    // Verify state
    const stateData = await c.env.KV.get(`oauth:state:${state}`, 'json') as {
      provider: string;
      codeVerifier: string;
    } | null;

    if (!stateData || stateData.provider !== provider) {
      return c.json({ error: 'Bad Request', message: 'Invalid or expired state' }, 400);
    }

    // Delete used state
    await c.env.KV.delete(`oauth:state:${state}`);

    // Exchange code for token
    const clientSecret = c.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
    const clientId = c.env[`${provider.toUpperCase()}_CLIENT_ID`];
    const redirectUri = `${new URL(c.req.url).origin}/auth/oauth/${provider}/callback`;

    let tokenResponse: any;

    switch (provider) {
      case 'google':
        tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId!,
            client_secret: clientSecret!,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
            code_verifier: stateData.codeVerifier,
          }),
        });
        break;
      case 'github':
        tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
          }),
        });
        break;
      case 'discord':
        tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: clientId!,
            client_secret: clientSecret!,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });
        break;
      default:
        return c.json({ error: 'Bad Request', message: 'Unsupported provider' }, 400);
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error('OAuth token error:', tokenData);
      return c.json({ error: 'OAuth error', message: 'Failed to get access token' }, 500);
    }

    // Get user profile
    let profile: { id: string; email: string; name?: string };

    switch (provider) {
      case 'google': {
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        profile = await profileRes.json();
        break;
      }
      case 'github': {
        const profileRes = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'User-Agent': 'Cinacoin-Auth',
          },
        });
        const ghProfile = await profileRes.json();
        // Get email if not public
        let email = ghProfile.email;
        if (!email) {
          const emailsRes = await fetch('https://api.github.com/user/emails', {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              'User-Agent': 'Cinacoin-Auth',
            },
          });
          const emails = await emailsRes.json();
          const primary = emails.find((e: any) => e.primary && e.verified);
          email = primary?.email;
        }
        profile = { id: ghProfile.id.toString(), email, name: ghProfile.name || ghProfile.login };
        break;
      }
      case 'discord': {
        const profileRes = await fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const discordProfile = await profileRes.json();
        profile = {
          id: discordProfile.id,
          email: discordProfile.email,
          name: discordProfile.global_name || discordProfile.username,
        };
        break;
      }
      default:
        return c.json({ error: 'Bad Request', message: 'Unsupported provider' }, 400);
    }

    if (!profile.email) {
      return c.json({ error: 'Bad Request', message: 'Email not available from provider' }, 400);
    }

    // Find or create user
    let user = await findUserByEmail(c.env.DB, profile.email);

    if (!user) {
      // Create new user
      const username = profile.name?.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30) ||
        `user_${profile.id.slice(0, 8)}`;

      // Check username uniqueness
      const existingUsername = await c.env.DB
        .prepare('SELECT 1 FROM users WHERE username = ?')
        .bind(username)
        .first();

      const finalUsername = existingUsername ? `${username}_${Date.now().toString(36)}` : username;

      user = await createUser(c.env.DB, {
        email: profile.email,
        username: finalUsername,
        displayName: profile.name || null,
        authType: 'oauth',
      });
    }

    // Store OAuth account link
    // SECURITY: Encrypt access_token before storing (AES-256-GCM)
    const encryptedToken = await encrypt(tokenData.access_token, c.env.ENCRYPTION_KEY);
    await c.env.DB
      .prepare(
        `INSERT OR REPLACE INTO oauth_accounts
         (id, user_id, provider, provider_user_id, provider_email, access_token, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        uuidv4(),
        user.id,
        provider,
        profile.id,
        profile.email,
        encryptedToken,
        now(),
        now()
      )
      .run();

    // Generate tokens
    const tokens = await generateTokenPair(
      { sub: user.id, email: user.email, role: user.role },
      c.env
    );

    // SECURITY FIX: Never pass tokens in URL.
    // Instead, generate a short-lived authorization code and redirect with it.
    // The frontend exchanges this code for tokens via POST /auth/oauth/token.
    const authCode = uuidv4() + uuidv4(); // 64+ char random code
    const codeHash = await sha256(authCode);

    // Store the authorization code in KV with a short TTL (2 minutes)
    await c.env.KV.put(
      `oauth:code:${codeHash}`,
      JSON.stringify({
        userId: user.id,
        email: user.email,
        role: user.role,
        provider,
        createdAt: now(),
      }),
      { expirationTtl: 120 } // 2 minutes
    );

    // Validate return_url to prevent open redirect
    const returnUrl = c.req.query('return_url') || '/';
    const safeReturnUrl = isAllowedReturnUrl(returnUrl, c.env) ? returnUrl : '/';

    // Build the redirect URL with only the authorization code
    const separator = safeReturnUrl.includes('?') ? '&' : '?';
    return c.redirect(`${safeReturnUrl}${separator}code=${authCode}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.json({ error: 'Internal server error', message: 'OAuth callback failed' }, 500);
  }
});

/**
 * POST /oauth/token - Exchange authorization code for tokens
 * This is the secure second step of the OAuth flow.
 */
oauth.post('/token', withRateLimit('oauth'), async (c) => {
  try {
    const body = await c.req.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return c.json({ error: 'Bad Request', message: 'Authorization code required' }, 400);
    }

    // Hash the code to look it up securely
    const codeHash = await sha256(code);

    // Retrieve the stored authorization data
    const stored = await c.env.KV.get(`oauth:code:${codeHash}`, 'json') as {
      userId: string;
      email: string;
      role: string;
      provider: string;
      createdAt: string;
    } | null;

    if (!stored) {
      return c.json({ error: 'Invalid or expired authorization code' }, 400);
    }

    // Delete the code immediately (one-time use)
    await c.env.KV.delete(`oauth:code:${codeHash}`);

    // Generate the actual tokens
    const tokens = await generateTokenPair(
      { sub: stored.userId, email: stored.email, role: stored.role },
      c.env
    );

    // Return tokens in response body (not URL)
    return c.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
      },
    });
  } catch (error) {
    console.error('OAuth token exchange error:', error);
    return c.json({ error: 'Internal server error', message: 'Token exchange failed' }, 500);
  }
});

/**
 * GET /oauth/accounts - Get linked OAuth accounts
 */
oauth.get('/accounts', requireAuth, async (c: AuthContext) => {
  try {
    const user = c.get('user');

    const accounts = await c.env.DB
      .prepare('SELECT * FROM oauth_accounts WHERE user_id = ? ORDER BY created_at ASC')
      .bind(user.sub)
      .all();

    return c.json({
      success: true,
      data: accounts.results.map((acc: any) => ({
        id: acc.id,
        provider: acc.provider,
        providerUserId: acc.provider_user_id,
        providerEmail: acc.provider_email,
        scope: acc.scope,
        createdAt: acc.created_at,
      })),
    });
  } catch (error) {
    console.error('OAuth accounts error:', error);
    return c.json({ error: 'Internal server error', message: 'Failed to get accounts' }, 500);
  }
});

export default oauth;
