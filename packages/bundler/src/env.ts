import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BUNDLER_SIGNER_PRIVATE_KEY: z.string().optional(),
  BUNDLER_BENEFICIARY: z.string().optional(),
  BUNDLER_API_KEYS: z.string().optional(),
  BUNDLER_SKIP_AUTH: z.enum(['true', 'false']).optional(),
  BUNDLER_RATE_LIMIT: z.string().regex(/^\d+$/).optional(),
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
