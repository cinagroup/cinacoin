/**
 * Mock implementation of argon2 for testing
 */

export const argon2id = 2;

export async function hash(password: string, options?: any): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  if (password.length > 128) {
    throw new Error('Password must not exceed 128 characters');
  }
  // Return a fake argon2 hash format
  const salt = Math.random().toString(36).substring(7);
  return `$argon2id$v=19$m=65536,t=3,p=4$${salt}$${Buffer.from(password).toString('base64').substring(0, 32)}`;
}

export async function verify(hash: string, password: string): Promise<boolean> {
  try {
    // Extract the password part from our fake hash
    const parts = hash.split('$');
    if (parts.length < 6) return false;
    const encoded = parts[5];
    const decoded = Buffer.from(encoded, 'base64').toString();
    // Pad to match original password length
    return decoded === password.substring(0, decoded.length);
  } catch {
    return false;
  }
}

export async function needsRehash(hash: string, options?: any): Promise<boolean> {
  return false;
}

export default {
  argon2id,
  hash,
  verify,
  needsRehash,
};
