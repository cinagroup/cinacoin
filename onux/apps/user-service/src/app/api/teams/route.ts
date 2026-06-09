/**
 * Team API routes
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { validateInput, createTeamSchema, updateTeamSchema, listTeamsSchema, addTeamMemberSchema, updateTeamMemberRoleSchema } from '@/lib/validation';
import * as teamDb from '@/db/teams';
import { toPublicTeam, toPublicTeamMember } from '@/lib/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('team-api');

/**
 * GET /api/teams - List teams
 */
export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  const validation = validateInput(listTeamsSchema, {
    page: searchParams.get('page'),
    pageSize: searchParams.get('pageSize'),
    userId: searchParams.get('userId'),
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation Error', details: validation.errors },
      { status: 400 }
    );
  }

  try {
    const { teams, total } = await teamDb.listTeams(validation.data);
    const page = validation.data.page || 1;
    const pageSize = validation.data.pageSize || 20;

    return NextResponse.json({
      success: true,
      data: teams.map(toPublicTeam),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logger.error('Failed to list teams', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to list teams' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams - Create team
 */
export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const body = await request.json();
  const validation = validateInput(createTeamSchema, body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation Error', details: validation.errors },
      { status: 400 }
    );
  }

  // Determine creator
  const createdBy = authResult.userId || 'system';

  try {
    const team = await teamDb.createTeam({
      ...validation.data,
      createdBy,
    });

    logger.info('Team created', { teamId: team.id, slug: team.slug, createdBy });

    return NextResponse.json(
      { success: true, data: toPublicTeam(team) },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Conflict', message: 'Team with this slug already exists' },
        { status: 409 }
      );
    }
    logger.error('Failed to create team', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to create team' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/teams/:id - Get team by ID
 */
export async function getTeamById(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const team = await teamDb.findTeamById(params.id);
    if (!team) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Team not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: toPublicTeam(team),
    });
  } catch (error) {
    logger.error('Failed to get team', error, { teamId: params.id });
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to get team' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teams/:id - Update team
 */
export async function updateTeam(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const body = await request.json();
  const validation = validateInput(updateTeamSchema, body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation Error', details: validation.errors },
      { status: 400 }
    );
  }

  try {
    const team = await teamDb.updateTeam(params.id, validation.data);
    if (!team) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Team not found' },
        { status: 404 }
      );
    }

    logger.info('Team updated', { teamId: team.id });

    return NextResponse.json({
      success: true,
      data: toPublicTeam(team),
    });
  } catch (error) {
    logger.error('Failed to update team', error, { teamId: params.id });
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update team' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/teams/:id/members - Get team members
 */
export async function getTeamMembers(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const team = await teamDb.findTeamById(params.id);
    if (!team) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Team not found' },
        { status: 404 }
      );
    }

    const members = await teamDb.getTeamMembers(params.id);

    return NextResponse.json({
      success: true,
      data: members.map(toPublicTeamMember),
    });
  } catch (error) {
    logger.error('Failed to get team members', error, { teamId: params.id });
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to get team members' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams/:id/members - Add team member
 */
export async function addTeamMember(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const body = await request.json();
  const validation = validateInput(addTeamMemberSchema, body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation Error', details: validation.errors },
      { status: 400 }
    );
  }

  try {
    const team = await teamDb.findTeamById(params.id);
    if (!team) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Team not found' },
        { status: 404 }
      );
    }

    const member = await teamDb.addTeamMember(
      params.id,
      validation.data.userId,
      validation.data.role,
      authResult.userId
    );

    logger.info('Team member added', { teamId: params.id, userId: validation.data.userId, role: validation.data.role });

    return NextResponse.json(
      { success: true, data: toPublicTeamMember(member) },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Failed to add team member', error, { teamId: params.id });
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to add team member' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teams/:id/members/:userId - Update team member role
 */
export async function updateTeamMemberRole(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const body = await request.json();
  const validation = validateInput(updateTeamMemberRoleSchema, body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation Error', details: validation.errors },
      { status: 400 }
    );
  }

  try {
    const member = await teamDb.updateTeamMemberRole(params.id, params.userId, validation.data.role);
    if (!member) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Team member not found' },
        { status: 404 }
      );
    }

    logger.info('Team member role updated', { teamId: params.id, userId: params.userId, role: validation.data.role });

    return NextResponse.json({
      success: true,
      data: toPublicTeamMember(member),
    });
  } catch (error) {
    logger.error('Failed to update team member role', error, { teamId: params.id, userId: params.userId });
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update team member role' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams/:id/members/:userId - Remove team member
 */
export async function removeTeamMember(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    await teamDb.removeTeamMember(params.id, params.userId);

    logger.info('Team member removed', { teamId: params.id, userId: params.userId });

    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully',
    });
  } catch (error) {
    logger.error('Failed to remove team member', error, { teamId: params.id, userId: params.userId });
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}
