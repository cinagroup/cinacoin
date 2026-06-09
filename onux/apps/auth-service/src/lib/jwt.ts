/**
 * JWT token generation and verification
 * Uses RS256-like approach with separate secrets for access/refresh tokens
 */
import jwt from 'jsonwebtoken';
import { getConfig } from './config.js';

export interface TokenPayload {
  sub: string;        // User ID
  email: string;      // User email
  role: string;       // User role
  type: 'access' | 'refresh';
}

export interface AccessTokenPayload extends TokenPayload {
  type: 'access';
}

export interface RefreshTokenPayload extends TokenPayload {
  type: 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;  // seconds
}

/**
 * Generate an access token
 */
export function generateAccessToken(payload: Omit<TokenPayload, 'type'>): string {
  const config = getConfig();
  return jwt.sign(
    { ...payload, type: 'access' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as string | number, issuer: 'cinacoin-auth', audience: 'cinacoin' }
  );
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
  const config = getConfig();
  return jwt.sign(
    { ...payload, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn as string | number, issuer: 'cinacoin-auth', audience: 'cinacoin' }
  );
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: Omit<TokenPayload, 'type'>): TokenPair {
  const config = getConfig();
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Parse expiry from config (simple parser for common formats)
  const expiresIn = parseExpiry(config.jwt.expiresIn);

  return { accessToken, refreshToken, expiresIn };
}

/**
 * Verify and decode an access token
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const config = getConfig();
  const decoded = jwt.verify(token, config.jwt.secret, {
    issuer: 'cinacoin-auth',
    audience: 'cinacoin',
  }) as AccessTokenPayload;

  if (decoded.type !== 'access') {
    throw new Error('Invalid token type: expected access token');
  }

  return decoded;
}

/**
 * Verify and decode a refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const config = getConfig();
  const decoded = jwt.verify(token, config.jwt.refreshSecret, {
    issuer: 'cinacoin-auth',
    audience: 'cinacoin',
  }) as RefreshTokenPayload;

  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type: expected refresh token');
  }

  return decoded;
}

/**
 * Decode a token without verification (for debugging/logging)
 */
export function decodeToken(token: string): jwt.JwtPayload | null {
  return jwt.decode(token) as jwt.JwtPayload | null;
}

/**
 * Parse expiry string to seconds
 * Supports: "15m", "1h", "7d", "30s"
 */
function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 900; // default 15 minutes

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 900;
  }
}
