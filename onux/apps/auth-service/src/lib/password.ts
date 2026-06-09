/**
 * Password hashing using Argon2id
 * Argon2id is the recommended variant - combines Argon2i (side-channel resistant)
 * and Argon2d (GPU-resistant) properties
 */
import argon2 from 'argon2';

// Argon2id parameters (OWASP recommended)
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,    // 64 MB
  timeCost: 3,          // iterations
  parallelism: 4,       // threads
  saltLength: 16,       // bytes
  hashLength: 32,       // bytes
};

/**
 * Hash a password using Argon2id
 * @param password - Plain text password
 * @returns Hashed password string (includes algorithm params and salt)
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  if (password.length > 128) {
    throw new Error('Password must not exceed 128 characters');
  }
  return argon2.hash(password, ARGON2_OPTIONS);
}

/**
 * Verify a password against a hash
 * @param hash - Stored hash (includes params and salt)
 * @param password - Plain text password to verify
 * @returns true if password matches
 */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Check if a hash needs to be rehashed (e.g., parameters changed)
 */
export async function needsRehash(hash: string): Promise<boolean> {
  return argon2.needsRehash(hash, ARGON2_OPTIONS);
}
