/**
 * Password hashing using Web Crypto API (PBKDF2)
 * Cloudflare Workers compatible replacement for bcrypt/argon2
 *
 * Security note: Cloudflare Workers limits PBKDF2 to 100,000 iterations max.
 * OWASP recommends 600,000+ iterations for SHA-256.
 *
 * To compensate, we use a multi-pass approach: 6 sequential PBKDF2 calls
 * of 100,000 iterations each = effective 600,000 iterations.
 *
 * Future consideration: Evaluate Argon2 via WASM for memory-hardness,
 * but note Workers' CPU time limits (10ms free / 30s paid).
 */

// Cloudflare Workers limits PBKDF2 to 100,000 iterations max per call
const PBKDF2_ITERATIONS_PER_PASS = 100_000;
const PBKDF2_PASSES = 6; // 6 passes × 100,000 = 600,000 effective iterations (OWASP recommended)
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
 * Hash a password using multi-pass PBKDF2-SHA256
 * Format: $pbkdf2-sha256$passes$iterationsPerPass$base64salt$base64hash
 *
 * Uses 6 passes of 100,000 iterations each (600,000 total) to meet OWASP
 * recommendations while working within Cloudflare Workers' per-call limits.
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
  let passwordBuffer = encoder.encode(password);

  // Multi-pass PBKDF2: chain outputs to achieve higher effective iterations
  for (let pass = 0; pass < PBKDF2_PASSES; pass++) {
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
        iterations: PBKDF2_ITERATIONS_PER_PASS,
        hash: 'SHA-256',
      },
      keyMaterial,
      KEY_LENGTH * 8
    );

    // Use derived bits as input for next pass
    passwordBuffer = new Uint8Array(derivedBits);
  }

  const hash = passwordBuffer;

  // Return in a parseable format with multi-pass info
  return `$pbkdf2-sha256$${PBKDF2_PASSES}$${PBKDF2_ITERATIONS_PER_PASS}$${toBase64(salt)}$${toBase64(hash)}`;
}

/**
 * Verify a password against a hash
 * Supports both legacy single-pass format and new multi-pass format:
 * - Legacy: $pbkdf2-sha256$iterations$salt$hash (5 parts)
 * - Multi-pass: $pbkdf2-sha256$passes$iterationsPerPass$salt$hash (6 parts)
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    const parts = hash.split('$');

    // Detect format: legacy (5 parts) vs multi-pass (6 parts)
    if (parts.length === 5 && parts[1] === 'pbkdf2-sha256') {
      // Legacy single-pass format
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
    } else if (parts.length === 6 && parts[1] === 'pbkdf2-sha256') {
      // New multi-pass format
      const passes = parseInt(parts[2], 10);
      const iterationsPerPass = parseInt(parts[3], 10);
      const salt = fromBase64(parts[4]);
      const expectedHash = fromBase64(parts[5]);

      const encoder = new TextEncoder();
      let passwordBuffer = encoder.encode(password);

      // Multi-pass verification
      for (let pass = 0; pass < passes; pass++) {
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
            iterations: iterationsPerPass,
            hash: 'SHA-256',
          },
          keyMaterial,
          KEY_LENGTH * 8
        );

        passwordBuffer = new Uint8Array(derivedBits);
      }

      const actualHash = passwordBuffer;

      // Constant-time comparison
      if (actualHash.length !== expectedHash.length) {
        return false;
      }

      let diff = 0;
      for (let i = 0; i < actualHash.length; i++) {
        diff |= actualHash[i] ^ expectedHash[i];
      }
      return diff === 0;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Check if a hash needs rehashing (e.g., iteration count changed)
 * Returns true for:
 * - Legacy single-pass format (should upgrade to multi-pass)
 * - Old multi-pass with fewer passes or iterations
 */
export function needsRehash(hash: string): boolean {
  const parts = hash.split('$');
  if (parts[1] !== 'pbkdf2-sha256') {
    return true; // Unknown format, needs rehash
  }

  if (parts.length === 5) {
    // Legacy single-pass format always needs rehash
    return true;
  }

  if (parts.length === 6) {
    const passes = parseInt(parts[2], 10);
    const iterationsPerPass = parseInt(parts[3], 10);
    // Needs rehash if fewer passes or lower iterations than current config
    return passes < PBKDF2_PASSES || iterationsPerPass < PBKDF2_ITERATIONS_PER_PASS;
  }

  return true;
}
