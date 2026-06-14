import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import { initDatabase } from '@/lib/database';

// GET - 获取用户信息
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const payload = await verifyAccessToken(token, process.env as any);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const db = await initDatabase();
    
    const user = await db.prepare(`
      SELECT u.id, u.email, u.name, u.avatar_url, u.mfa_enabled, u.created_at,
             s.theme, s.locale, s.notifications_enabled
      FROM users u
      LEFT JOIN user_settings s ON u.id = s.user_id
      WHERE u.id = ?
    `).get(payload.userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        mfa_enabled: !!user.mfa_enabled,
        created_at: user.created_at,
        settings: {
          theme: user.theme || 'dark',
          locale: user.locale || 'en',
          notifications_enabled: !!user.notifications_enabled,
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}

// PUT - 更新用户信息
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const payload = await verifyAccessToken(token, process.env as any);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, avatar_url, theme, locale, notifications_enabled } = body;
    
    const db = await initDatabase();
    
    // 更新用户信息
    if (name !== undefined || avatar_url !== undefined) {
      const updates: string[] = [];
      const values: any[] = [];
      
      if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
      }
      if (avatar_url !== undefined) {
        updates.push('avatar_url = ?');
        values.push(avatar_url);
      }
      
      updates.push('updated_at = ?');
      values.push(Date.now());
      values.push(payload.userId);
      
      await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    
    // 更新用户设置
    if (theme !== undefined || locale !== undefined || notifications_enabled !== undefined) {
      await db.prepare(`
        INSERT INTO user_settings (user_id, theme, locale, notifications_enabled)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          theme = COALESCE(?, theme),
          locale = COALESCE(?, locale),
          notifications_enabled = COALESCE(?, notifications_enabled)
      `).run(
        payload.userId,
        theme || 'dark',
        locale || 'en',
        notifications_enabled ? 1 : 0,
        theme,
        locale,
        notifications_enabled ? 1 : 0
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
