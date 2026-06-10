import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Cinacoin configuration
  CINACOIN_PROJECT_ID: z.string().min(1, 'CINACOIN_PROJECT_ID is required'),
  CINACOIN_SECRET: z.string().min(32, 'CINACOIN_SECRET must be at least 32 characters'),
  
  // Public URLs
  NEXT_PUBLIC_URL: z.string().url('NEXT_PUBLIC_URL must be a valid URL'),
  
  // RPC configuration
  ETH_RPC_URL: z.string().url('ETH_RPC_URL must be a valid URL').optional(),
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
