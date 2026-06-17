/**
 * JWT token generation and verification using jose library
 * Compatible with Cloudflare Workers
 *
 * SECURITY: Uses HS256 with mandatory 256-bit (32-byte) minimum key length.
 * - Algorithm explicitly restricted to HS256 on verification (prevents alg:none / alg confusion)
 * - Issuer and audience validated on every verify call
 * - Token type (access vs refresh) enforced to prevent cross-token misuse
 * See: https://www.rfc-editor.org/rfc/rfc7518#section-3.2
 */
import { SignJWT, jwtVerify } from 'jose';

const ALLOWED_ALGORITHMS = ['HS256'] as const;
const JWT_ISSUER = 'cinacoin';
const JWT_AUDIENCE = 'cinacoin';

/**
 * Validate that a JWT secret meets minimum length requirements.
 * HS256 requires at least 256 bits (32 bytes) for security.
 */
function validateSecretKey(secret: string, name: string): void {
  const byteLength = new TextEncoder().encode(secret).length;
  if (byteLength < 32) {
    throw new Error(
      `${name} is too short. Must be at least 32 bytes (256 bits) for HS256. ` +
      `Current length: ${byteLength} bytes.`
    );
  }
}

export interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
  type: 'access' | 'refresh';
}

/**
 * Generate an access token (15 min default)
 */
export async function createAccessToken(
  userId: string,
  email: string,
  secret: string,
  role: string = 'user'
): Promise<string> {
  validateSecretKey(secret, 'JWT_SECRET');
  const key = new TextEncoder().encode(secret);

  return new SignJWT({ userId, email, role, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('15m')
    .sign(key);
}

/**
 * Generate a refresh token (7 days default)
 */
export async function createRefreshToken(
  userId: string,
  secret: string
): Promise<string> {
  validateSecretKey(secret, 'JWT_REFRESH_SECRET');
  const key = new TextEncoder().encode(secret);

  return new SignJWT({ userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime('7d')
    .sign(key);
}

/**
 * Verify and decode an access token.
 * Rejects tokens with wrong algorithm, issuer, audience, or token type.
 */
export async function verifyAccessToken(
  token: string,
  secret: string
): Promise<{ userId: string; email: string } | null> {
  try {
    validateSecretKey(secret, 'JWT_SECRET');
    const key = new TextEncoder().encode(secret);

    const { payload } = await jwtVerify(token, key, {
      algorithms: ALLOWED_ALGORITHMS,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if ((payload as any).type !== 'access') {
      return null;
    }

    return { userId: payload.userId as string, email: payload.email as string };
  } catch {
    return null;
  }
}

/**
 * Verify and decode a refresh token.
 * Rejects tokens with wrong algorithm, issuer, audience, or token type.
 */
export async function verifyRefreshToken(
  token: string,
  secret: string
): Promise<{ userId: string } | null> {
  try {
    validateSecretKey(secret, 'JWT_REFRESH_SECRET');
    const key = new TextEncoder().encode(secret);

    const { payload } = await jwtVerify(token, key, {
      algorithms: ALLOWED_ALGORITHMS,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if ((payload as any).type !== 'refresh') {
      return null;
    }

    return { userId: payload.userId as string };
  } catch {
    return null;
  }
}
