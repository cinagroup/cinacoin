/**
 * Team by ID route handler
 */
import { NextRequest, NextResponse } from 'next/server';
import { getTeamById, updateTeam } from '../route';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return getTeamById(request, { params });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return updateTeam(request, { params });
}
