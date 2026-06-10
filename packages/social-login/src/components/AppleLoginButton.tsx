/**
 * Apple Login Button React component.
 *
 * A standalone, styled "Sign in with Apple" button that
 * integrates with the AppleOAuthProvider for OAuth2 flows.
 *
 * @example
 * ```tsx
 * <AppleLoginButton
 *   clientId="com.example.app"
 *   redirectUri="https://example.com/auth/apple/callback"
 *   teamId="YOUR_TEAM_ID"
 *   keyId="YOUR_KEY_ID"
 *   privateKey={process.env.APPLE_PRIVATE_KEY}
 *   onSuccess={(result) => console.log(result)}
 * />
 * ```
 */

import { useState, useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import { AppleOAuthProvider } from '../providers/apple.js';
import type { OAuth2UserProfile } from '../types.js';

// ─── Apple Brand Colors ─────────────────────────────────────────────────

const APPLE_COLORS = {
  bgBlack: '#000000',
  bgWhite: '#ffffff',
  textWhite: '#ffffff',
  textDark: '#1d1d1f',
  border: '#d2d2d7',
  bgHover: '#333333',
};

// ─── Apple SVG Icon ─────────────────────────────────────────────────────

function AppleIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color || 'currentColor'} style={{ flexShrink: 0 }}>
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

// ─── Types ──────────────────────────────────────────────────────────────

export interface AppleLoginButtonProps {
  /** Apple Services ID (e.g., com.example.app). */
  clientId: string;
  /** OAuth2 redirect URI. */
  redirectUri: string;
  /** Apple Team ID (required for server-side flows). */
  teamId?: string;
  /** Apple Key ID for JWT signing (required for server-side flows). */
  keyId?: string;
  /** Apple private key content in PKCS#8 format (required for server-side flows). */
  privateKey?: string;
  /** Override OAuth scopes. */
  scopes?: string[];
  /** Custom button label text. */
  label?: string;
  /** Custom icon (overrides Apple icon). */
  icon?: ReactNode;
  /** Custom CSS styles. */
  style?: CSSProperties;
  /** Additional CSS class name. */
  className?: string;
  /** Called on successful login. */
  onSuccess?: (result: { idToken: string; accessToken?: string; expiresIn: number; profile?: OAuth2UserProfile }) => void;
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
 * Apple Login Button component.
 *
 * Handles the full Sign in with Apple flow when clicked, either via
 * full-page redirect or popup window.
 */
export function AppleLoginButton({
  clientId,
  redirectUri,
  teamId,
  keyId,
  privateKey,
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
  theme = 'dark',
  showLabel = true,
  redirect = true,
}: AppleLoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const popupRef = useRef<Window | null>(null);

  const handleClick = useCallback(() => {
    if (disabled || loading) return;

    onStart?.();
    setLoading(true);

    const provider = new AppleOAuthProvider();
    provider.init(clientId, redirectUri, {
      teamId,
      keyId,
      privateKey,
      scopes,
    });

    if (redirect) {
      // Full-page redirect
      provider.authorize();
    } else {
      // Popup window (Apple requires form_post, so we need a different approach)
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authUrl = provider.authorize();
      popupRef.current = window.open(
        authUrl,
        'apple-oauth',
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
            .handleCallback(event.data.code, { teamId, keyId, privateKey })
            .then((tokens) => {
              const profile = provider.getUserInfo(tokens.idToken);
              onSuccess?.({ ...tokens, profile });
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
  }, [clientId, redirectUri, teamId, keyId, privateKey, scopes, disabled, loading, redirect, onSuccess, onError, onStart]);

  const sizes = {
    sm: { height: '36px', fontSize: 'var(--text-body-sm)', iconSize: 16, padding: '0 12px' },
    md: { height: '44px', fontSize: 'var(--text-body-sm)', iconSize: 20, padding: '0 16px' },
    lg: { height: '52px', fontSize: 'var(--text-body-md)', iconSize: 24, padding: '0 20px' },
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
    fontWeight: "var(--weight-medium)",
    padding: s.padding,
    borderRadius: '8px',
    border: isDark ? 'none' : `1px solid ${APPLE_COLORS.border}`,
    backgroundColor: isDark ? APPLE_COLORS.bgBlack : APPLE_COLORS.bgWhite,
    color: isDark ? APPLE_COLORS.textWhite : APPLE_COLORS.textDark,
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
      aria-label="Sign in with Apple"
    >
      {icon || <AppleIcon size={s.iconSize} color={isDark ? APPLE_COLORS.textWhite : APPLE_COLORS.textDark} />}
      {showLabel && <span>{label || 'Continue with Apple'}</span>}
    </button>
  );
}

// ─── Apple Callback Handler ─────────────────────────────────────────────

export interface AppleCallbackHandlerProps {
  /** Apple Services ID. */
  clientId: string;
  /** Apple Team ID. */
  teamId?: string;
  /** Apple Key ID. */
  keyId?: string;
  /** Apple private key (PKCS#8). */
  privateKey?: string;
  /** Called on successful callback. */
  onSuccess?: (result: { idToken: string; accessToken?: string; expiresIn: number; profile?: OAuth2UserProfile }) => void;
  /** Called on error. */
  onError?: (error: Error) => void;
  /** Custom redirect URI. */
  redirectUri?: string;
  /** Whether to automatically process callbacks. */
  autoProcess?: boolean;
}

/**
 * Apple OAuth callback handler component.
 *
 * Place this on your callback route to automatically process
 * the OAuth2 code and exchange it for tokens.
 *
 * Note: Apple uses form_post response mode, so the callback receives
 * data via POST. For client-side handling, the server should forward
 * the code to this component.
 */
export function AppleCallbackHandler({
  clientId,
  teamId,
  keyId,
  privateKey,
  onSuccess,
  onError,
  redirectUri,
  autoProcess = true,
}: AppleCallbackHandlerProps) {
  const [processing, setProcessing] = useState(false);
  const processed = useRef(false);

  const handleCallback = useCallback(async () => {
    if (processed.current) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      onError?.(new Error(`Apple OAuth error: ${error}`));
      return;
    }

    if (!code) return;

    processed.current = true;
    setProcessing(true);

    try {
      const provider = new AppleOAuthProvider();
      provider.init(clientId, redirectUri || window.location.origin + window.location.pathname, {
        teamId,
        keyId,
        privateKey,
      });

      const tokens = await provider.handleCallback(code, { teamId, keyId, privateKey });
      const profile = provider.getUserInfo(tokens.idToken);

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);

      onSuccess?.({ ...tokens, profile });
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setProcessing(false);
    }
  }, [clientId, teamId, keyId, privateKey, redirectUri, onSuccess, onError]);

  if (autoProcess && typeof window !== 'undefined' && !processed.current) {
    void handleCallback();
  }

  if (!processing) return null;

  return (
    <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280', fontFamily: 'system-ui' }}>
      Processing Apple login...
    </div>
  );
}
