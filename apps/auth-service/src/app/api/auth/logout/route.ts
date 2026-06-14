import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value;
    
    if (refreshToken) {
      const db = await initDatabase();
      
      // 删除 Session
      await db.prepare('DELETE FROM sessions WHERE refresh_token = ?').run(refreshToken);
    }
    
    const response = NextResponse.json({ success: true });
    
    // 清除 Cookie
    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
