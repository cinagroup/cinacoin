import { NextRequest, NextResponse } from 'next/server';
import { generateMFASecret, generateTOTPUri, generateQRCode } from '@/lib/mfa';
import { verifyAccessToken } from '@/lib/jwt';
import { initDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // 验证 Access Token
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
    
    // 生成 MFA Secret
    const secret = generateMFASecret();
    
    // 保存 Secret（暂时不启用）
    await db.prepare('UPDATE users SET mfa_secret = ? WHERE id = ?').run(secret, payload.userId);
    
    // 生成 QR Code
    const uri = generateTOTPUri(payload.email, secret);
    const qrCode = await generateQRCode(uri);
    
    return NextResponse.json({
      secret,
      qrCode,
      uri,
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    return NextResponse.json({ error: 'MFA setup failed' }, { status: 500 });
  }
}
