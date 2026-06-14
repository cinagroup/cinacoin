import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// 生成 MFA Secret
export function generateMFASecret(): string {
  return authenticator.generateSecret();
}

// 生成 TOTP URI（用于 QR Code）
export function generateTOTPUri(
  email: string,
  secret: string
): string {
  return authenticator.keyuri(email, 'CinaCoin', secret);
}

// 生成 QR Code（Base64 PNG）
export async function generateQRCode(uri: string): Promise<string> {
  return QRCode.toDataURL(uri);
}

// 验证 TOTP Code
export function verifyTOTP(code: string, secret: string): boolean {
  return authenticator.verify({ token: code, secret });
}
