// TOTP implementation using Web Crypto API (Workers-compatible)
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateMFASecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  let result = '';
  let bits = 0;
  let value = 0;
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 31];
  }
  return result;
}

function base32Decode(encoded: string): Uint8Array {
  const lookup: Record<string, number> = {};
  for (let i = 0; i < BASE32_CHARS.length; i++) {
    lookup[BASE32_CHARS[i]] = i;
  }
  const cleanEncoded = encoded.toUpperCase().replace(/=+$/, '');
  const output: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of cleanEncoded) {
    if (lookup[char] === undefined) continue;
    value = (value << 5) | lookup[char];
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(output);
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(sig);
}

function totpCode(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const msg = new Uint8Array(8);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) {
    msg[i] = tmp & 0xff;
    tmp = Math.floor(tmp / 256);
  }
  // Use sync approach with known HMAC
  // Since we can't use await here, we'll do it in the calling function
  return '000000'; // Placeholder
}

export async function verifyTOTP(code: string, secret: string): Promise<boolean> {
  const key = base32Decode(secret);
  const timeStep = 30;
  const now = Math.floor(Date.now() / 1000 / timeStep);
  
  // Check current and ±1 window
  for (let i = -1; i <= 1; i++) {
    const counter = now + i;
    const msg = new Uint8Array(8);
    let tmp = counter;
    for (let j = 7; j >= 0; j--) {
      msg[j] = tmp & 0xff;
      tmp = Math.floor(tmp / 256);
    }
    
    const hmac = await hmacSha1(key, msg);
    const offset = hmac[hmac.length - 1] & 0xf;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    const otp = (binary % 1000000).toString().padStart(6, '0');
    
    if (otp === code) return true;
  }
  return false;
}

export function generateTOTPUri(email: string, secret: string): string {
  return `otpauth://totp/Cinacoin:${encodeURIComponent(email)}?secret=${secret}&issuer=Cinacoin&algorithm=SHA1&digits=6&period=30`;
}

export async function generateQRCodeBase64(uri: string): Promise<string> {
  // Simple SVG QR Code generator (minimal implementation)
  // For production, consider a proper QR library
  // Return the URI for now and let frontend generate QR
  return uri;
}
