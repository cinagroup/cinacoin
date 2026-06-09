/**
 * JWT token generation and verification using jose library
 * Compatible with Cloudflare Workers
 */
import { SignJWT, jwtVerify } from 'jose';
import type { Env, TokenPayload } from './types.js';

export interface AccessTokenPayload extends Omit<TokenPayload, 'type'> {
  type: 'access';
}

export interface RefreshTokenPayload extends Omit<TokenPayload, 'type'> {
  type: 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generate an access token
 */
export async function generateAccessToken(
  payload: { sub: string; email: string; role: string },
  env: Env
): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const expiresIn = parseInt(env.JWT_EXPIRES_IN) || 900; // 15 minutes default

  const token = await new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(secret);

  return token;
}

/**
 * Generate a refresh token
 */
export async function generateRefreshToken(
  payload: { sub: string; email: string; role: string },
  env: Env
): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
  const expiresIn = parseInt(env.JWT_REFRESH_EXPIRES_IN) || 604800; // 7 days default

  const token = await new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(secret);

  return token;
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(
  payload: { sub: string; email: string; role: string },
  env: Env
): Promise<TokenPair> {
  const accessToken = await generateAccessToken(payload, env);
  const refreshToken = await generateRefreshToken(payload, env);
  const expiresIn = parseInt(env.JWT_EXPIRES_IN) || 900;

  return { accessToken, refreshToken, expiresIn };
}

/**
 * Verify and decode an access token
 */
export async function verifyAccessToken(token: string, env: Env): Promise<AccessTokenPayload> {
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
