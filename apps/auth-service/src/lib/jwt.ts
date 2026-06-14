import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from './types';

export interface Env {
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
}

// 创建 Access Token（15 分钟有效）
export async function createAccessToken(
  userId: string,
  email: string,
  env: Env
): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  
  const jwt = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret);
  
  return jwt;
}

// 创建 Refresh Token（7 天有效）
export async function createRefreshToken(
  userId: string,
  env: Env
): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
  
  const jwt = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  
  return jwt;
}

// 验证 Access Token
export async function verifyAccessToken(
  token: string,
  env: Env
): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch (error) {
    return null;
  }
}

// 验证 Refresh Token
export async function verifyRefreshToken(
  token: string,
  env: Env
): Promise<{ userId: string } | null> {
  try {
    const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { userId: string };
  } catch (error) {
    return null;
  }
}
