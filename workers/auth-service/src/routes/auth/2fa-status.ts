/**
 * GET /auth/2fa-status
 * Check if user needs to set up 2FA
 */
import { Hono } from 'hono';
import type { Env } from '../../lib/types.js';
import { requireAuth, type AuthContext } from '../../middleware/auth.js';
import { checkTwoFAStatus } from '../../middleware/2fa-enforce.js';

const twoFaStatus = new Hono<{ Bindings: Env }>();

twoFaStatus.get('/2fa-status', requireAuth, async (c: AuthContext) => {
  try {
    const user = c.get('user');
    
    const status = await checkTwoFAStatus(c.env.DB, user.sub);
    
    return c.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('2FA status check error:', error);
    return c.json({ 
      error: 'Internal server error', 
      message: 'Failed to check 2FA status' 
    }, 500);
  }
});

export default twoFaStatus;
