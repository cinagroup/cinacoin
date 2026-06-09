/**
 * Validation utilities using Zod
 */
import { z } from 'zod';

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(1).max(100).optional(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  avatarUrl: z.string().url().optional(),
  status: z.enum(['pending', 'active', 'suspended', 'disabled']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  avatarUrl: z.string().url().optional(),
  locale: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
  status: z.enum(['pending', 'active', 'suspended', 'disabled']).optional(),
  emailVerified: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(['pending', 'active', 'suspended', 'disabled', 'deleted']).optional(),
});

// ============================================================================
// TEAM SCHEMAS
// ============================================================================

export const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const listTeamsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  userId: z.string().uuid().optional(),
});

export const addTeamMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'member', 'viewer']).optional().default('member'),
});

export const updateTeamMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
});

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  };
}
