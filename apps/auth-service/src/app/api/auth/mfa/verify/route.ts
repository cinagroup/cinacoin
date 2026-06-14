import { NextRequest, NextResponse } from 'next/server';
import { verifyTOTP } from '@/lib/mfa';
import { verifyAccessToken, createAccessToken, createRefreshToken } from '@/lib/jwt';
import { initDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId } = body;
    
    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }
    
    const db = await initDatabase();
    
    // 查找用户
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user || !user.mfa_secret) {
      return NextResponse.json({ error: 'MFA not set up' }, { status: 400 });
    }
    
    // 验证 TOTP
    const isValid = verifyTOTP(code, user.mfa_secret);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid MFA code' }, { status: 401 });
    }
    
    // 如果 MFA 未启用，启用它
    if (!user.mfa_enabled) {
      await db.prepare('UPDATE users SET mfa_enabled = 1 WHERE id = ?').run(userId);
    }
    
    // 创建 Token
    const accessToken = await createAccessToken(user.id, user.email, process.env as any);
    const refreshToken = await createRefreshToken(user.id, process.env as any);
    
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
    console.error('MFA verify error:', error);
    return NextResponse.json({ error: 'MFA verification failed' }, { status: 500 });
  }
}
