/**
 * RBAC (Role-Based Access Control) Middleware
 *
 * Two layers of authorization:
 * 1. Scope-based: API key scopes must include the required scope
 * 2. Team-role-based: For team-scoped operations, checks team_members.role
 *
 * Usage:
 *   requireScope('users:write')
 *   requireTeamRole('admin')
 *   requireTeamRole('admin', { teamIdParam: 'teamId' })
 */

import { createMiddleware } from 'hono/factory';
import type { Env, TeamRole } from '../db/schema';
import type { AuthVariables } from './auth';
import { getTeamMember } from '../db/queries';

type Variables = AuthVariables & {
  userId: string;
  authType: 'api_key' | 'admin';
  scopes: string[];
};

/**
 * requireScope — ensures the authenticated principal has a specific scope.
 * Admin authType always passes.
 * Scope wildcard '*' matches everything.
 * Supports hierarchical scopes: 'users:write' implies 'users:read'.
 */
export function requireScope(required: string) {
  return createMiddleware<Env, Variables>(async (c, next) => {
    const authType = c.get('authType');
    if (authType === 'admin') {
      await next();
      return;
    }

    const scopes: string[] = c.get('scopes') ?? [];

    // Wildcard scope grants everything
    if (scopes.includes('*')) {
      await next();
      return;
    }

    // Direct match
    if (scopes.includes(required)) {
      await next();
      return;
    }

    // Hierarchical: 'resource:write' implies 'resource:read'
    const [resource, action] = required.split(':');
    if (action === 'read' && scopes.includes(`${resource}:write`)) {
      await next();
      return;
    }
    if (action === 'read' && scopes.includes(`${resource}:admin`)) {
      await next();
      return;
    }
    if (action === 'write' && scopes.includes(`${resource}:admin`)) {
      await next();
      return;
    }

    return c.json(
      { error: 'Insufficient scope', required, held: scopes },
      403
    );
  });
}

/**
 * requireTeamRole — ensures the authenticated user has at least the given role
 * in the team identified by a route parameter.
 *
 * Role hierarchy: owner > admin > member > viewer
 */
export function requireTeamRole(
  minRole: TeamRole,
  opts: { teamIdParam?: string } = {}
) {
  const { teamIdParam = 'teamId' } = opts;

  const roleRank: Record<TeamRole, number> = {
    viewer: 0,
    member: 1,
    admin: 2,
    owner: 3,
  };

  return createMiddleware<Env, Variables>(async (c, next) => {
    const authType = c.get('authType');
    if (authType === 'admin') {
      await next();
      return;
    }

    const userId = c.get('userId');
    const teamId = c.req.param(teamIdParam);

    if (!teamId) {
      return c.json({ error: `Missing route parameter: ${teamIdParam}` }, 400);
    }

    const membership = await getTeamMember(c.env.DB, teamId, userId, c.env.CACHE);
    if (!membership) {
      return c.json({ error: 'Not a member of this team' }, 403);
    }

    if (roleRank[membership.role] < roleRank[minRole]) {
      return c.json(
        {
          error: 'Insufficient team role',
          required: minRole,
          held: membership.role,
        },
        403
      );
    }

    await next();
  });
}

/**
 * requireOwnership — ensures the authenticated user owns the resource.
 * Falls through to admin bypass.
 */
export function requireOwnership(getOwnerId: (c: any) => Promise<string | null>) {
  return createMiddleware<Env, Variables>(async (c, next) => {
    const authType = c.get('authType');
    if (authType === 'admin') {
      await next();
      return;
    }

    const userId = c.get('userId');
    const ownerId = await getOwnerId(c);

    if (!ownerId || ownerId !== userId) {
      return c.json({ error: 'Ownership required' }, 403);
    }

    await next();
  });
}
