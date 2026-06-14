import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const mfaVerifySchema = z.object({
  code: z.string().length(6),
  userId: z.string().uuid(),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  theme: z.enum(['dark', 'light']).optional(),
  locale: z.enum(['en', 'zh', 'ja']).optional(),
  notifications_enabled: z.boolean().optional(),
});
