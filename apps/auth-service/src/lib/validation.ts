import { z } from 'zod';

// 注册验证
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

// 登录验证
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// MFA 验证
export const mfaVerifySchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});

// 用户更新验证
export const updateUserSchema = z.object({
  name: z.string().optional(),
  avatar_url: z.string().url().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
