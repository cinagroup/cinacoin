/**
 * POST /api/auth/change-password
 * Change password for authenticated user
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { changePasswordSchema, validate, verifyPassword, hashPassword } from '@/lib';
import { findUserById, updatePassword } from '@/db';

const handler = requireAuth(async (req: NextRequest) => {
  try {
    const userId = req.user!.sub;
    const body = await req.json();
    
    // Validate input
    const validation = validate(changePasswordSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    // Find user
    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Not found', message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const validPassword = await verifyPassword(user.password_hash, currentPassword);
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await updatePassword(userId, newPasswordHash);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to change password' },
      { status: 500 }
    );
  }
});

export { handler as POST };
