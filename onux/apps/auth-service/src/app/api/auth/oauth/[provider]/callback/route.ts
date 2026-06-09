/**
 * GET /api/auth/oauth/:provider/callback
 * Handles OAuth callback from provider
 *
 * Query params from provider:
 *   - code: Authorization code
 *   - state: CSRF state parameter
 */
import { NextRequest, NextResponse } from 'next/server';
import { validateCallback } from '@/lib/oauth/providers';
import { validateAndConsumeState } from '@/lib/oauth/state';
import {
  findOAuthAccount,
  createOAuthAccount,
  updateOAuthAccount,
  updateUserOAuthProviders,
  writeAuditLog,
} from '@/db/oauth-accounts';
import { findUserById, findUserByEmail, createUser, updateLastLogin } from '@/db/users';
import { generateTokenPair } from '@/lib/jwt';
import { toPublicUser } from '@/lib/types';
import type { OAuthProvider } from '@/lib/types';
import crypto from 'crypto';

const VALID_PROVIDERS: OAuthProvider[] = ['google', 'github', 'discord'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const { searchParams } = new URL(request.url);

    // Validate provider
    if (!VALID_PROVIDERS.includes(provider as OAuthProvider)) {
      return NextResponse.json(
        { error: 'Bad Request', message: `Unsupported OAuth provider: ${provider}` },
        { status: 400 }
      );
    }

    const oauthProvider = provider as OAuthProvider;

    // Get code and state from query params
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle provider error
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'OAuth authorization failed';
      console.error(`OAuth error from ${provider}:`, error, errorDescription);
      return NextResponse.json(
        { error: 'OAuth Error', message: errorDescription },
        { status: 400 }
      );
    }

    // Validate required params
    if (!code || !state) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing code or state parameter' },
        { status: 400 }
      );
    }

    // Validate and consume state (CSRF protection)
    const stateRecord = await validateAndConsumeState(state, oauthProvider);
    if (!stateRecord) {
      return NextResponse.json(
        { error: 'Invalid State', message: 'OAuth state is invalid or expired' },
        { status: 400 }
      );
    }

    // Validate authorization code and get user profile
    const userProfile = await validateCallback(
      oauthProvider,
      code,
      stateRecord.code_verifier || undefined
    );

    // Check if OAuth account already exists
    let oauthAccount = await findOAuthAccount(oauthProvider, userProfile.id);
    let userId: string;
    let isNewUser = false;
    let isAccountLink = false;

    if (oauthAccount) {
      // Existing OAuth account - update tokens and profile
      userId = oauthAccount.user_id;
      await updateOAuthAccount(oauthAccount.id, {
        accessToken: userProfile.raw.access_token as string,
        rawProfile: userProfile.raw,
        providerEmail: userProfile.email || undefined,
      });
    } else {
      // New OAuth account
      // Check if user exists with this email
      let user = userProfile.email ? await findUserByEmail(userProfile.email) : null;

      if (user) {
        // Link OAuth to existing user
        userId = user.id;
        isAccountLink = true;
      } else {
        // Create new user
        const newUserId = crypto.randomUUID();
        const username = generateUsernameFromProfile(userProfile);
        const displayName = userProfile.displayName || userProfile.name || username;

        user = await createUser({
          id: newUserId,
          email: userProfile.email || `${userProfile.id}@${oauthProvider}.oauth`,
          username,
          passwordHash: '', // No password for OAuth-only users
          displayName,
          role: 'user',
        });

        userId = newUserId;
        isNewUser = true;

        // Mark email as verified if provider verified it
        if (userProfile.emailVerified && userProfile.email) {
          await updateLastLogin(userId); // This also updates the timestamp
        }
      }

      // Create OAuth account link
      oauthAccount = await createOAuthAccount({
        userId,
        provider: oauthProvider,
        providerUserId: userProfile.id,
        providerEmail: userProfile.email,
        accessToken: userProfile.raw.access_token as string,
        refreshToken: userProfile.raw.refresh_token as string,
        scope: userProfile.raw.scope as string,
        rawProfile: userProfile.raw,
      });
    }

    // Update user's oauth_providers JSON field
    await updateUserOAuthProviders(userId);

    // Update last login
    await updateLastLogin(userId);

    // Generate JWT tokens
    const user = await findUserById(userId);
    if (!user) {
      throw new Error('User not found after OAuth flow');
    }

    const tokens = generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Write audit log
    await writeAuditLog({
      userId,
      action: isNewUser ? 'oauth.register' : 'oauth.login',
      resourceType: 'oauth_account',
      resourceId: oauthAccount.id,
      details: {
        provider: oauthProvider,
        providerUserId: userProfile.id,
        isNewUser,
        isAccountLink,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
      status: 'success',
    });

    // Determine redirect URL
    const returnUrl = stateRecord.return_url;
    if (returnUrl) {
      // Redirect to frontend with success indicator and tokens in httpOnly cookies
      const redirectUrl = new URL(returnUrl);
      redirectUrl.searchParams.set('oauth', 'success');
      
      const response = NextResponse.redirect(redirectUrl.toString());
      
      // Set tokens as httpOnly, secure, sameSite=strict cookies
      response.cookies.set('oauth_access_token', tokens.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: tokens.expiresIn,
        path: '/',
      });
      
      response.cookies.set('oauth_refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
      
      response.cookies.set('oauth_expires_in', tokens.expiresIn.toString(), {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: tokens.expiresIn,
        path: '/',
      });
      
      return response;
    }

    // Return JSON response
    return NextResponse.json({
      success: true,
      data: {
        ...tokens,
        tokenType: 'Bearer' as const,
        user: toPublicUser(user),
        oauth: {
          provider: oauthProvider,
          isNewUser,
          isAccountLink,
        },
      },
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to complete OAuth flow' },
      { status: 500 }
    );
  }
}

/**
 * Generate a username from OAuth profile
 */
function generateUsernameFromProfile(profile: {
  displayName: string | null;
  name: string | null;
  email: string | null;
  id: string;
}): string {
  // Try display name first
  if (profile.displayName) {
    const sanitized = profile.displayName
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .substring(0, 20);
    if (sanitized.length >= 3) {
      return sanitized;
    }
  }

  // Try name
  if (profile.name) {
    const sanitized = profile.name
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .substring(0, 20);
    if (sanitized.length >= 3) {
      return sanitized;
    }
  }

  // Try email prefix
  if (profile.email) {
    const prefix = profile.email.split('@')[0];
    const sanitized = prefix.toLowerCase().replace(/[^a-z0-9_-]/g, '').substring(0, 20);
    if (sanitized.length >= 3) {
      return sanitized;
    }
  }

  // Fallback to user_ + id prefix
  return `user_${profile.id.substring(0, 8)}`;
}
