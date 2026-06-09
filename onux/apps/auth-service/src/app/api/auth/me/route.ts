/**
 * GET /api/auth/me
 * Get current authenticated user
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { findUserById } from '@/db';
import { toPublicUser } from '@/lib';

const handler = requireAuth(async (req: NextRequest) => {
  try {
    const userId = req.user!.sub;
    
    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Not found', message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: toPublicUser(user),
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to get user' },
      { status: 500 }
    );
  }
});

export { handler as GET };
