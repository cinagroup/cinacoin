/**
 * Team data access layer
 */
import { query } from './pool.js';
import type { TeamRecord, TeamMemberRecord, TeamMemberRole } from '../lib/types.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTeamParams {
  name: string;
  slug: string;
  description?: string;
  avatarUrl?: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateTeamParams {
  name?: string;
  slug?: string;
  description?: string;
  avatarUrl?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export async function createTeam(params: CreateTeamParams): Promise<TeamRecord> {
  const id = uuidv4();
  const { name, slug, description, avatarUrl, createdBy, metadata = {} } = params;

  const result = await query<TeamRecord>(
    `
    INSERT INTO teams (id, name, slug, description, avatar_url, created_by, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [id, name, slug, description || null, avatarUrl || null, createdBy, metadata]
  );

  // Add creator as owner
  await addTeamMember(id, createdBy, 'owner', createdBy);

  return result.rows[0];
}

export async function findTeamById(id: string): Promise<TeamRecord | null> {
  const result = await query<TeamRecord>(
    'SELECT * FROM teams WHERE id = $1 AND is_active = TRUE',
    [id]
  );
  return result.rows[0] || null;
}

export async function findTeamBySlug(slug: string): Promise<TeamRecord | null> {
  const result = await query<TeamRecord>(
    'SELECT * FROM teams WHERE slug = $1 AND is_active = TRUE',
    [slug]
  );
  return result.rows[0] || null;
}

export async function updateTeam(id: string, params: UpdateTeamParams): Promise<TeamRecord | null> {
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (params.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`);
    values.push(params.name);
  }

  if (params.slug !== undefined) {
    setClauses.push(`slug = $${paramIndex++}`);
    values.push(params.slug);
  }

  if (params.description !== undefined) {
    setClauses.push(`description = $${paramIndex++}`);
    values.push(params.description);
  }

  if (params.avatarUrl !== undefined) {
    setClauses.push(`avatar_url = $${paramIndex++}`);
    values.push(params.avatarUrl);
  }

  if (params.isActive !== undefined) {
    setClauses.push(`is_active = $${paramIndex++}`);
    values.push(params.isActive);
  }

  if (params.metadata !== undefined) {
    setClauses.push(`metadata = $${paramIndex++}`);
    values.push(JSON.stringify(params.metadata));
  }

  if (setClauses.length === 0) {
    return findTeamById(id);
  }

  setClauses.push('updated_at = NOW()');
  values.push(id);

  const result = await query<TeamRecord>(
    `UPDATE teams SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND is_active = TRUE RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

export async function listTeams(params: {
  page?: number;
  pageSize?: number;
  userId?: string;
}): Promise<{ teams: TeamRecord[]; total: number }> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let whereClause = 't.is_active = TRUE';
  const values: any[] = [];
  let paramIndex = 1;

  if (params.userId) {
    whereClause += ' AND EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = t.id AND tm.user_id = $1 AND tm.is_active = TRUE)';
    values.push(params.userId);
    paramIndex++;
  }

  const countResult = await query(
    `SELECT COUNT(*) as total FROM teams t WHERE ${whereClause}`,
    values
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const teamsResult = await query<TeamRecord>(
    `
    SELECT t.* FROM teams t
    WHERE ${whereClause}
    ORDER BY t.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `,
    [...values, pageSize, offset]
  );

  return { teams: teamsResult.rows, total };
}

export async function deleteTeam(id: string): Promise<void> {
  await query(
    'UPDATE teams SET is_active = FALSE, updated_at = NOW() WHERE id = $1',
    [id]
  );
}

// ============================================================================
// TEAM MEMBERS
// ============================================================================

export async function addTeamMember(
  teamId: string,
  userId: string,
  role: TeamMemberRole,
  invitedBy?: string
): Promise<TeamMemberRecord> {
  const id = uuidv4();

  const result = await query<TeamMemberRecord>(
    `
    INSERT INTO team_members (id, team_id, user_id, role, invited_by)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (team_id, user_id) DO UPDATE SET role = $4, is_active = TRUE, updated_at = NOW()
    RETURNING *
    `,
    [id, teamId, userId, role, invitedBy || null]
  );

  return result.rows[0];
}

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  await query(
    'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
    [teamId, userId]
  );
}

export async function getTeamMembers(teamId: string): Promise<TeamMemberRecord[]> {
  const result = await query<TeamMemberRecord>(
    'SELECT * FROM team_members WHERE team_id = $1 AND is_active = TRUE ORDER BY joined_at',
    [teamId]
  );
  return result.rows;
}

export async function getUserTeams(userId: string): Promise<TeamRecord[]> {
  const result = await query<TeamRecord>(
    `
    SELECT t.* FROM teams t
    INNER JOIN team_members tm ON t.id = tm.team_id
    WHERE tm.user_id = $1 AND tm.is_active = TRUE AND t.is_active = TRUE
    ORDER BY t.created_at DESC
    `,
    [userId]
  );
  return result.rows;
}

export async function getTeamMember(teamId: string, userId: string): Promise<TeamMemberRecord | null> {
  const result = await query<TeamMemberRecord>(
    'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2 AND is_active = TRUE',
    [teamId, userId]
  );
  return result.rows[0] || null;
}

export async function updateTeamMemberRole(
  teamId: string,
  userId: string,
  role: TeamMemberRole
): Promise<TeamMemberRecord | null> {
  const result = await query<TeamMemberRecord>(
    `
    UPDATE team_members 
    SET role = $3, updated_at = NOW() 
    WHERE team_id = $1 AND user_id = $2 AND is_active = TRUE
    RETURNING *
    `,
    [teamId, userId, role]
  );
  return result.rows[0] || null;
}
