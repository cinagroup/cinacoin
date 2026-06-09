/**
 * TOTP (Time-based One-Time Password) implementation
 * Uses otpauth library which is Workers-compatible
 */
import * as OTPAuth from 'otpauth';

export interface TotpConfig {
  issuer: string;
  account: string;
  secret?: string;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
  digits?: number;
  period?: number;
}

/**
 * Generate a new TOTP secret
 */
export function generateTotpSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

/**
 * Create a TOTP instance
 */
export function createTotp(config: TotpConfig): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: config.issuer,
    label: config.account,
    algorithm: config.algorithm || 'SHA1',
    digits: config.digits || 6,
    period: config.period || 30,
    secret: OTPAuth.Secret.fromBase32(config.secret || generateTotpSecret()),
  });
}

/**
 * Generate TOTP URI for QR code
 */
export function generateTotpUri(config: TotpConfig): { uri: string; secret: string } {
  const secret = config.secret || generateTotpSecret();
  const totp = createTotp({ ...config, secret });

  return {
    uri: totp.toString(),
    secret,
  };
}

/**
 * Verify a TOTP token
 */
export function verifyTotpToken(params: {
  secret: string;
  token: string;
  window?: number;
}): boolean {
  const { secret, token, window = 1 } = params;

  const totp = createTotp({
    issuer: 'Cinacoin',
    account: 'user',
    secret,
  });

  const delta = totp.validate({ token, window });
  return delta !== null;
}

/**
 * Generate recovery codes using Web Crypto API
 */
export function generateRecoveryCodes(count: number = 10): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  for (let i = 0; i < count; i++) {
    let code = '';
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);
    for (let j = 0; j < 8; j++) {
      code += chars.charAt(randomBytes[j] % chars.length);
    }
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  return codes;
}
