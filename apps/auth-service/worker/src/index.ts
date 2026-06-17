import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie, setCookie } from 'hono/cookie';
import type { Env } from './env';
import { hashPassword, verifyPassword } from './lib/password';
import { createAccessToken, createRefreshToken, verifyAccessToken, verifyRefreshToken } from './lib/jwt';
import { registerSchema, loginSchema, mfaVerifySchema, updateUserSchema } from './lib/validation';
import {
  oauthCallbackSchema,
  emailConfirmSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  adminSettingsSchema,
  adminUsersListSchema,
} from './lib/validation';
import { generateMFASecret, verifyTOTP, generateTOTPUri } from './lib/mfa';

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use('*', cors({
  origin: ['https://auth.cinacoin.com', 'https://cinacoin.com', 'https://cinacoin-auth.pages.dev', 'http://localhost:3000'],
  credentials: true,
}));

// Health check
app.get('/', (c) => c.json({ status: 'ok', service: 'cinacoin-auth' }));

// ============ Helper Functions ============

async function requireAdmin(c: any, env: Env): Promise<string | null> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    c.json({ error: 'Unauthorized' }, 401);
    return null;
  }

  const payload = await verifyAccessToken(authHeader.split(' ')[1], env.JWT_SECRET);
  if (!payload) {
    c.json({ error: 'Invalid token' }, 401);
    return null;
  }

  const user = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(payload.userId).first() as any;
  if (!user || user.role !== 'admin') {
    c.json({ error: 'Admin access required' }, 403);
    return null;
  }

  return payload.userId;
}

async function getSystemSetting(db: D1Database, key: string): Promise<string | null> {
  const row = await db.prepare('SELECT value FROM system_settings WHERE key = ?').bind(key).first() as any;
  return row?.value || null;
}

async function setSystemSetting(db: D1Database, key: string, value: string, description: string, updatedBy: string): Promise<void> {
  await db.prepare(`
    INSERT INTO system_settings (key, value, description, updated_at, updated_by)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = ?, description = ?, updated_at = ?, updated_by = ?
  `).bind(key, value, description, Date.now(), updatedBy, value, description, Date.now(), updatedBy).run();
}

// ============ Auth Endpoints ============

// POST /api/auth/register
app.post('/api/auth/register', async (c) => {
  try {
    const body = await c.req.json();
    const validated = registerSchema.parse(body);
    const db = c.env.DB;
    
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(validated.email).first();
    if (existing) return c.json({ error: 'Email already registered' }, 400);
    
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(validated.password);
    const now = Date.now();
    
    await db.prepare('INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(userId, validated.email, passwordHash, validated.name || null, 'user', now, now).run();
    await db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').bind(userId).run();
    
    const accessToken = await createAccessToken(userId, validated.email, c.env.JWT_SECRET);
    const refreshToken = await createRefreshToken(userId, c.env.JWT_REFRESH_SECRET);
    
    const sessionId = crypto.randomUUID();
    await db.prepare('INSERT INTO sessions (id, user_id, refresh_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(sessionId, userId, refreshToken, now + 7 * 86400000, now).run();
    
    setCookie(c, 'refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 7 * 86400,
      path: '/',
    });
    
    return c.json({ user: { id: userId, email: validated.email, name: validated.name }, accessToken });
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const validated = loginSchema.parse(body);
    const db = c.env.DB;
    
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(validated.email).first() as any;
    if (!user) return c.json({ error: 'Invalid credentials' }, 401);
    
    const valid = await verifyPassword(validated.password, user.password_hash);
    if (!valid) return c.json({ error: 'Invalid credentials' }, 401);
    
    if (user.mfa_enabled) {
      return c.json({ error: 'MFA required', mfaRequired: true, userId: user.id });
    }
    
    const accessToken = await createAccessToken(user.id, user.email, c.env.JWT_SECRET);
    const refreshToken = await createRefreshToken(user.id, c.env.JWT_REFRESH_SECRET);
    
    const sessionId = crypto.randomUUID();
    const now = Date.now();
    await db.prepare('INSERT INTO sessions (id, user_id, refresh_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(sessionId, user.id, refreshToken, now + 7 * 86400000, now).run();
    
    setCookie(c, 'refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 7 * 86400,
      path: '/',
    });
    
    return c.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, accessToken });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', async (c) => {
  try {
    const refreshToken = getCookie(c, 'refresh_token');
    if (refreshToken) {
      await c.env.DB.prepare('DELETE FROM sessions WHERE refresh_token = ?').bind(refreshToken).run();
    }
    setCookie(c, 'refresh_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 0,
      path: '/',
    });
    return c.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Logout failed' }, 500);
  }
});

// POST /api/auth/refresh
app.post('/api/auth/refresh', async (c) => {
  try {
    const refreshToken = getCookie(c, 'refresh_token');
    if (!refreshToken) return c.json({ error: 'No refresh token' }, 401);

    const payload = await verifyRefreshToken(refreshToken, c.env.JWT_REFRESH_SECRET);
    if (!payload) return c.json({ error: 'Invalid refresh token' }, 401);

    // Check session still exists (not logged out)
    const session = await c.env.DB.prepare(
      'SELECT id FROM sessions WHERE refresh_token = ? AND user_id = ? AND expires_at > ?'
    ).bind(refreshToken, payload.userId, Date.now()).first();
    if (!session) return c.json({ error: 'Session expired or revoked' }, 401);

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.userId).first() as any;
    if (!user) return c.json({ error: 'User not found' }, 404);

    const accessToken = await createAccessToken(user.id, user.email, c.env.JWT_SECRET);
    return c.json({ accessToken });
  } catch (error) {
    console.error('Refresh error:', error);
    return c.json({ error: 'Refresh failed' }, 500);
  }
});

// POST /api/auth/mfa/setup
app.post('/api/auth/mfa/setup', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);

    const payload = await verifyAccessToken(authHeader.split(' ')[1], c.env.JWT_SECRET);
    if (!payload) return c.json({ error: 'Invalid token' }, 401);

    const secret = generateMFASecret();
    await c.env.DB.prepare('UPDATE users SET mfa_secret = ? WHERE id = ?').bind(secret, payload.userId).run();

    const uri = generateTOTPUri(payload.email, secret);
    return c.json({ secret, uri });
  } catch (error) {
    return c.json({ error: 'MFA setup failed' }, 500);
  }
});

// POST /api/auth/mfa/verify
app.post('/api/auth/mfa/verify', async (c) => {
  try {
    const body = await c.req.json();
    const validated = mfaVerifySchema.parse(body);
    const db = c.env.DB;

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(validated.userId).first() as any;
    if (!user?.mfa_secret) return c.json({ error: 'MFA not set up' }, 400);

    const isValid = await verifyTOTP(validated.code, user.mfa_secret);
    if (!isValid) return c.json({ error: 'Invalid MFA code' }, 401);

    if (!user.mfa_enabled) {
      await db.prepare('UPDATE users SET mfa_enabled = 1 WHERE id = ?').bind(validated.userId).run();
    }

    const accessToken = await createAccessToken(user.id, user.email, c.env.JWT_SECRET);
    const refreshToken = await createRefreshToken(user.id, c.env.JWT_REFRESH_SECRET);

    const sessionId = crypto.randomUUID();
    const now = Date.now();
    await db.prepare('INSERT INTO sessions (id, user_id, refresh_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(sessionId, user.id, refreshToken, now + 7 * 86400000, now).run();

    setCookie(c, 'refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 7 * 86400,
      path: '/',
    });
    
    return c.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, accessToken });
  } catch (error) {
    return c.json({ error: 'MFA verification failed' }, 500);
  }
});

// GET /api/auth/user
app.get('/api/auth/user', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);

    const payload = await verifyAccessToken(authHeader.split(' ')[1], c.env.JWT_SECRET);
    if (!payload) return c.json({ error: 'Invalid token' }, 401);

    const user = await c.env.DB.prepare(`
      SELECT u.id, u.email, u.name, u.avatar_url, u.role, u.mfa_enabled, u.created_at,
             s.theme, s.locale, s.notifications_enabled
      FROM users u LEFT JOIN user_settings s ON u.id = s.user_id
      WHERE u.id = ?
    `).bind(payload.userId).first() as any;

    if (!user) return c.json({ error: 'User not found' }, 404);

    return c.json({
      user: {
        id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url,
        role: user.role || 'user', mfa_enabled: !!user.mfa_enabled, created_at: user.created_at,
        settings: { theme: user.theme || 'dark', locale: user.locale || 'en', notifications_enabled: !!user.notifications_enabled },
      },
    });
  } catch (error) {
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// PUT /api/auth/user
app.put('/api/auth/user', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);

    const payload = await verifyAccessToken(authHeader.split(' ')[1], c.env.JWT_SECRET);
    if (!payload) return c.json({ error: 'Invalid token' }, 401);

    const body = await c.req.json();
    const validated = updateUserSchema.parse(body);
    const db = c.env.DB;

    if (validated.name !== undefined || validated.avatar_url !== undefined) {
      const updates: string[] = ['updated_at = ?'];
      const values: any[] = [Date.now()];
      if (validated.name !== undefined) { updates.unshift('name = ?'); values.unshift(validated.name); }
      if (validated.avatar_url !== undefined) { updates.unshift('avatar_url = ?'); values.unshift(validated.avatar_url); }
      values.push(payload.userId);
      await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
    }

    if (validated.theme || validated.locale || validated.notifications_enabled !== undefined) {
      await db.prepare(`
        INSERT INTO user_settings (user_id, theme, locale, notifications_enabled)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          theme = COALESCE(excluded.theme, theme),
          locale = COALESCE(excluded.locale, locale),
          notifications_enabled = COALESCE(excluded.notifications_enabled, notifications_enabled)
      `).bind(
        payload.userId, validated.theme || 'dark', validated.locale || 'en',
        validated.notifications_enabled ? 1 : 0
      ).run();
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// ============ OAuth Endpoints ============

// GET /api/auth/oauth/providers - Get enabled OAuth providers
app.get('/api/auth/oauth/providers', async (c) => {
  try {
    const db = c.env.DB;
    const providers: { name: string; enabled: boolean }[] = [];

    // Check GitHub
    const githubClientId = await getSystemSetting(db, 'oauth_github_client_id');
    providers.push({ name: 'github', enabled: !!githubClientId });

    // Check Google
    const googleClientId = await getSystemSetting(db, 'oauth_google_client_id');
    providers.push({ name: 'google', enabled: !!googleClientId });

    // Check Discord
    const discordClientId = await getSystemSetting(db, 'oauth_discord_client_id');
    providers.push({ name: 'discord', enabled: !!discordClientId });

    // Check Apple
    const appleClientId = await getSystemSetting(db, 'oauth_apple_client_id');
    providers.push({ name: 'apple', enabled: !!appleClientId });

    return c.json({ providers });
  } catch (error) {
    return c.json({ error: 'Failed to get providers' }, 500);
  }
});

// GET /api/auth/oauth/:provider - Start OAuth flow
app.get('/api/auth/oauth/:provider', async (c) => {
  try {
    const provider = c.req.param('provider');
    const redirectUri = c.req.query('redirect_uri') || '';
    const db = c.env.DB;

    // SECURITY: Validate redirect_uri against allowlist to prevent open redirect
    const allowedRedirectUris = (await getSystemSetting(db, 'oauth_allowed_redirect_uris')) ||
      'https://cinacoin.com,https://app.cinacoin.com,https://cinacoin-auth.pages.dev';
    const allowedList = allowedRedirectUris.split(',').map(uri => uri.trim());

    if (redirectUri && !allowedList.includes(redirectUri)) {
      return c.json({ error: 'Invalid redirect_uri' }, 400);
    }

    // Use first allowed URI as default if none provided
    const safeRedirectUri = redirectUri || allowedList[0];

    const state = crypto.randomUUID();
    // Store state for CSRF protection
    await db.prepare('INSERT INTO system_settings (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)')
      .bind(`oauth_state_${state}`, JSON.stringify({ provider, redirectUri: safeRedirectUri, createdAt: Date.now() }), Date.now(), 'system').run();

    if (provider === 'github') {
      const clientId = await getSystemSetting(db, 'oauth_github_client_id');
      if (!clientId) {
        return c.json({ error: 'GitHub OAuth not configured' }, 400);
      }

      const scope = 'read:user user:email';
      const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(safeRedirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

      return c.json({ url, state });
    }

    if (provider === 'google') {
      const clientId = await getSystemSetting(db, 'oauth_google_client_id');
      if (!clientId) {
        return c.json({ error: 'Google OAuth not configured' }, 400);
      }

      const callbackUrl = safeRedirectUri || 'https://auth.cinacoin.com/api/auth/google/callback';
      const scope = 'openid email profile';
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: 'code',
        scope,
        state,
        access_type: 'offline',
        prompt: 'consent',
      });

      const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      return c.json({ url, state });
    }

    if (provider === 'discord') {
      const clientId = await getSystemSetting(db, 'oauth_discord_client_id');
      if (!clientId) {
        return c.json({ error: 'Discord OAuth not configured' }, 400);
      }

      const callbackUrl = redirectUri || 'https://auth.cinacoin.com/api/auth/discord/callback';
      const scope = 'identify email';
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: 'code',
        scope,
        state,
      });

      const url = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
      return c.json({ url, state });
    }

    if (provider === 'apple') {
      const clientId = await getSystemSetting(db, 'oauth_apple_client_id');
      if (!clientId) {
        return c.json({ error: 'Apple OAuth not configured' }, 400);
      }

      const callbackUrl = redirectUri || 'https://auth.cinacoin.com/api/auth/apple/callback';
      const nonce = crypto.randomUUID();
      const scope = 'name email';
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: 'code id_token',
        scope,
        state,
        nonce,
        response_mode: 'form_post',
      });

      // Store nonce for Apple
      await db.prepare('INSERT INTO system_settings (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)')
        .bind(`oauth_nonce_${state}`, nonce, Date.now(), 'system').run();

      const url = `https://appleid.apple.com/auth/authorize?${params.toString()}`;
      return c.json({ url, state, nonce });
    }

    return c.json({ error: 'Unsupported provider' }, 400);
  } catch (error) {
    return c.json({ error: 'OAuth start failed' }, 500);
  }
});

// POST /api/auth/oauth/callback - Handle OAuth callback
app.post('/api/auth/oauth/callback', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = oauthCallbackSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, 400);
    }
    const { provider, code, state, idToken } = parsed.data;
    const db = c.env.DB;

    // Verify state
    const stateRow = await db.prepare('SELECT value FROM system_settings WHERE key = ?').bind(`oauth_state_${state}`).first() as any;
    if (!stateRow) {
      return c.json({ error: 'Invalid state' }, 400);
    }
    // Clean up state
    await db.prepare('DELETE FROM system_settings WHERE key = ?').bind(`oauth_state_${state}`).run();

    let providerUserId: string;
    let email: string | null;
    let name: string | null;
    let avatarUrl: string | null;
    let accessToken: string;
    let refreshToken: string | null = null;

    if (provider === 'github') {
      // Exchange code for token
      const clientId = await getSystemSetting(db, 'oauth_github_client_id');
      const clientSecret = await getSystemSetting(db, 'oauth_github_client_secret');

      if (!clientId || !clientSecret) {
        return c.json({ error: 'OAuth not configured' }, 500);
      }

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, state }),
      });
      const tokenData = await tokenRes.json() as any;

      if (tokenData.error) {
        return c.json({ error: tokenData.error_description || 'OAuth failed' }, 400);
      }

      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token || null;

      // Get user info from GitHub
      const userRes = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      });
      const githubUser = await userRes.json() as any;

      providerUserId = String(githubUser.id);
      name = githubUser.name || githubUser.login;
      avatarUrl = githubUser.avatar_url;

      // Get email if not public
      email = githubUser.email;
      if (!email) {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        const emails = await emailsRes.json() as any[];
        const primary = emails.find((e: any) => e.primary && e.verified);
        email = primary?.email;
      }

      if (!email) {
        return c.json({ error: 'Could not get email from GitHub' }, 400);
      }
    } else if (provider === 'google') {
      const clientId = await getSystemSetting(db, 'oauth_google_client_id');
      const clientSecret = await getSystemSetting(db, 'oauth_google_client_secret');

      if (!clientId || !clientSecret) {
        return c.json({ error: 'Google OAuth not configured' }, 500);
      }

      const callbackUrl = redirectUri || 'https://auth.cinacoin.com/api/auth/google/callback';

      // Exchange code for tokens
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: callbackUrl,
        }),
      });

      const tokens = await tokenRes.json() as any;

      if (tokens.error) {
        return c.json({ error: tokens.error_description || 'Google OAuth failed' }, 400);
      }

      accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token || null;

      // Get user info
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const userInfo = await userRes.json() as any;

      providerUserId = userInfo.id;
      email = userInfo.email;
      name = userInfo.name;
      avatarUrl = userInfo.picture;

      if (!email) {
        return c.json({ error: 'Could not get email from Google' }, 400);
      }
    } else if (provider === 'discord') {
      const clientId = await getSystemSetting(db, 'oauth_discord_client_id');
      const clientSecret = await getSystemSetting(db, 'oauth_discord_client_secret');

      if (!clientId || !clientSecret) {
        return c.json({ error: 'Discord OAuth not configured' }, 500);
      }

      const callbackUrl = redirectUri || 'https://auth.cinacoin.com/api/auth/discord/callback';

      // Exchange code for tokens
      const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: callbackUrl,
        }),
      });

      const tokens = await tokenRes.json() as any;

      if (tokens.error) {
        return c.json({ error: tokens.error_description || 'Discord OAuth failed' }, 400);
      }

      accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token || null;

      // Get user info
      const userRes = await fetch('https://discord.com/api/users/@me', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const userInfo = await userRes.json() as any;

      providerUserId = userInfo.id;
      email = userInfo.email;
      name = userInfo.username;
      avatarUrl = userInfo.avatar
        ? `https://cdn.discordapp.com/avatars/${userInfo.id}/${userInfo.avatar}.png`
        : null;

      if (!email) {
        return c.json({ error: 'Could not get email from Discord' }, 400);
      }
    } else if (provider === 'apple') {
      const clientId = await getSystemSetting(db, 'oauth_apple_client_id');
      const clientSecret = await getSystemSetting(db, 'oauth_apple_client_secret');

      if (!clientId || !clientSecret) {
        return c.json({ error: 'Apple OAuth not configured' }, 500);
      }

      const callbackUrl = redirectUri || 'https://auth.cinacoin.com/api/auth/apple/callback';

      // Clean up nonce
      await db.prepare('DELETE FROM system_settings WHERE key = ?').bind(`oauth_nonce_${state}`).run();

      // Exchange code for tokens
      const tokenRes = await fetch('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: callbackUrl,
        }),
      });

      const tokens = await tokenRes.json() as any;

      if (tokens.error) {
        return c.json({ error: tokens.error_description || 'Apple OAuth failed' }, 400);
      }

      accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token || null;

      // Decode Apple's id_token to get user info
      const idTokenToDecode = idToken || tokens.id_token;
      if (!idTokenToDecode) {
        return c.json({ error: 'No id_token received from Apple' }, 400);
      }

      const payload = JSON.parse(atob(idTokenToDecode.split('.')[1])) as any;

      providerUserId = payload.sub;
      email = payload.email;
      name = null; // Apple doesn't provide name in token after first auth
      avatarUrl = null;

      if (!email) {
        return c.json({ error: 'Could not get email from Apple' }, 400);
      }
    } else {
      return c.json({ error: 'Unsupported provider' }, 400);
    }

    // Check if user exists
    let user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first() as any;
    let isNewUser = false;

    if (!user) {
      // Create new user
      isNewUser = true;
      const userId = crypto.randomUUID();
      const now = Date.now();

      await db.prepare('INSERT INTO users (id, email, name, avatar_url, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(userId, email, name, avatarUrl, 'user', now, now).run();
      await db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').bind(userId).run();

      user = { id: userId, email, name, avatar_url: avatarUrl, role: 'user' };
    }

    // Link OAuth account
    const existingOAuth = await db.prepare('SELECT id FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?')
      .bind(provider, providerUserId).first();

    if (!existingOAuth) {
      await db.prepare('INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, access_token, refresh_token, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), user.id, provider, providerUserId, accessToken, refreshToken, Date.now()).run();
    }

    // Generate tokens
    const jwtAccessToken = await createAccessToken(user.id, user.email, c.env.JWT_SECRET);
    const jwtRefreshToken = await createRefreshToken(user.id, c.env.JWT_REFRESH_SECRET);

    const sessionId = crypto.randomUUID();
    const now = Date.now();
    await db.prepare('INSERT INTO sessions (id, user_id, refresh_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(sessionId, user.id, jwtRefreshToken, now + 7 * 86400000, now).run();

    c.header('Set-Cookie', `refresh_token=${jwtRefreshToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 86400}; Path=/`, { append: true });

    return c.json({
      user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url, role: user.role },
      accessToken: jwtAccessToken,
      isNewUser,
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.json({ error: 'OAuth callback failed' }, 500);
  }
});

// ============ Admin Endpoints ============

// GET /api/admin/settings - Get all system settings (admin only)
app.get('/api/admin/settings', async (c) => {
  const adminId = await requireAdmin(c, c.env);
  if (!adminId) return;

  try {
    const rows = await c.env.DB.prepare('SELECT key, value, description, updated_at, updated_by FROM system_settings WHERE key LIKE "oauth_%" ORDER BY key').all() as any;

    // Mask sensitive values
    const settings = rows.results.map((row: any) => ({
      key: row.key,
      value: row.key.includes('secret') || row.key.includes('client_secret')
        ? row.value.substring(0, 8) + '...'
        : row.value,
      description: row.description,
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
      isMasked: row.key.includes('secret') || row.key.includes('client_secret'),
    }));

    return c.json({ settings });
  } catch (error) {
    return c.json({ error: 'Failed to get settings' }, 500);
  }
});

// PUT /api/admin/settings - Update system settings (admin only)
app.put('/api/admin/settings', async (c) => {
  const adminId = await requireAdmin(c, c.env);
  if (!adminId) return;

  try {
    const body = await c.req.json();
    const parsed = adminSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, 400);
    }
    const { key, value, description } = parsed.data;

    await setSystemSetting(c.env.DB, key, value, description || '', adminId);

    return c.json({ success: true, key });
  } catch (error) {
    return c.json({ error: 'Failed to update setting' }, 500);
  }
});

// DELETE /api/admin/settings/:key - Delete a setting (admin only)
app.delete('/api/admin/settings/:key', async (c) => {
  const adminId = await requireAdmin(c, c.env);
  if (!adminId) return;

  try {
    const key = c.req.param('key');
    await c.env.DB.prepare('DELETE FROM system_settings WHERE key = ?').bind(key).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete setting' }, 500);
  }
});

// GET /api/admin/users - List users (admin only)
app.get('/api/admin/users', async (c) => {
  const adminId = await requireAdmin(c, c.env);
  if (!adminId) return;

  try {
    const parsed = adminUsersListSchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: 'Invalid query parameters', details: parsed.error.flatten().fieldErrors }, 400);
    }
    const { limit, offset } = parsed.data;

    const rows = await c.env.DB.prepare('SELECT id, email, name, role, mfa_enabled, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(limit, offset).all() as any;

    const count = await c.env.DB.prepare('SELECT COUNT(*) as total FROM users').first() as any;

    return c.json({ users: rows.results, total: count.total });
  } catch (error) {
    return c.json({ error: 'Failed to list users' }, 500);
  }
});

// PUT /api/admin/users/:id/role - Update user role (admin only)
app.put('/api/admin/users/:id/role', async (c) => {
  const adminId = await requireAdmin(c, c.env);
  if (!adminId) return;

  try {
    const userId = c.req.param('id');
    const body = await c.req.json();
    const { role } = body;

    if (!['user', 'admin'].includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }

    await c.env.DB.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?')
      .bind(role, Date.now(), userId).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update role' }, 500);
  }
});

// ============ Email Verification Endpoints ============

// POST /api/auth/email/verify - Send verification email
app.post('/api/auth/email/verify', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);

    const payload = await verifyAccessToken(authHeader.split(' ')[1], c.env.JWT_SECRET);
    if (!payload) return c.json({ error: 'Invalid token' }, 401);

    const db = c.env.DB;
    const user = await db.prepare('SELECT id, email, email_verified FROM users WHERE id = ?').bind(payload.userId).first() as any;
    if (!user) return c.json({ error: 'User not found' }, 404);
    if (user.email_verified) return c.json({ error: 'Email already verified' }, 400);

    // Generate verification token
    const token = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

    // Delete any existing verification tokens
    await db.prepare('DELETE FROM email_verifications WHERE user_id = ?').bind(user.id).run();

    // Create new verification token
    await db.prepare('INSERT INTO email_verifications (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), user.id, token, expiresAt, now).run();

    // Send email via Email Sender Worker
    const appBaseUrl = await getSystemSetting(db, 'app_base_url') || 'https://cinacoin-auth.pages.dev';
    const verifyUrl = `${appBaseUrl}/verify-email?token=${token}`;

    const emailSent = await sendEmail(c, user.email, 'Verify your email address', `
      <h1>Welcome to Cinacoin!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verifyUrl}">Verify Email Address</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
    `);

    // SECURITY: Never expose token or verifyUrl to client — even if email fails.
    // The token is stored in DB and only delivered via email.
    // If email fails, ops can retrieve it from DB for debugging.
    if (!emailSent) {
      console.error('Email verification send failed for user:', user.id);
    }

    return c.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('Email verify error:', error);
    return c.json({ error: 'Failed to send verification email' }, 500);
  }
});

// POST /api/auth/email/confirm - Confirm verification token
app.post('/api/auth/email/confirm', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = emailConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, 400);
    }
    const { token } = parsed.data;

    const db = c.env.DB;
    const verification = await db.prepare(
      'SELECT * FROM email_verifications WHERE token = ? AND verified = 0'
    ).bind(token).first() as any;

    if (!verification) return c.json({ error: 'Invalid or expired token' }, 400);
    if (verification.expires_at < Date.now()) {
      return c.json({ error: 'Token expired' }, 400);
    }

    // Mark as verified
    await db.prepare('UPDATE email_verifications SET verified = 1 WHERE id = ?').bind(verification.id).run();
    await db.prepare('UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?')
      .bind(Date.now(), verification.user_id).run();

    return c.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email confirm error:', error);
    return c.json({ error: 'Failed to verify email' }, 500);
  }
});

// ============ Password Reset Endpoints ============

// POST /api/auth/password/reset - Request password reset
app.post('/api/auth/password/reset', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = passwordResetRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, 400);
    }
    const { email } = parsed.data;

    const db = c.env.DB;
    const user = await db.prepare('SELECT id, email FROM users WHERE email = ?').bind(email).first() as any;

    // Always return success to prevent email enumeration
    if (!user) {
      return c.json({ success: true, message: 'If the email exists, a reset link will be sent' });
    }

    // Generate reset token
    const token = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + 60 * 60 * 1000; // 1 hour

    // Delete any existing reset tokens
    await db.prepare('DELETE FROM password_resets WHERE user_id = ? AND used = 0').bind(user.id).run();

    // Create new reset token
    await db.prepare('INSERT INTO password_resets (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), user.id, token, expiresAt, now).run();

    // Send email via Email Sender Worker
    const appBaseUrl = await getSystemSetting(db, 'app_base_url') || 'https://cinacoin-auth.pages.dev';
    const resetUrl = `${appBaseUrl}/reset-password?token=${token}`;

    const emailSent = await sendEmail(c, user.email, 'Reset your password', `
      <h1>Password Reset Request</h1>
      <p>You requested to reset your password. Click the link below:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    `);

    // SECURITY: Never expose token or resetUrl to client — even if email fails.
    // The token is stored in DB and only delivered via email.
    if (!emailSent) {
      console.error('Password reset email send failed for user:', user.id);
    }

    return c.json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link shortly.',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return c.json({ error: 'Failed to process password reset' }, 500);
  }
});

// POST /api/auth/password/confirm - Confirm reset token and set new password
app.post('/api/auth/password/confirm', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = passwordResetConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, 400);
    }
    const { token, password } = parsed.data;

    const db = c.env.DB;
    const reset = await db.prepare(
      'SELECT * FROM password_resets WHERE token = ? AND used = 0'
    ).bind(token).first() as any;

    if (!reset) return c.json({ error: 'Invalid or expired token' }, 400);
    if (reset.expires_at < Date.now()) {
      return c.json({ error: 'Token expired' }, 400);
    }

    // Hash new password and update user
    const passwordHash = await hashPassword(password);
    await db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .bind(passwordHash, Date.now(), reset.user_id).run();

    // Mark token as used
    await db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').bind(reset.id).run();

    // Delete all sessions for this user (force re-login)
    await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(reset.user_id).run();

    return c.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password confirm error:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

// ============ Email Helper Function ============

async function sendEmail(c: any, to: string, subject: string, html: string): Promise<boolean> {
  try {
    const emailWorkerUrl = 'https://cinacoin-email-sender.cinagroup.workers.dev';

    const response = await fetch(emailWorkerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });

    if (response.ok) {
      console.log(`Email sent successfully to ${to}`);
      return true;
    } else {
      const error = await response.text();
      console.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env) {
    const now = Date.now();
    // Cleanup expired sessions
    await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now).run();
    // Cleanup expired OAuth states
    await env.DB.prepare("DELETE FROM system_settings WHERE key LIKE 'oauth_state_%' AND value LIKE '%createdAt%' AND json_extract(value, '$.createdAt') < ?")
      .bind(now - 3600000).run();
    // Cleanup expired verification tokens
    await env.DB.prepare('DELETE FROM email_verifications WHERE expires_at < ?').bind(now).run();
    // Cleanup expired password reset tokens
    await env.DB.prepare('DELETE FROM password_resets WHERE expires_at < ?').bind(now).run();
  },
};
