/**
 * Team members route
 */
import { NextRequest, NextResponse } from 'next/server';
import { getTeamMembers, addTeamMember } from '../route';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return getTeamMembers(request, { params });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return addTeamMember(request, { params });
}
