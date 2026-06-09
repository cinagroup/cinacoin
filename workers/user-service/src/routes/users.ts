/**
 * User Management Routes
 *
 * GET    /api/users       — List users (paginated, filterable)
 * GET    /api/users/:id   — Get user by ID
 * POST   /api/users       — Create a new user
 * PATCH  /api/users/:id   — Update a user
 * DELETE /api/users/:id   — Delete (soft-delete) a user
 */

import { Hono } from 'hono';
import type { Env } from '../db/schema';
import type { AuthVariables } from '../middleware/auth';
import { requireAuth } from '../middleware/auth';
import { requireScope } from '../middleware/rbac';
import {
  listUsers,
  getUserById,
  getUserByEmail,
  getUserByUsername,
  createUser,
  updateUser,
  deleteUser,
} from '../db/queries';

type Variables = AuthVariables & {
  userId: string;
  authType: 'api_key' | 'admin';
  scopes: string[];
};

const users = new Hono<{ Bindings: Env; Variables: Variables }>();

// All routes require authentication
users.use('*', requireAuth);

// ─── List Users ───────────────────────────────────────────────────────────────
users.get('/', requireScope('users:read'), async (c) => {
  const limit = Number(c.req.query('limit') ?? 50);
  const offset = Number(c.req.query('offset') ?? 0);
  const status = c.req.query('status');

  const users = await listUsers(c.env.DB, { limit, offset, status }, c.env.CACHE);

  return c.json({
    data: users,
    meta: { limit, offset },
  });
});

// ─── Get User by ID ───────────────────────────────────────────────────────────
users.get('/:id', requireScope('users:read'), async (c) => {
  const id = c.req.param('id');
  const user = await getUserById(c.env.DB, id, c.env.CACHE);

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({ data: user });
});

// ─── Create User ──────────────────────────────────────────────────────────────
users.post('/', requireScope('users:write'), async (c) => {
  const body = await c.req.json();

  // Validation
  if (!body.email || typeof body.email !== 'string') {
    return c.json({ error: 'email is required' }, 400);
  }
  if (!body.auth_type || !['password', 'oauth', 'api_key', 'sso'].includes(body.auth_type)) {
    return c.json({ error: 'auth_type must be one of: password, oauth, api_key, sso' }, 400);
  }

  // Check uniqueness
  const existingEmail = await getUserByEmail(c.env.DB, body.email, c.env.CACHE);
  if (existingEmail) {
    return c.json({ error: 'Email already in use' }, 409);
  }

  if (body.username) {
    const existingUsername = await getUserByUsername(c.env.DB, body.username, c.env.CACHE);
    if (existingUsername) {
      return c.json({ error: 'Username already taken' }, 409);
    }
  }

  const user = await createUser(c.env.DB, {
    email: body.email,
    username: body.username,
    display_name: body.display_name,
    avatar_url: body.avatar_url,
    auth_type: body.auth_type,
  }, c.env.CACHE);

  return c.json({ data: user }, 201);
});

// ─── Update User ──────────────────────────────────────────────────────────────
users.patch('/:id', requireScope('users:write'), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  const existing = await getUserById(c.env.DB, id, c.env.CACHE);
  if (!existing) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Check username uniqueness if changing
  if (body.username && body.username !== existing.username) {
    const taken = await getUserByUsername(c.env.DB, body.username, c.env.CACHE);
    if (taken) {
      return c.json({ error: 'Username already taken' }, 409);
    }
  }

  const user = await updateUser(c.env.DB, id, {
    username: body.username,
    display_name: body.display_name,
    avatar_url: body.avatar_url,
    status: body.status,
  }, c.env.CACHE);

  return c.json({ data: user });
});

// ─── Delete User ──────────────────────────────────────────────────────────────
users.delete('/:id', requireScope('users:admin'), async (c) => {
  const id = c.req.param('id');

  const existing = await getUserById(c.env.DB, id, c.env.CACHE);
  if (!existing) {
    return c.json({ error: 'User not found' }, 404);
  }

  // Soft delete — set status to 'deleted'
  await updateUser(c.env.DB, id, { status: 'deleted' }, c.env.CACHE);

  return c.json({ data: { deleted: true, id } });
});

export default users;
