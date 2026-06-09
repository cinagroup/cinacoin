/**
 * GET /api/auth/oauth/:provider
 * Initiates OAuth flow - redirects user to provider's authorization URL
 *
 * Query params:
 *   - redirect_uri (optional): Where to redirect after auth completes
 *   - return_url (optional): Frontend URL to redirect after callback
 *
 * Rate Limited: 10 requests per 15 minutes.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthorizationUrl,
  isProviderConfigured,
} from '@/lib/oauth/providers.js';
import {
  generateState,
  generateCodeVerifier,
  storeOAuthState,
} from '@/lib/oauth/state.js';
import type { OAuthProvider } from '@/lib/types.js';
import { withRateLimit } from '@/middleware/rate-limit';

const VALID_PROVIDERS: OAuthProvider[] = ['google', 'github', 'discord'];

async function _GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;

    // Validate provider
    if (!VALID_PROVIDERS.includes(provider as OAuthProvider)) {
      return NextResponse.json(
        { error: 'Bad Request', message: `Unsupported OAuth provider: ${provider}` },
        { status: 400 }
      );
    }

    const oauthProvider = provider as OAuthProvider;

    // Check if provider is configured
    if (!isProviderConfigured(oauthProvider)) {
      return NextResponse.json(
        { error: 'Service Unavailable', message: `OAuth provider ${provider} is not configured` },
        { status: 503 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const redirectUri = searchParams.get('redirect_uri') || undefined;
    const returnUrl = searchParams.get('return_url') || undefined;

    // Generate state for CSRF protection
    const state = generateState();

    // Generate PKCE code verifier (used for Google)
    const codeVerifier = oauthProvider === 'google' ? generateCodeVerifier() : undefined;

    // Store state in database
    await storeOAuthState({
      provider: oauthProvider,
      state,
      codeVerifier,
      redirectUri,
      returnUrl,
    });

    // Get authorization URL from provider (synchronous in arctic v3)
    const { url } = getAuthorizationUrl(oauthProvider, state, codeVerifier);

    // Redirect user to provider's authorization page
    return NextResponse.redirect(url.toString());
  } catch (error) {
    console.error('OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}

// Apply rate limiting: 10 requests per 15 minutes
export const GET = withRateLimit(_GET as any, 'oauth');
