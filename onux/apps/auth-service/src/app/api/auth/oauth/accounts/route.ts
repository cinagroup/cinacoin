/**
 * GET /api/auth/oauth/accounts - List user's linked OAuth accounts
 * POST /api/auth/oauth/link - Link an OAuth account to current user
 * DELETE /api/auth/oauth/accounts/:id - Unlink an OAuth account
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth.js';
import {
  findOAuthAccountsByUserId,
  findOAuthAccountById,
  deleteOAuthAccount,
  userHasPassword,
  countOAuthAccounts,
  updateUserOAuthProviders,
  writeAuditLog,
} from '@/db/oauth-accounts.js';
import { toPublicOAuthAccount } from '@/lib/types.js';
import type { OAuthProvider } from '@/lib/types.js';

/**
 * GET /api/auth/oauth/accounts
 * List all OAuth accounts linked to the current user
 */
export const GET = requireAuth(async (req: NextRequest) => {
  try {
    const userId = req.user!.sub;

    const accounts = await findOAuthAccountsByUserId(userId);
    const hasPassword = await userHasPassword(userId);

    return NextResponse.json({
      success: true,
      data: {
        accounts: accounts.map(toPublicOAuthAccount),
        hasPassword,
        totalAccounts: accounts.length,
      },
    });
  } catch (error) {
    console.error('List OAuth accounts error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to list OAuth accounts' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/auth/oauth/accounts/:id
 * Unlink an OAuth account from the current user
 */
export const DELETE = requireAuth(async (req: NextRequest) => {
  try {
    const userId = req.user!.sub;
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('id');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Find the account
    const account = await findOAuthAccountById(accountId);
    if (!account) {
      return NextResponse.json(
        { error: 'Not Found', message: 'OAuth account not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (account.user_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not own this account' },
        { status: 403 }
      );
    }

    // Safety check: ensure user has another way to login
    const hasPassword = await userHasPassword(userId);
    const totalAccounts = await countOAuthAccounts(userId);

    if (!hasPassword && totalAccounts <= 1) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Cannot unlink the only login method. Set a password or link another account first.',
        },
        { status: 400 }
      );
    }

    // Delete the account
    const deleted = await deleteOAuthAccount(accountId, userId);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Failed to unlink account' },
        { status: 404 }
      );
    }

    // Update user's oauth_providers JSON
    await updateUserOAuthProviders(userId);

    // Audit log
    await writeAuditLog({
      userId,
      action: 'oauth.unlink',
      resourceType: 'oauth_account',
      resourceId: accountId,
      details: {
        provider: account.provider,
        providerUserId: account.provider_user_id,
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
      status: 'success',
    });

    return NextResponse.json({
      success: true,
      message: 'OAuth account unlinked successfully',
    });
  } catch (error) {
    console.error('Unlink OAuth account error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to unlink OAuth account' },
      { status: 500 }
    );
  }
});
