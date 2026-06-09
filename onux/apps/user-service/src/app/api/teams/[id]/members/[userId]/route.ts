/**
 * Team member by userId route handler
 */
import { NextRequest, NextResponse } from 'next/server';
import { updateTeamMemberRole, removeTeamMember } from '../../route';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  return updateTeamMemberRole(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  return removeTeamMember(request, { params });
}
