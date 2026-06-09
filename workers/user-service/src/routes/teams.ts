/**
 * Team Management Routes
 *
 * GET    /api/teams                  — List teams
 * GET    /api/teams/:teamId          — Get team by ID
 * POST   /api/teams                  — Create a team
 * PATCH  /api/teams/:teamId          — Update a team
 * DELETE /api/teams/:teamId          — Delete a team
 *
 * GET    /api/teams/:teamId/members          — List team members
 * POST   /api/teams/:teamId/members          — Add a member
 * PATCH  /api/teams/:teamId/members/:userId  — Update member role
 * DELETE /api/teams/:teamId/members/:userId  — Remove a member
 */

import { Hono } from 'hono';
import type { Env, TeamRole } from '../db/schema';
import type { AuthVariables } from '../middleware/auth';
import { requireAuth } from '../middleware/auth';
import { requireScope, requireTeamRole } from '../middleware/rbac';
import {
  listTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  addTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  getUserById,
  getTeamMember,
} from '../db/queries';

type Variables = AuthVariables & {
  userId: string;
  authType: 'api_key' | 'admin';
  scopes: string[];
};

const teams = new Hono<{ Bindings: Env; Variables: Variables }>();

// All routes require authentication
teams.use('*', requireAuth);

// ─── List Teams ───────────────────────────────────────────────────────────────
teams.get('/', requireScope('teams:read'), async (c) => {
  const limit = Number(c.req.query('limit') ?? 50);
  const offset = Number(c.req.query('offset') ?? 0);

  const teams = await listTeams(c.env.DB, { limit, offset }, c.env.CACHE);

  return c.json({
    data: teams,
    meta: { limit, offset },
  });
});

// ─── Get Team by ID ───────────────────────────────────────────────────────────
teams.get('/:teamId', requireScope('teams:read'), async (c) => {
  const teamId = c.req.param('teamId');
  const team = await getTeamById(c.env.DB, teamId, c.env.CACHE);

  if (!team) {
    return c.json({ error: 'Team not found' }, 404);
  }

  return c.json({ data: team });
});

// ─── Create Team ──────────────────────────────────────────────────────────────
teams.post('/', requireScope('teams:write'), async (c) => {
  const body = await c.req.json();

  if (!body.name || typeof body.name !== 'string') {
    return c.json({ error: 'name is required' }, 400);
  }

  const ownerId = body.owner_id ?? c.get('userId');

  // Verify owner exists
  const owner = await getUserById(c.env.DB, ownerId, c.env.CACHE);
  if (!owner) {
    return c.json({ error: 'Owner user not found' }, 400);
  }

  const team = await createTeam(c.env.DB, {
    name: body.name,
    description: body.description,
    owner_id: ownerId,
  }, c.env.CACHE);

  return c.json({ data: team }, 201);
});

// ─── Update Team ──────────────────────────────────────────────────────────────
teams.patch(
  '/:teamId',
  requireScope('teams:write'),
  requireTeamRole('admin'),
  async (c) => {
    const teamId = c.req.param('teamId');
    const body = await c.req.json();

    const existing = await getTeamById(c.env.DB, teamId, c.env.CACHE);
    if (!existing) {
      return c.json({ error: 'Team not found' }, 404);
    }

    const team = await updateTeam(c.env.DB, teamId, {
      name: body.name,
      description: body.description,
    }, c.env.CACHE);

    return c.json({ data: team });
  }
);

// ─── Delete Team ──────────────────────────────────────────────────────────────
teams.delete(
  '/:teamId',
  requireScope('teams:admin'),
  requireTeamRole('owner'),
  async (c) => {
    const teamId = c.req.param('teamId');

    const existing = await getTeamById(c.env.DB, teamId, c.env.CACHE);
    if (!existing) {
      return c.json({ error: 'Team not found' }, 404);
    }

    await deleteTeam(c.env.DB, teamId, c.env.CACHE);

    return c.json({ data: { deleted: true, id: teamId } });
  }
);

// ─── List Team Members ────────────────────────────────────────────────────────
teams.get('/:teamId/members', requireScope('teams:read'), async (c) => {
  const teamId = c.req.param('teamId');

  const team = await getTeamById(c.env.DB, teamId, c.env.CACHE);
  if (!team) {
    return c.json({ error: 'Team not found' }, 404);
  }

  const members = await getTeamMembers(c.env.DB, teamId, c.env.CACHE);

  return c.json({ data: members });
});

// ─── Add Team Member ──────────────────────────────────────────────────────────
teams.post(
  '/:teamId/members',
  requireScope('teams:write'),
  requireTeamRole('admin'),
  async (c) => {
    const teamId = c.req.param('teamId');
    const body = await c.req.json();

    if (!body.user_id) {
      return c.json({ error: 'user_id is required' }, 400);
    }

    const validRoles: TeamRole[] = ['admin', 'member', 'viewer'];
    if (!body.role || !validRoles.includes(body.role)) {
      return c.json({ error: `role must be one of: ${validRoles.join(', ')}` }, 400);
    }

    // Check user exists
    const user = await getUserById(c.env.DB, body.user_id, c.env.CACHE);
    if (!user) {
      return c.json({ error: 'User not found' }, 400);
    }

    // Check not already a member
    const existing = await getTeamMember(c.env.DB, teamId, body.user_id, c.env.CACHE);
    if (existing) {
      return c.json({ error: 'User is already a member of this team' }, 409);
    }

    const member = await addTeamMember(c.env.DB, teamId, {
      user_id: body.user_id,
      role: body.role,
    }, c.env.CACHE);

    return c.json({ data: member }, 201);
  }
);

// ─── Update Member Role ───────────────────────────────────────────────────────
teams.patch(
  '/:teamId/members/:userId',
  requireScope('teams:write'),
  requireTeamRole('admin'),
  async (c) => {
    const teamId = c.req.param('teamId');
    const userId = c.req.param('userId');
    const body = await c.req.json();

    const validRoles: TeamRole[] = ['admin', 'member', 'viewer'];
    if (!body.role || !validRoles.includes(body.role)) {
      return c.json({ error: `role must be one of: ${validRoles.join(', ')}` }, 400);
    }

    // Prevent changing owner role through this endpoint
    const existing = await getTeamMember(c.env.DB, teamId, userId, c.env.CACHE);
    if (!existing) {
      return c.json({ error: 'Member not found in this team' }, 404);
    }
    if (existing.role === 'owner') {
      return c.json({ error: 'Cannot change owner role via this endpoint' }, 400);
    }

    const updated = await updateTeamMemberRole(c.env.DB, teamId, userId, body.role, c.env.CACHE);
    if (!updated) {
      return c.json({ error: 'Failed to update role' }, 500);
    }

    return c.json({ data: { team_id: teamId, user_id: userId, role: body.role } });
  }
);

// ─── Remove Team Member ───────────────────────────────────────────────────────
teams.delete(
  '/:teamId/members/:userId',
  requireScope('teams:write'),
  requireTeamRole('admin'),
  async (c) => {
    const teamId = c.req.param('teamId');
    const userId = c.req.param('userId');

    const existing = await getTeamMember(c.env.DB, teamId, userId, c.env.CACHE);
    if (!existing) {
      return c.json({ error: 'Member not found in this team' }, 404);
    }
    if (existing.role === 'owner') {
      return c.json({ error: 'Cannot remove team owner' }, 400);
    }

    await removeTeamMember(c.env.DB, teamId, userId, c.env.CACHE);

    return c.json({ data: { removed: true, team_id: teamId, user_id: userId } });
  }
);

export default teams;
