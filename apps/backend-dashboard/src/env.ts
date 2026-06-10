import { z } from 'zod';

const serverEnv = z.object({
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL').default('https://api.cinacoin.com'),
  NEXT_PUBLIC_AUTH_URL: z.string().url('NEXT_PUBLIC_AUTH_URL must be a valid URL').default('https://auth.cinacoin.com'),
  DASHBOARD_SERVICE_BASE_URL: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnv>;

let cachedEnv: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const result = serverEnv.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Invalid environment configuration');
  }

  cachedEnv = result.data;
  return cachedEnv;
}

// Validate on import in development
if (process.env.NODE_ENV !== 'production') {
  getEnv();
}
