/**
 * Password hashing using Web Crypto API (PBKDF2)
 * Cloudflare Workers compatible replacement for bcrypt/argon2
 *
 * PBKDF2 with SHA-256 is a solid choice for Workers:
 * - No native module dependencies
 * - Uses Web Crypto API (fast, available in Workers)
 * - OWASP recommended: 600,000+ iterations for SHA-256
 */

// Cloudflare Workers limits PBKDF2 to 100,000 iterations max
const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

/**
 * Generate a random salt
 */
function generateSalt(): Uint8Array {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  return salt;
}

/**
 * Convert Uint8Array to base64
 */
function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Convert base64 to Uint8Array
 */
function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Hash a password using PBKDF2-SHA256
 * Format: $pbkdf2-sha256$iterations$base64salt$base64hash
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  if (password.length > 128) {
    throw new Error('Password must not exceed 128 characters');
  }

  const salt = generateSalt();
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  const hash = new Uint8Array(derivedBits);

  // Return in a parseable format
  return `$pbkdf2-sha256$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    const parts = hash.split('$');
    // Format: ['', 'pbkdf2-sha256', 'iterations', 'base64salt', 'base64hash']
    if (parts.length !== 5 || parts[1] !== 'pbkdf2-sha256') {
      return false;
    }

    const iterations = parseInt(parts[2], 10);
    const salt = fromBase64(parts[3]);
    const expectedHash = fromBase64(parts[4]);

    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      expectedHash.length * 8
    );

    const actualHash = new Uint8Array(derivedBits);

    // Constant-time comparison
    if (actualHash.length !== expectedHash.length) {
      return false;
    }

    let diff = 0;
    for (let i = 0; i < actualHash.length; i++) {
      diff |= actualHash[i] ^ expectedHash[i];
    }
    return diff === 0;
  } catch {
    return false;
  }
}

/**
 * Check if a hash needs rehashing (e.g., iteration count changed)
 */
export function needsRehash(hash: string): boolean {
  const parts = hash.split('$');
  if (parts.length !== 5 || parts[1] !== 'pbkdf2-sha256') {
    return true; // Unknown format, needs rehash
  }
  const iterations = parseInt(parts[2], 10);
  return iterations < PBKDF2_ITERATIONS;
}
