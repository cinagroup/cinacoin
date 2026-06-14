import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';
import { registerSchema } from '@/lib/validation';
import { createAccessToken, createRefreshToken } from '@/lib/jwt';
import { initDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);
    
    const db = await initDatabase();
    
    // 检查邮箱是否已存在
    const existingUser = await db.prepare('SELECT * FROM users WHERE email = ?').get(validated.email);
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }
    
    // 创建用户
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(validated.password);
    const now = Date.now();
    
    await db.prepare(`
      INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, validated.email, passwordHash, validated.name, now, now);
    
    // 创建用户设置
    await db.prepare(`
      INSERT INTO user_settings (user_id, theme, locale, notifications_enabled)
      VALUES (?, 'dark', 'en', 1)
    `).run(userId);
    
    // 创建 Token
    const accessToken = await createAccessToken(userId, validated.email, process.env);
    const refreshToken = await createRefreshToken(userId, process.env);
    
    // 保存 Session
    const sessionId = crypto.randomUUID();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 天
    
    await db.prepare(`
      INSERT INTO sessions (id, user_id, refresh_token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, userId, refreshToken, expiresAt, now);
    
    // 设置 Cookie
    const response = NextResponse.json({
      user: { id: userId, email: validated.email, name: validated.name },
      accessToken,
    });
    
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 天
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
