import { z } from 'zod';

// Password strength: min 8, max 128, must contain uppercase, lowercase, and digit
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit');

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: passwordSchema,
  name: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export const mfaVerifySchema = z.object({
  code: z.string().length(6),
  userId: z.string().uuid(),
});

export const updateUserSchema = z.object({
  name: z.string().max(100).optional(),
  avatar_url: z.string().url().max(2000).optional(),
  theme: z.enum(['dark', 'light']).optional(),
  locale: z.enum(['en', 'zh', 'ja']).optional(),
  notifications_enabled: z.boolean().optional(),
});

// ── OAuth ──────────────────────────────────────────────

const OAUTH_PROVIDERS = ['github', 'google', 'apple'] as const;

export const oauthStartSchema = z.object({
  provider: z.enum(OAUTH_PROVIDERS),
  redirect_uri: z.string().url().max(2000).optional(),
});

export const oauthCallbackSchema = z.object({
  provider: z.enum(OAUTH_PROVIDERS),
  code: z.string().min(1).max(500),
  state: z.string().uuid(),
  redirect_uri: z.string().url().max(2000).optional(),
  id_token: z.string().max(4000).optional(),
});

// ── Email verification ─────────────────────────────────

export const emailVerifyRequestSchema = z.object({
  // No body required — user derived from session token
});

export const emailConfirmSchema = z.object({
  token: z.string().min(1).max(255),
});

// ── Password reset ─────────────────────────────────────

export const passwordResetRequestSchema = z.object({
  email: z.string().email().max(255),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1).max(255),
  password: passwordSchema, // Same strength as registration
});

// ── Admin ──────────────────────────────────────────────

const ALLOWED_SETTING_KEYS = [
  'maintenance_mode',
  'registration_enabled',
  'oauth_github_client_id',
  'oauth_github_client_secret',
  'oauth_google_client_id',
  'oauth_google_client_secret',
  'oauth_apple_client_id',
  'oauth_apple_client_secret',
  'oauth_allowed_redirect_uris',
  'app_base_url',
] as const;

export const adminSettingsSchema = z.object({
  key: z.enum(ALLOWED_SETTING_KEYS),
  value: z.string().max(10000),
  description: z.string().max(500).optional(),
});

export const adminUsersListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().max(255).optional(),
});
