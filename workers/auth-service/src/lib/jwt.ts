/**
 * JWT token generation and verification using jose library
 * Compatible with Cloudflare Workers
 *
 * SECURITY: Uses HS256 with mandatory 256-bit (32-byte) minimum key length.
 * See: https://www.rfc-editor.org/rfc/rfc7518#section-3.2
 */
import { SignJWT, jwtVerify } from 'jose';
import type { Env, TokenPayload } from './types.js';
import { uuidv4 } from './utils.js';

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

export interface AccessTokenPayload extends Omit<TokenPayload, 'type'> {
  type: 'access';
}

export interface RefreshTokenPayload extends Omit<TokenPayload, 'type'> {
  type: 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessJti: string;
  refreshJti: string;
  expiresIn: number;
}

/**
 * Generate an access token
 */
export async function generateAccessToken(
  payload: { sub: string; email: string; role: string },
  env: Env
): Promise<{ token: string; jti: string }> {
  validateSecretKey(env.JWT_SECRET, 'JWT_SECRET');
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const expiresIn = parseInt(env.JWT_EXPIRES_IN) || 900; // 15 minutes default
  const jti = uuidv4();

  const token = await new SignJWT({ ...payload, type: 'access', jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(secret);

  return { token, jti };
}

/**
 * Generate a refresh token
 */
export async function generateRefreshToken(
  payload: { sub: string; email: string; role: string },
  env: Env
): Promise<{ token: string; jti: string }> {
  validateSecretKey(env.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET');
  const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
  const expiresIn = parseInt(env.JWT_REFRESH_EXPIRES_IN) || 604800; // 7 days default
  const jti = uuidv4();

  const token = await new SignJWT({ ...payload, type: 'refresh', jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(secret);

  return { token, jti };
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(
  payload: { sub: string; email: string; role: string },
  env: Env
): Promise<TokenPair> {
  const accessResult = await generateAccessToken(payload, env);
  const refreshResult = await generateRefreshToken(payload, env);
  const expiresIn = parseInt(env.JWT_EXPIRES_IN) || 900;

  return {
    accessToken: accessResult.token,
    refreshToken: refreshResult.token,
    accessJti: accessResult.jti,
    refreshJti: refreshResult.jti,
    expiresIn,
  };
}

/**
 * Verify and decode an access token
 */
export async function verifyAccessToken(token: string, env: Env): Promise<AccessTokenPayload> {
  validateSecretKey(env.JWT_SECRET, 'JWT_SECRET');
  const secret = new TextEncoder().encode(env.JWT_SECRET);

  const { payload } = await jwtVerify(token, secret, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

  if (payload.type !== 'access') {
    throw new Error('Invalid token type: expected access token');
  }

  return payload as AccessTokenPayload;
}

/**
 * Verify and decode a refresh token
 */
export async function verifyRefreshToken(token: string, env: Env): Promise<RefreshTokenPayload> {
  validateSecretKey(env.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET');
  const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

  const { payload } = await jwtVerify(token, secret, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type: expected refresh token');
  }

  return payload as RefreshTokenPayload;
}
