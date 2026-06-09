// [H-005] Fix: Enforce JWT_SECRET in production before any exports are used
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      'JWT_SECRET environment variable is required in production. ' +
      'Generate a secure secret with: openssl rand -hex 32'
    );
  }
}

export { KeyManager } from './KeyManager';
export type { KeyManagerConfig, StoredKey, Session, DecryptResult } from './KeyManager';
