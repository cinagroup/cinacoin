import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, createAccessToken } from '@/lib/jwt';
import { initDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value;
    
    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }
    
    // 验证 Refresh Token
    const payload = await verifyRefreshToken(refreshToken, process.env);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }
    
    const db = await initDatabase();
    
    // 查找用户
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // 创建新的 Access Token
    const accessToken = await createAccessToken(user.id, user.email, process.env);
    
    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
