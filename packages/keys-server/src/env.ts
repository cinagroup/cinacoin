import { z } from 'zod';

/**
 * Common weak encryption keys that must be rejected.
 * These are frequently used default/example keys with near-zero entropy.
 */
const WEAK_ENCRYPTION_KEYS = new Set([
  '00000000000000000000000000000000',
  '11111111111111111111111111111111',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'abcdef1234567890abcdef1234567890',
  '1234567890abcdef1234567890abcdef',
  '0123456789abcdef0123456789abcdef',
  'deadbeefdeadbeefdeadbeefdeadbeef',
  'cafebabecafebabecafebabecafebabe',
  'passwordpasswordpasswordpassword',
  'changemechangemechangemechangeme',
  'testtesttesttesttesttesttesttest',
  'keykeykeykeykeykeykeykeykeykeyke',
  'secretsecretsecretsecretsecretse',
  'encryptionencryptionencryptionen',
  // Common hex patterns
  '0000000000000000000000000000000000000000000000000000000000000000',
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
]);

/**
 * Validate that an encryption key has sufficient entropy.
 * Checks:
 * 1. Minimum length of 32 bytes (256 bits) for AES-256 security
 * 2. Not a commonly used weak/default key
 * 3. Has reasonable character diversity (not all same character)
 */
function validateEncryptionKeyEntropy(key: string): true {
  // Check minimum byte length (key is typically hex-encoded, so 64 hex chars = 32 bytes)
  // If raw bytes, 32 chars minimum. We check both cases.
  const byteLength = key.length >= 64 && /^[0-9a-fA-F]+$/.test(key)
    ? key.length / 2  // hex-encoded
    : key.length;      // raw string

  if (byteLength < 32) {
    throw new Error(
      `ENCRYPTION_KEY must represent at least 32 bytes (256 bits) for AES-256 security. ` +
      `Current key represents approximately ${byteLength} bytes. ` +
      `Use a cryptographically random key of at least 64 hex characters.`
    );
  }

  // Check against known weak keys
  if (WEAK_ENCRYPTION_KEYS.has(key.toLowerCase())) {
    throw new Error(
      'ENCRYPTION_KEY is a commonly used weak/default key. ' +
      'Generate a cryptographically random key using: openssl rand -hex 32'
    );
  }

  // Check for low character diversity (all same character repeated)
  const uniqueChars = new Set(key.toLowerCase());
  if (uniqueChars.size < 8) {
    throw new Error(
      `ENCRYPTION_KEY has insufficient character diversity (${uniqueChars.size} unique characters). ` +
      'A secure key should use a wide range of characters. ' +
      'Generate a cryptographically random key using: openssl rand -hex 32'
    );
  }

  return true;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ENCRYPTION_KEY: z.string()
    .min(1, 'ENCRYPTION_KEY is required')
    .refine(validateEncryptionKeyEntropy, {
      message: 'ENCRYPTION_KEY fails entropy validation — see details above',
    }),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    
    throw new Error(`Environment validation failed:\n${errors}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

// Validate on import in production
if (process.env.NODE_ENV === 'production') {
  getEnv();
}
