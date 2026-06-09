/**
 * POST /api/auth/register
 * Register a new user account
 * 
 * Rate Limited: 3 requests per hour to prevent abuse.
 */
import { NextRequest, NextResponse } from 'next/server';
import { registerSchema, validate, hashPassword, generateTokenPair, toPublicUser } from '@/lib';
import { createUser, emailExists, usernameExists } from '@/db';
import { withRateLimit } from '@/middleware/rate-limit';

async function _POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validate(registerSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    const { email, username, password, displayName } = validation.data;

    // Check if email already exists
    if (await emailExists(email)) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Check if username already exists
    if (await usernameExists(username)) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Username already taken' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await createUser({
      email,
      username,
      passwordHash,
      displayName,
    });

    // Generate tokens
    const tokens = generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...tokens,
          tokenType: 'Bearer' as const,
          user: toPublicUser(user),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to register user' },
      { status: 500 }
    );
  }
}

// Apply rate limiting: 3 requests per hour
export const POST = withRateLimit(_POST, 'register');
