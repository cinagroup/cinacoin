import { getEnv } from './env';

// [H-005] Fix: Validate all environment variables at startup
getEnv();

export { KeyManager } from './KeyManager';
export type { KeyManagerConfig, StoredKey, Session, DecryptResult } from './KeyManager';
export { getEnv } from './env';
export type { Env } from './env';
