import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ALCHEMY_API_KEY: z.string().min(1, 'ALCHEMY_API_KEY is required'),
  NEXT_PUBLIC_ALCHEMY_API_KEY: z.string().min(1, 'NEXT_PUBLIC_ALCHEMY_API_KEY is required'),
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
