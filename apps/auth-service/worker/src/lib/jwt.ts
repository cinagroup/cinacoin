import { SignJWT, jwtVerify } from 'jose';

export async function createAccessToken(
  userId: string,
  email: string,
  secret: string
): Promise<string> {
  const key = new TextEncoder().encode(secret);
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(key);
}

export async function createRefreshToken(
  userId: string,
  secret: string
): Promise<string> {
  const key = new TextEncoder().encode(secret);
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifyAccessToken(
  token: string,
  secret: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    return { userId: payload.userId as string, email: payload.email as string };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
  secret: string
): Promise<{ userId: string } | null> {
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    return { userId: payload.userId as string };
  } catch {
    return null;
  }
}
