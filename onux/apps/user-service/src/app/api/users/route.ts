/**
 * User API routes
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { validateInput, createUserSchema, updateUserSchema, listUsersSchema } from '@/lib/validation';
import * as userDb from '@/db/users';
import { toPublicUser } from '@/lib/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('user-api');

/**
 * GET /api/users - List users
 */
export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  const validation = validateInput(listUsersSchema, {
    page: searchParams.get('page'),
    pageSize: searchParams.get('pageSize'),
    status: searchParams.get('status'),
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation Error', details: validation.errors },
      { status: 400 }
    );
  }

  try {
    const { users, total } = await userDb.listUsers(validation.data);
    const page = validation.data.page || 1;
    const pageSize = validation.data.pageSize || 20;

    return NextResponse.json({
      success: true,
      data: users.map(toPublicUser),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logger.error('Failed to list users', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to list users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users - Create user (service auth only)
 */
export async function POST(request: NextRequest) {
  const authResult = requireAuth(request, { allowServiceAuth: true });
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (!authResult.serviceAuth) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'Only services can create users' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const validation = validateInput(createUserSchema, body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation Error', details: validation.errors },
      { status: 400 }
    );
  }

  try {
    const user = await userDb.createUser(validation.data);
    logger.info('User created', { userId: user.id, email: user.email });

    return NextResponse.json(
      { success: true, data: toPublicUser(user) },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Conflict', message: 'User with this email already exists' },
        { status: 409 }
      );
    }
    logger.error('Failed to create user', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to create user' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/:id - Get user by ID
 */
export async function getUserById(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Check if user can access this profile
  if (!authResult.serviceAuth && authResult.userId !== params.id) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'You can only access your own profile' },
      { status: 403 }
    );
  }

  try {
    const user = await userDb.findUserById(params.id);
    if (!user) {
      return NextResponse.json(
        { error: 'Not Found', message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: toPublicUser(user),
    });
  } catch (error) {
    logger.error('Failed to get user', error, { userId: params.id });
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to get user' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/:id - Update user
 */
export async function updateUser(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Check if user can update this profile
  if (!authResult.serviceAuth && authResult.userId !== params.id) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'You can only update your own profile' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const validation = validateInput(updateUserSchema, body);

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation Error', details: validation.errors },
      { status: 400 }
    );
  }

  try {
    const user = await userDb.updateUser(params.id, validation.data);
    if (!user) {
      return NextResponse.json(
        { error: 'Not Found', message: 'User not found' },
        { status: 404 }
      );
    }

    logger.info('User updated', { userId: user.id });

    return NextResponse.json({
      success: true,
      data: toPublicUser(user),
    });
  } catch (error) {
    logger.error('Failed to update user', error, { userId: params.id });
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to update user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/:id - Delete user (soft delete)
 */
export async function deleteUser(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Only service auth or self can delete
  if (!authResult.serviceAuth && authResult.userId !== params.id) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'You can only delete your own account' },
      { status: 403 }
    );
  }

  try {
    await userDb.deleteUser(params.id);
    logger.info('User deleted', { userId: params.id });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete user', error, { userId: params.id });
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
