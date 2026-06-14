import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/password';
import { loginSchema } from '@/lib/validation';
import { createAccessToken, createRefreshToken } from '@/lib/jwt';
import { initDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);
    
    const db = await initDatabase();
    
    // 查找用户
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(validated.email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // 验证密码
    const validPassword = await verifyPassword(validated.password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // 检查 MFA
    if (user.mfa_enabled) {
      return NextResponse.json({ 
        error: 'MFA required',
        mfaRequired: true,
        userId: user.id 
      }, { status: 200 });
    }
    
    // 创建 Token
    const accessToken = await createAccessToken(user.id, user.email, process.env);
    const refreshToken = await createRefreshToken(user.id, process.env);
    
    // 保存 Session
    const sessionId = crypto.randomUUID();
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000;
    
    await db.prepare(`
      INSERT INTO sessions (id, user_id, refresh_token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, user.id, refreshToken, expiresAt, now);
    
    // 设置 Cookie
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
    });
    
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
