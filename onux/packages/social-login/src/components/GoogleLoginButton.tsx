/**
 * Google Login Button React component.
 *
 * A standalone, styled "Sign in with Google" button that
 * integrates with the GoogleOAuthProvider for OAuth2 flows.
 *
 * @example
 * ```tsx
 * <GoogleLoginButton
 *   clientId="your-client-id.apps.googleusercontent.com"
 *   redirectUri="https://example.com/auth/google/callback"
 *   onSuccess={(result) => console.log(result)}
 * />
 * ```
 */

import { useState, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { GoogleOAuthProvider } from '../providers/google.js';
import type { OAuth2UserProfile } from '../types.js';

// ─── Google Brand Colors ────────────────────────────────────────────────

const GOOGLE_COLORS = {
  blue: '#4285F4',
  red: '#EA4335',
  yellow: '#FBBC05',
  green: '#34A853',
  bgWhite: '#ffffff',
  textDark: '#3c4043',
  border: '#dadce0',
  bgDark: '#131314',
  textLight: '#ffffff',
};

// ─── Google SVG Icon ────────────────────────────────────────────────────

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill={GOOGLE_COLORS.red} d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill={GOOGLE_COLORS.blue} d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill={GOOGLE_COLORS.yellow} d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill={GOOGLE_COLORS.green} d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

// ─── Types ──────────────────────────────────────────────────────────────

export interface GoogleLoginButtonProps {
  /** Google OAuth2 client ID. */
  clientId: string;
  /** OAuth2 redirect URI. */
  redirectUri: string;
  /** OAuth2 client secret (for server-side flows). */
  clientSecret?: string;
  /** Optional hosted domain restriction (e.g., "example.com"). */
  hostedDomain?: string;
  /** Override OAuth scopes. */
  scopes?: string[];
  /** Custom button label text. */
  label?: string;
  /** Custom icon (overrides Google icon). */
  icon?: ReactNode;
  /** Custom CSS styles. */
  style?: CSSProperties;
  /** Additional CSS class name. */
  className?: string;
  /** Called on successful login. */
  onSuccess?: (tokens: { accessToken: string; idToken?: string; expiresIn: number }) => void;
  /** Called on login failure. */
  onError?: (error: Error) => void;
  /** Called when the OAuth flow starts. */
  onStart?: () => void;
  /** Whether the button is disabled. */
  disabled?: boolean;
  /** Button size. */
  size?: 'sm' | 'md' | 'lg';
  /** Theme variant. */
  theme?: 'light' | 'dark';
  /** Whether to show the button text. */
  showLabel?: boolean;
  /** Whether to use full-page redirect (default: true). Set false for popup. */
  redirect?: boolean;
}

/**
 * Google Login Button component.
 *
 * Handles the full Google OAuth2 flow when clicked, either via
 * full-page redirect or popup window.
 */
export function GoogleLoginButton({
  clientId,
  redirectUri,
  clientSecret,
  hostedDomain,
  scopes,
  label,
  icon,
  style,
  className,
  onSuccess,
  onError,
  onStart,
  disabled,
  size = 'md',
  theme = 'light',
  showLabel = true,
  redirect = true,
}: GoogleLoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const popupRef = useRef<Window | null>(null);

  const handleClick = useCallback(() => {
    if (disabled || loading) return;

    onStart?.();
    setLoading(true);

    const provider = new GoogleOAuthProvider();
    provider.init(clientId, redirectUri, {
      clientSecret,
      hostedDomain,
      scopes,
    });

    if (redirect) {
      // Full-page redirect
      provider.authorize();
    } else {
      // Popup window
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authUrl = provider.authorize();
      popupRef.current = window.open(
        authUrl,
        'google-oauth',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
      );

      // Listen for messages from the popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== new URL(redirectUri).origin) return;

        if (event.data?.error) {
          onError?.(new Error(event.data.error));
          setLoading(false);
        } else if (event.data?.code) {
          // Handle the callback
          provider
            .handleCallback(event.data.code, clientSecret)
            .then((tokens) => {
              onSuccess?.(tokens);
              setLoading(false);
            })
            .catch((err) => {
              onError?.(err instanceof Error ? err : new Error(String(err)));
              setLoading(false);
            });
        }

        window.removeEventListener('message', handleMessage);
      };

      window.addEventListener('message', handleMessage);
    }
  }, [clientId, redirectUri, clientSecret, hostedDomain, scopes, disabled, loading, redirect, onSuccess, onError, onStart]);

  const sizes = {
    sm: { height: '36px', fontSize: '13px', iconSize: 16, padding: '0 12px' },
    md: { height: '44px', fontSize: '14px', iconSize: 20, padding: '0 16px' },
    lg: { height: '52px', fontSize: '16px', iconSize: 24, padding: '0 20px' },
  };

  const s = sizes[size];
  const isDark = theme === 'dark';

  const btnStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: showLabel ? '12px' : '0',
    height: s.height,
    fontSize: s.fontSize,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: 500,
    padding: s.padding,
    borderRadius: '8px',
    border: isDark ? 'none' : `1px solid ${GOOGLE_COLORS.border}`,
    backgroundColor: isDark ? GOOGLE_COLORS.bgDark : GOOGLE_COLORS.bgWhite,
    color: isDark ? GOOGLE_COLORS.textLight : GOOGLE_COLORS.textDark,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all 0.15s ease',
    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
    whiteSpace: 'nowrap',
    ...style,
  };

  return (
    <button
      type="button"
      style={btnStyle}
      className={className}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label="Sign in with Google"
    >
      {icon || <GoogleIcon size={s.iconSize} />}
      {showLabel && <span>{label || 'Continue with Google'}</span>}
    </button>
  );
}

// ─── Google Callback Handler ────────────────────────────────────────────

export interface GoogleCallbackHandlerProps {
  /** Google OAuth2 client ID. */
  clientId: string;
  /** OAuth2 client secret. */
  clientSecret?: string;
  /** Called on successful callback. */
  onSuccess?: (tokens: { accessToken: string; idToken?: string; refreshToken?: string; expiresIn: number }) => void;
  /** Called on error. */
  onError?: (error: Error) => void;
  /** Custom redirect URI. */
  redirectUri?: string;
  /** Whether to automatically process callbacks. */
  autoProcess?: boolean;
}

/**
 * Google OAuth callback handler component.
 *
 * Place this on your callback route to automatically process
 * the OAuth2 code and exchange it for tokens.
 */
export function GoogleCallbackHandler({
  clientId,
  clientSecret,
  onSuccess,
  onError,
  redirectUri,
  autoProcess = true,
}: GoogleCallbackHandlerProps) {
  const [processing, setProcessing] = useState(false);
  const processed = useRef(false);

  const handleCallback = useCallback(async () => {
    if (processed.current) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      onError?.(new Error(`OAuth error: ${error}`));
      return;
    }

    if (!code) return;

    processed.current = true;
    setProcessing(true);

    try {
      const provider = new GoogleOAuthProvider();
      provider.init(clientId, redirectUri || window.location.origin + window.location.pathname);

      const tokens = await provider.handleCallback(code, clientSecret);

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);

      onSuccess?.(tokens);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setProcessing(false);
    }
  }, [clientId, clientSecret, redirectUri, onSuccess, onError]);

  if (autoProcess && typeof window !== 'undefined' && !processed.current) {
    void handleCallback();
  }

  if (!processing) return null;

  return (
    <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280', fontFamily: 'system-ui' }}>
      Processing Google login...
    </div>
  );
}
