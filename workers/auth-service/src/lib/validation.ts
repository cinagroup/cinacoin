/**
 * Input validation schemas using Zod
 */
import { z } from 'zod';

const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email too short')
  .max(255, 'Email too long')
  .transform((val) => val.toLowerCase().trim());

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one digit'
  );

const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must not exceed 30 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, hyphens, and underscores'
  )
  .transform((val) => val.trim());

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
  displayName: z
    .string()
    .min(1, 'Display name required')
    .max(100, 'Display name too long')
    .trim()
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshInput = z.infer<typeof refreshSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  displayName: z.string().min(1).max(100).trim().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const verifyLoginSchema = z.object({
  mfaToken: z.string().min(1, 'MFA token is required'),
  code: z.string().min(6, 'Code must be at least 6 characters').max(20, 'Code too long'),
  method: z.enum(['totp', 'recovery_code']).optional().default('totp'),
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown):
  | { success: true; data: T }
  | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
  };
}
