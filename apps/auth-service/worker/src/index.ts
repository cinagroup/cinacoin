import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './env';
import { hashPassword, verifyPassword } from './lib/password';
import { createAccessToken, createRefreshToken, verifyAccessToken, verifyRefreshToken } from './lib/jwt';
import { registerSchema, loginSchema, mfaVerifySchema, updateUserSchema } from './lib/validation';
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
    
    c.header('Set-Cookie', `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 86400}; Path=/`, { append: true });
    
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
    
    c.header('Set-Cookie', `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 86400}; Path=/`, { append: true });
    
    return c.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, accessToken });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', async (c) => {
  try {
    const refreshToken = c.req.cookie('refresh_token');
    if (refreshToken) {
      await c.env.DB.prepare('DELETE FROM sessions WHERE refresh_token = ?').bind(refreshToken).run();
    }
    c.header('Set-Cookie', 'refresh_token=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/', { append: true });
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Logout failed' }, 500);
  }
});

// POST /api/auth/refresh
app.post('/api/auth/refresh', async (c) => {
  try {
    const refreshToken = c.req.cookie('refresh_token');
    if (!refreshToken) return c.json({ error: 'No refresh token' }, 401);
    
    const payload = await verifyRefreshToken(refreshToken, c.env.JWT_REFRESH_SECRET);
    if (!payload) return c.json({ error: 'Invalid refresh token' }, 401);
    
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.userId).first() as any;
    if (!user) return c.json({ error: 'User not found' }, 404);
    
    const accessToken = await createAccessToken(user.id, user.email, c.env.JWT_SECRET);
    return c.json({ accessToken });
  } catch (error) {
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
    
    c.header('Set-Cookie', `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 86400}; Path=/`, { append: true });
    
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
    
    // Check Google (future)
    const googleClientId = await getSystemSetting(db, 'oauth_google_client_id');
    providers.push({ name: 'google', enabled: !!googleClientId });
    
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
    
    if (provider === 'github') {
      const clientId = await getSystemSetting(db, 'oauth_github_client_id');
      if (!clientId) {
        return c.json({ error: 'GitHub OAuth not configured' }, 400);
      }
      
      const state = crypto.randomUUID();
      // Store state for CSRF protection
      await db.prepare('INSERT INTO system_settings (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)')
        .bind(`oauth_state_${state}`, JSON.stringify({ provider, redirectUri, createdAt: Date.now() }), Date.now(), 'system').run();
      
      const scope = 'read:user user:email';
      const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
      
      return c.json({ url, state });
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
    const { provider, code, state, redirectUri } = body;
    const db = c.env.DB;
    
    if (provider !== 'github') {
      return c.json({ error: 'Unsupported provider' }, 400);
    }
    
    // Verify state
    const stateRow = await db.prepare('SELECT value FROM system_settings WHERE key = ?').bind(`oauth_state_${state}`).first() as any;
    if (!stateRow) {
      return c.json({ error: 'Invalid state' }, 400);
    }
    // Clean up state
    await db.prepare('DELETE FROM system_settings WHERE key = ?').bind(`oauth_state_${state}`).run();
    
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
    
    // Get user info from GitHub
    const userRes = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'Accept': 'application/json' },
    });
    const githubUser = await userRes.json() as any;
    
    // Get email if not public
    let email = githubUser.email;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
      });
      const emails = await emailsRes.json() as any[];
      const primary = emails.find((e: any) => e.primary && e.verified);
      email = primary?.email;
    }
    
    if (!email) {
      return c.json({ error: 'Could not get email from GitHub' }, 400);
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
        .bind(userId, email, githubUser.name || githubUser.login, githubUser.avatar_url, 'user', now, now).run();
      await db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').bind(userId).run();
      
      user = { id: userId, email, name: githubUser.name || githubUser.login, avatar_url: githubUser.avatar_url, role: 'user' };
    }
    
    // Link OAuth account
    const existingOAuth = await db.prepare('SELECT id FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?')
      .bind('github', String(githubUser.id)).first();
    
    if (!existingOAuth) {
      await db.prepare('INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, access_token, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), user.id, 'github', String(githubUser.id), tokenData.access_token, Date.now()).run();
    }
    
    // Generate tokens
    const accessToken = await createAccessToken(user.id, user.email, c.env.JWT_SECRET);
    const refreshToken = await createRefreshToken(user.id, c.env.JWT_REFRESH_SECRET);
    
    const sessionId = crypto.randomUUID();
    const now = Date.now();
    await db.prepare('INSERT INTO sessions (id, user_id, refresh_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(sessionId, user.id, refreshToken, now + 7 * 86400000, now).run();
    
    c.header('Set-Cookie', `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 86400}; Path=/`, { append: true });
    
    return c.json({
      user: { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url, role: user.role },
      accessToken,
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
    const { key, value, description } = body;
    
    if (!key || !value) {
      return c.json({ error: 'Key and value required' }, 400);
    }
    
    // Validate key format
    const allowedKeys = [
      'oauth_github_client_id',
      'oauth_github_client_secret',
      'oauth_google_client_id',
      'oauth_google_client_secret',
    ];
    
    if (!allowedKeys.includes(key)) {
      return c.json({ error: 'Invalid setting key' }, 400);
    }
    
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
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
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

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env) {
    // Cleanup expired sessions daily
    const now = Date.now();
    await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now).run();
    // Cleanup expired OAuth states
    await env.DB.prepare("DELETE FROM system_settings WHERE key LIKE 'oauth_state_%' AND value LIKE '%createdAt%' AND json_extract(value, '$.createdAt') < ?")
      .bind(now - 3600000).run();
  },
};
