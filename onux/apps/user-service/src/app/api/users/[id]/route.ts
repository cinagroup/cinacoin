/**
 * User by ID route handler
 */
import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser, deleteUser } from '../route';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return getUserById(request, { params });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return updateUser(request, { params });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return deleteUser(request, { params });
}
