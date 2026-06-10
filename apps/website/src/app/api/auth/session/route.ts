/**
 * POST /api/auth/session
 * 
 * SECURITY: Stores authentication tokens in httpOnly cookies instead of localStorage.
 * This prevents XSS attacks from stealing auth tokens.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accessToken, refreshToken } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'accessToken is required' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true });

    // Set access token as httpOnly cookie
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Set refresh token as httpOnly cookie if provided
    if (refreshToken) {
      response.cookies.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to set session' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Clear auth cookies
  response.cookies.set('access_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
