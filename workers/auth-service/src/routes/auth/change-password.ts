/**
 * POST /auth/change-password
 * Change password for authenticated user
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types.js';
import { requireAuth, type AuthContext } from '../../middleware/auth.js';
import { changePasswordSchema, validate } from '../../lib/validation.js';
import { verifyPassword, hashPassword } from '../../lib/password.js';
import { findUserById, updatePassword } from '../../db/users.js';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/change-password', requireAuth, async (c: AuthContext) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    // Validate input
    const validation = validate(changePasswordSchema, body);
    if (!validation.success) {
      return c.json(
        { error: 'Validation failed', message: 'Invalid input', details: validation.errors },
        400
      );
    }

    const { currentPassword, newPassword } = validation.data;

    // Find user
    const dbUser = await findUserById(c.env.DB, user.sub);
    if (!dbUser) {
      return c.json({ error: 'Not found', message: 'User not found' }, 404);
    }

    // Verify current password
    if (!dbUser.password_hash) {
      return c.json({ error: 'Unauthorized', message: 'No password set' }, 401);
    }

    const validPassword = await verifyPassword(dbUser.password_hash, currentPassword);
    if (!validPassword) {
      return c.json({ error: 'Unauthorized', message: 'Current password is incorrect' }, 401);
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await updatePassword(c.env.DB, user.sub, newPasswordHash);

    return c.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json({ error: 'Internal server error', message: 'Failed to change password' }, 500);
  }
});

export default auth;
