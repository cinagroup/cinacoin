/**
 * User teams route
 * GET /api/users/:id/teams - Get user's teams
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import * as teamDb from '@/db/teams';
import { toPublicTeam } from '@/lib/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('user-teams-api');

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Check if user can access this profile
  if (!authResult.serviceAuth && authResult.userId !== params.id) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'You can only access your own teams' },
      { status: 403 }
    );
  }

  try {
    const teams = await teamDb.getUserTeams(params.id);

    return NextResponse.json({
      success: true,
      data: teams.map(toPublicTeam),
    });
  } catch (error) {
    logger.error('Failed to get user teams', error, { userId: params.id });
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to get user teams' },
      { status: 500 }
    );
  }
}
