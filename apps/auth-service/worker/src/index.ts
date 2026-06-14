import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './env';
import { initDatabase } from './lib/db';
import { hashPassword, verifyPassword } from './lib/password';
import { createAccessToken, createRefreshToken, verifyAccessToken, verifyRefreshToken } from './lib/jwt';
import { registerSchema, loginSchema, mfaVerifySchema, updateUserSchema } from './lib/validation';
import { generateMFASecret, verifyTOTP, generateTOTPUri } from './lib/mfa';

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use('*', cors({
  origin: ['https://auth.cinacoin.com', 'https://cinacoin.com', 'http://localhost:3000'],
  credentials: true,
}));

// Health check
app.get('/', (c) => c.json({ status: 'ok', service: 'cinacoin-auth' }));

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
    
    await db.prepare('INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(userId, validated.email, passwordHash, validated.name || null, now, now).run();
    await db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').bind(userId).run();
    
    const accessToken = await createAccessToken(userId, validated.email, c.env.JWT_SECRET);
    const refreshToken = await createRefreshToken(userId, c.env.JWT_REFRESH_SECRET);
    
    const sessionId = crypto.randomUUID();
    await db.prepare('INSERT INTO sessions (id, user_id, refresh_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(sessionId, userId, refreshToken, now + 7 * 86400000, now).run();
    
    // Set refresh token cookie
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
    
    return c.json({ user: { id: user.id, email: user.email, name: user.name }, accessToken });
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
    
    return c.json({ user: { id: user.id, email: user.email, name: user.name }, accessToken });
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
      SELECT u.id, u.email, u.name, u.avatar_url, u.mfa_enabled, u.created_at,
             s.theme, s.locale, s.notifications_enabled
      FROM users u LEFT JOIN user_settings s ON u.id = s.user_id
      WHERE u.id = ?
    `).bind(payload.userId).first() as any;
    
    if (!user) return c.json({ error: 'User not found' }, 404);
    
    return c.json({
      user: {
        id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url,
        mfa_enabled: !!user.mfa_enabled, created_at: user.created_at,
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

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env) {
    // Cleanup expired sessions daily
    const now = Date.now();
    await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now).run();
  },
};
