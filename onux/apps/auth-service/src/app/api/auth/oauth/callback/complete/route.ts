/**
 * POST /api/auth/oauth/callback/complete
 * Retrieves OAuth tokens from httpOnly cookies and returns them to the client
 * This endpoint is called by the frontend after OAuth redirect
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Read tokens from httpOnly cookies
    const accessToken = request.cookies.get('oauth_access_token')?.value;
    const refreshToken = request.cookies.get('oauth_refresh_token')?.value;
    const expiresIn = request.cookies.get('oauth_expires_in')?.value;

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Missing OAuth tokens in cookies' },
        { status: 400 }
      );
    }

    // Return tokens to client
    const response = NextResponse.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: expiresIn ? parseInt(expiresIn, 10) : 3600,
      },
    });

    // Clear the cookies after reading
    response.cookies.set('oauth_access_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('oauth_refresh_token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('oauth_expires_in', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OAuth callback complete error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve OAuth tokens' },
      { status: 500 }
    );
  }
}
