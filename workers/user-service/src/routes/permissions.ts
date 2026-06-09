/**
 * Permission Management Routes
 *
 * GET    /api/permissions           — List permissions (filterable by user_id / team_id)
 * POST   /api/permissions           — Grant a permission
 * DELETE /api/permissions/:id       — Revoke a permission
 * GET    /api/permissions/check     — Check if a user has a specific permission
 */

import { Hono } from 'hono';
import type { Env } from '../db/schema';
import type { AuthVariables } from '../middleware/auth';
import { requireAuth } from '../middleware/auth';
import { requireScope } from '../middleware/rbac';
import {
  listPermissions,
  grantPermission,
  revokePermission,
  checkPermission,
  getUserById,
  getTeamById,
} from '../db/queries';

type Variables = AuthVariables & {
  userId: string;
  authType: 'api_key' | 'admin';
  scopes: string[];
};

const permissions = new Hono<{ Bindings: Env; Variables: Variables }>();

// All routes require authentication
permissions.use('*', requireAuth);

// ─── List Permissions ─────────────────────────────────────────────────────────
permissions.get('/', requireScope('permissions:read'), async (c) => {
  const userId = c.req.query('user_id');
  const teamId = c.req.query('team_id');

  const perms = await listPermissions(c.env.DB, {
    user_id: userId,
    team_id: teamId,
  });

  return c.json({ data: perms });
});

// ─── Check Permission ─────────────────────────────────────────────────────────
permissions.get('/check', requireScope('permissions:read'), async (c) => {
  const userId = c.req.query('user_id');
  const resource = c.req.query('resource');
  const action = c.req.query('action');
  const teamId = c.req.query('team_id');

  if (!userId || !resource || !action) {
    return c.json(
      { error: 'user_id, resource, and action query params are required' },
      400
    );
  }

  const allowed = await checkPermission(c.env.DB, userId, resource, action, teamId, c.env.CACHE);

  return c.json({
    data: {
      user_id: userId,
      resource,
      action,
      team_id: teamId ?? null,
      allowed,
    },
  });
});

// ─── Grant Permission ─────────────────────────────────────────────────────────
permissions.post('/', requireScope('permissions:admin'), async (c) => {
  const body = await c.req.json();

  if (!body.resource || !body.action) {
    return c.json({ error: 'resource and action are required' }, 400);
  }
  if (!body.user_id && !body.team_id) {
    return c.json({ error: 'At least one of user_id or team_id is required' }, 400);
  }

  // Validate user_id if provided
  if (body.user_id) {
    const user = await getUserById(c.env.DB, body.user_id, c.env.CACHE);
    if (!user) {
      return c.json({ error: 'User not found' }, 400);
    }
  }

  // Validate team_id if provided
  if (body.team_id) {
    const team = await getTeamById(c.env.DB, body.team_id, c.env.CACHE);
    if (!team) {
      return c.json({ error: 'Team not found' }, 400);
    }
  }

  const perm = await grantPermission(c.env.DB, {
    user_id: body.user_id,
    team_id: body.team_id,
    resource: body.resource,
    action: body.action,
  }, c.env.CACHE);

  return c.json({ data: perm }, 201);
});

// ─── Revoke Permission ────────────────────────────────────────────────────────
permissions.delete('/:id', requireScope('permissions:admin'), async (c) => {
  const id = c.req.param('id');

  const revoked = await revokePermission(c.env.DB, id, c.env.CACHE);
  if (!revoked) {
    return c.json({ error: 'Permission not found' }, 404);
  }

  return c.json({ data: { revoked: true, id } });
});

export default permissions;
