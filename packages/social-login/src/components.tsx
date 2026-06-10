/**
 * React components for social login.
 *
 * Provides styled SocialLoginButton and SocialLoginModal components
 * that handle OAuth flows with PKCE for multiple providers.
 *
 * @packageDocumentation
 */

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  createContext,
  useContext,
  type ReactNode,
  type CSSProperties,
} from 'react';

// ─── Types ──────────────────────────────────────────────────────────────

export type SocialProvider = 'google' | 'apple' | 'twitter' | 'github' | 'discord' | 'email' | 'phone';

export interface SocialLoginConfig {
  /** Base URL for the auth API. */
  apiBaseUrl: string;
  /** OAuth provider configurations. */
  providers: Partial<Record<SocialProvider, { clientId: string; clientSecret?: string }>>;
  /** Redirect URI after OAuth callback. */
  redirectUri: string;
  /** JWT secret for session management (client-side storage). */
  sessionSecret?: string;
}

export interface SocialLoginState {
  /** Currently authenticated provider. */
  provider: SocialProvider | null;
  /** User's email (if available). */
  email: string | null;
  /** User's display name. */
  displayName: string | null;
  /** Derived wallet address. */
  walletAddress: string | null;
  /** JWT session token. */
  token: string | null;
  /** Whether login is in progress. */
  loading: boolean;
  /** Error message (if any). */
  error: string | null;
}

export interface SocialLoginContextValue extends SocialLoginState {
  /** Start login flow for a provider. */
  loginWith: (provider: SocialProvider) => Promise<void>;
  /** Handle the OAuth callback (called on redirect back). */
  handleCallback: () => Promise<void>;
  /** Logout and clear session. */
  logout: () => void;
}

// ─── Context ────────────────────────────────────────────────────────────

const SocialLoginContext = createContext<SocialLoginContextValue | null>(null);

/**
 * Access the social login context.
 *
 * Must be used within a `<SocialLoginProvider>`.
 */
export function useSocialLogin(): SocialLoginContextValue {
  const ctx = useContext(SocialLoginContext);
  if (!ctx) {
    throw new Error('useSocialLogin must be used within a SocialLoginProvider');
  }
  return ctx;
}

// ─── PKCE Helpers ───────────────────────────────────────────────────────

function generateRandomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function sha256(input: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
}

function base64URLEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = base64URLEncode(await sha256(codeVerifier));
  return { codeVerifier, codeChallenge };
}

// ─── Provider Authorization URLs ────────────────────────────────────────

function buildGoogleAuthUrl(config: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
}): string {
  const query = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: config.state,
    code_challenge: config.codeChallenge,
    code_challenge_method: 'S256',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${query.toString()}`;
}

function buildAppleAuthUrl(config: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const query = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code id_token',
    response_mode: 'fragment',
    scope: 'openid email name',
    state: config.state,
  });
  return `https://appleid.apple.com/auth/authorize?${query.toString()}`;
}

function buildTwitterAuthUrl(config: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
}): string {
  const query = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'users.read tweet.read email',
    state: config.state,
    code_challenge: config.codeChallenge,
    code_challenge_method: 'S256',
  });
  return `https://twitter.com/i/oauth2/authorize?${query.toString()}`;
}

function buildGitHubAuthUrl(config: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const query = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'read:user user:email',
    state: config.state,
  });
  return `https://github.com/login/oauth/authorize?${query.toString()}`;
}

function buildDiscordAuthUrl(config: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
}): string {
  const query = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'identify email',
    state: config.state,
    code_challenge: config.codeChallenge,
    code_challenge_method: 'S256',
  });
  return `https://discord.com/api/oauth2/authorize?${query.toString()}`;
}

// ─── SocialLoginProvider ────────────────────────────────────────────────

export interface SocialLoginProviderProps {
  children: ReactNode;
  config: SocialLoginConfig;
}

const STORAGE_KEY_STATE = '@cinacoin/oauth:state';
const STORAGE_KEY_VERIFIER = '@cinacoin/oauth:verifier';
const STORAGE_KEY_SESSION = '@cinacoin/session';

export function SocialLoginProvider({ children, config }: SocialLoginProviderProps) {
  const [state, setState] = useState<SocialLoginState>({
    provider: null,
    email: null,
    displayName: null,
    walletAddress: null,
    token: null,
    loading: false,
    error: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SESSION);
      if (raw) {
        const session = JSON.parse(raw) as SocialLoginState;
        if (session.token) {
          setState((prev) => ({ ...prev, ...session }));
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const saveSession = useCallback((partial: Partial<SocialLoginState>) => {
    setState((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify({
          provider: next.provider,
          email: next.email,
          displayName: next.displayName,
          walletAddress: next.walletAddress,
          token: next.token,
        }));
      } catch {
        // Storage full or unavailable
      }
      return next;
    });
  }, []);

  const loginWith = useCallback(
    async (provider: SocialProvider) => {
      const providerConfig = config.providers[provider];
      if (!providerConfig?.clientId) {
        setState((prev) => ({
          ...prev,
          error: `Provider "${provider}" is not configured`,
        }));
        return;
      }

      const stateParam = generateRandomString(32);
      let url: string;

      if (provider === 'google') {
        const pkce = await generatePKCE();
        localStorage.setItem(STORAGE_KEY_STATE, stateParam);
        localStorage.setItem(STORAGE_KEY_VERIFIER, pkce.codeVerifier);
        url = buildGoogleAuthUrl({
          clientId: providerConfig.clientId,
          redirectUri: config.redirectUri,
          codeChallenge: pkce.codeChallenge,
          state: stateParam,
        });
      } else if (provider === 'apple') {
        localStorage.setItem(STORAGE_KEY_STATE, stateParam);
        url = buildAppleAuthUrl({
          clientId: providerConfig.clientId,
          redirectUri: config.redirectUri,
          state: stateParam,
        });
      } else if (provider === 'twitter') {
        const pkce = await generatePKCE();
        localStorage.setItem(STORAGE_KEY_STATE, stateParam);
        localStorage.setItem(STORAGE_KEY_VERIFIER, pkce.codeVerifier);
        url = buildTwitterAuthUrl({
          clientId: providerConfig.clientId,
          redirectUri: config.redirectUri,
          codeChallenge: pkce.codeChallenge,
          state: stateParam,
        });
      } else if (provider === 'github') {
        localStorage.setItem(STORAGE_KEY_STATE, stateParam);
        url = buildGitHubAuthUrl({
          clientId: providerConfig.clientId,
          redirectUri: config.redirectUri,
          state: stateParam,
        });
      } else if (provider === 'discord') {
        const pkce = await generatePKCE();
        localStorage.setItem(STORAGE_KEY_STATE, stateParam);
        localStorage.setItem(STORAGE_KEY_VERIFIER, pkce.codeVerifier);
        url = buildDiscordAuthUrl({
          clientId: providerConfig.clientId,
          redirectUri: config.redirectUri,
          codeChallenge: pkce.codeChallenge,
          state: stateParam,
        });
      } else {
        setState((prev) => ({
          ...prev,
          error: `Provider "${provider}" requires a different flow (email/phone)`,
        }));
        return;
      }

      // Redirect to OAuth provider
      window.location.href = url;
    },
    [config]
  );

  const handleCallback = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));

    const code = params.get('code');
    const returnedState = params.get('state') || hashParams.get('state');
    const error = params.get('error');

    // Apple returns tokens in hash fragment
    const idToken = hashParams.get('id_token');
    const accessToken = hashParams.get('access_token');

    if (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: `OAuth error: ${error}`,
      }));
      return;
    }

    if (!code && !idToken) {
      // Not a callback — nothing to do
      return;
    }

    // Verify state
    const savedState = localStorage.getItem(STORAGE_KEY_STATE);
    if (savedState && returnedState !== savedState) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'OAuth state mismatch — possible CSRF attack',
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Call backend to exchange code for tokens
      const verifier = localStorage.getItem(STORAGE_KEY_VERIFIER);

      const response = await fetch(`${config.apiBaseUrl}/api/auth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code || undefined,
          idToken: idToken || undefined,
          accessToken: accessToken || undefined,
          state: returnedState,
          codeVerifier: verifier || undefined,
          redirectUri: config.redirectUri,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'Callback failed');
      }

      const data = await response.json() as {
        provider: SocialProvider;
        email?: string;
        displayName?: string;
        walletAddress: string;
        token: string;
        expiresAt: number;
      };

      saveSession({
        provider: data.provider,
        email: data.email || null,
        displayName: data.displayName || null,
        walletAddress: data.walletAddress,
        token: data.token,
        loading: false,
        error: null,
      });

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Callback failed',
      }));
    } finally {
      localStorage.removeItem(STORAGE_KEY_STATE);
      localStorage.removeItem(STORAGE_KEY_VERIFIER);
    }
  }, [config.apiBaseUrl, config.redirectUri, saveSession]);

  // Auto-handle callback on mount if code is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('code') || window.location.hash.includes('id_token')) {
      void handleCallback();
    }
  }, [handleCallback]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_SESSION);
    setState({
      provider: null,
      email: null,
      displayName: null,
      walletAddress: null,
      token: null,
      loading: false,
      error: null,
    });
  }, []);

  return (
    <SocialLoginContext.Provider
      value={{
        ...state,
        loginWith,
        handleCallback,
        logout,
      }}
    >
      {children}
    </SocialLoginContext.Provider>
  );
}

// ─── Provider Button Config ─────────────────────────────────────────────

const PROVIDER_CONFIG: Record<SocialProvider, {
  label: string;
  icon: string;
  bgColor: string;
  textColor: string;
}> = {
  google: {
    label: 'Continue with Google',
    icon: `<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`,
    bgColor: '#ffffff',
    textColor: '#3c4043',
  },
  apple: {
    label: 'Continue with Apple',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>`,
    bgColor: '#000000',
    textColor: '#ffffff',
  },
  twitter: {
    label: 'Continue with X',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    bgColor: '#000000',
    textColor: '#ffffff',
  },
  github: {
    label: 'Continue with GitHub',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`,
    bgColor: '#24292e',
    textColor: '#ffffff',
  },
  discord: {
    label: 'Continue with Discord',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/></svg>`,
    bgColor: '#5865F2',
    textColor: '#ffffff',
  },
  email: {
    label: 'Continue with Email',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    bgColor: '#ffffff',
    textColor: '#3c4043',
  },
  phone: {
    label: 'Continue with Phone',
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>`,
    bgColor: '#ffffff',
    textColor: '#3c4043',
  },
};

// ─── SocialLoginButton ──────────────────────────────────────────────────

export interface SocialLoginButtonProps {
  /** Provider to use. */
  provider: SocialProvider;
  /** Override the button label. */
  label?: string;
  /** Override the button icon (SVG string or ReactNode). */
  icon?: ReactNode;
  /** Custom CSS styles. */
  style?: CSSProperties;
  /** Additional CSS class. */
  className?: string;
  /** Called before navigation to provider. */
  onClick?: () => void;
  /** Whether the button is disabled. */
  disabled?: boolean;
  /** Button size. */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * A styled social login button for a specific provider.
 *
 * @example
 * ```tsx
 * <SocialLoginButton
 *   provider="google"
 *   onClick={() => console.log('Starting Google login...')}
 * />
 * ```
 */
export function SocialLoginButton({
  provider,
  label: customLabel,
  icon: customIcon,
  style,
  className,
  onClick,
  disabled,
  size = 'md',
}: SocialLoginButtonProps) {
  const { loginWith, loading, error } = useSocialLogin();
  const config = PROVIDER_CONFIG[provider];

  const handleClick = async () => {
    onClick?.();
    try {
      await loginWith(provider);
    } catch {
      // Error is handled by the context
    }
  };

  const sizes = {
    sm: { height: '36px', fontSize: '13px', iconSize: '16px' },
    md: { height: '44px', fontSize: '15px', iconSize: '18px' },
    lg: { height: '52px', fontSize: '16px', iconSize: '20px' },
  };

  const btnStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '100%',
    height: sizes[size].height,
    fontSize: sizes[size].fontSize,
    fontWeight: 500,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    border: provider === 'email' || provider === 'phone' || provider === 'google'
      ? '1px solid #dadce0'
      : 'none',
    borderRadius: '8px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all 0.15s ease',
    backgroundColor: config.bgColor,
    color: config.textColor,
    ...style,
  };

  return (
    <button
      style={btnStyle}
      className={className}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={`${config.label} login`}
    >
      {customIcon ? (
        <span style={{ width: sizes[size].iconSize, height: sizes[size].iconSize, display: 'flex' }}>
          {customIcon}
        </span>
      ) : (
        <span
          style={{ width: sizes[size].iconSize, height: sizes[size].iconSize, display: 'flex' }}
          dangerouslySetInnerHTML={{ __html: config.icon }}
        />
      )}
      {customLabel || config.label}
    </button>
  );
}

// ─── SocialLoginModal ───────────────────────────────────────────────────

export interface SocialLoginModalProps {
  /** Whether the modal is visible. */
  isOpen: boolean;
  /** Called when the user closes the modal. */
  onClose: () => void;
  /** Providers to show (default: all). */
  providers?: SocialProvider[];
  /** Custom modal title. */
  title?: string;
  /** Custom modal styles. */
  style?: CSSProperties;
  /** Custom overlay styles. */
  overlayStyle?: CSSProperties;
}

/**
 * A modal dialog with social login buttons.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <SocialLoginModal
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   providers={['google', 'apple', 'github', 'discord']}
 * />
 * ```
 */
export function SocialLoginModal({
  isOpen,
  onClose,
  providers = ['google', 'apple', 'twitter', 'github', 'discord', 'email', 'phone'],
  title = 'Sign in to Cinacoin',
  style,
  overlayStyle,
}: SocialLoginModalProps) {
  const { error, loading, email: userEmail, walletAddress } = useSocialLogin();

  const modalContainerStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    display: isOpen ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    ...overlayStyle,
  };

  const modalStyle: CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '420px',
    maxHeight: '90vh',
    overflow: 'auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    ...style,
  };

  const dividerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    margin: '20px 0',
    color: '#6b7280',
    fontSize: '13px',
  };

  const dividerLineStyle: CSSProperties = {
    flex: 1,
    height: '1px',
    backgroundColor: '#e5e7eb',
  };

  if (!isOpen) return null;

  return (
    <div style={modalContainerStyle} onClick={onClose}>
      <div
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#111827' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '12px', color: '#6b7280', fontSize: '12px' }}>
            Redirecting to provider...
          </div>
        )}

        {/* Social provider buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {providers.map((provider) => (
            <SocialLoginButton
              key={provider}
              provider={provider}
              size="md"
            />
          ))}
        </div>

        {/* Divider */}
        <div style={dividerStyle}>
          <div style={dividerLineStyle} />
          <span>or</span>
          <div style={dividerLineStyle} />
        </div>

        {/* Footer */}
        <p style={{
          margin: '0 0 16px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#9ca3af',
          lineHeight: 1.5,
        }}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
          Your wallet will be derived from your social identity.
        </p>

        {/* Session info (debug) */}
        {userEmail && (
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#f0fdf4',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#16a34a',
          }}>
            Signed in as {userEmail}
            {walletAddress && ` · ${walletAddress.slice(0, 8)}…`}
          </div>
        )}
      </div>
    </div>
  );
}
