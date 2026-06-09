/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 * 
 * Security: If user has MFA enabled, returns mfaRequired: true with a temporary
 * mfaToken instead of JWT. Client must then call POST /api/auth/mfa/verify-login
 * with the mfaToken and TOTP code to receive the actual JWT tokens.
 * 
 * Rate Limited: 5 requests per 15 minutes with progressive penalty on failures.
 */
import { NextRequest, NextResponse } from 'next/server';
import { loginSchema, validate, verifyPassword, generateTokenPair, toPublicUser } from '@/lib';
import { findUserByEmail, updateLastLogin, getUserTotpMethod, createMfaSession } from '@/db';
import { withRateLimit, recordAuthFailure, recordAuthSuccess } from '@/middleware/rate-limit';

async function _POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validate(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      await recordAuthFailure(request, 'login');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check user status
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Account is suspended or deleted' },
        { status: 403 }
      );
    }

    // Verify password
    const validPassword = await verifyPassword(user.password_hash, password);
    if (!validPassword) {
      await recordAuthFailure(request, 'login');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if MFA is enabled for this user
    const totpMethod = await getUserTotpMethod(user.id);
    
    if (totpMethod && totpMethod.is_enabled) {
      // MFA is enabled - do NOT return JWT yet
      // Create a temporary MFA session token (5-minute expiry)
      const mfaToken = await createMfaSession(user.id);
      
      return NextResponse.json({
        success: true,
        data: {
          mfaRequired: true,
          mfaToken: mfaToken,
          mfaTokenExpiresIn: 300, // 5 minutes in seconds
        },
      });
    }

    // MFA not enabled - proceed with normal JWT issuance
    // Reset failure count on success
    await recordAuthSuccess(request, 'login');

    // Update last login
    await updateLastLogin(user.id);

    // Generate tokens
    const tokens = generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...tokens,
        tokenType: 'Bearer' as const,
        user: toPublicUser(user),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to login' },
      { status: 500 }
    );
  }
}

// Apply rate limiting: 5 requests per 15 minutes with progressive penalty
export const POST = withRateLimit(_POST, 'login', { useProgressivePenalty: true });
