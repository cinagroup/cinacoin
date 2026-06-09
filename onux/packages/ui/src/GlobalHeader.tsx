import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from 'react';
import { Brand } from './Brand';

// ─── Auth Context ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ─── Permission-aware Navigation ──────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  /** Required permission to view this item. */
  permission?: string;
  /** Show only when authenticated. */
  requireAuth?: boolean;
  /** Show only when NOT authenticated. */
  requireGuest?: boolean;
}

export interface GlobalHeaderProps {
  /** Navigation items (filtered by permissions). */
  navItems?: NavItem[];
  /** User permissions (for filtering nav items). */
  permissions?: string[];
  /** Primary CTA button. */
  cta?: { label: string; href: string };
  /** Secondary CTA button. */
  secondaryCta?: { label: string; href: string };
  /** Current theme. */
  theme?: 'light' | 'dark';
  /** Theme toggle callback. */
  onToggleTheme?: () => void;
  /** Custom logo src. */
  logoSrc?: string;
  /** Brand href. */
  brandHref?: string;
  /** Auth context (optional — uses default if not provided). */
  auth?: AuthContextValue;
  /** Extra slot before CTA. */
  rightSlot?: ReactNode;
  className?: string;
}

/**
 * Cinacoin GlobalHeader — permission-aware navigation with user profile dropdown.
 *
 * Features:
 * - Filters nav items based on user permissions and auth state
 * - User profile dropdown with avatar, name, and actions
 * - Theme toggle
 * - Mobile-responsive with hamburger menu
 */
export function GlobalHeader({
  navItems = [],
  permissions = [],
  cta,
  secondaryCta,
  theme,
  onToggleTheme,
  logoSrc,
  brandHref,
  auth,
  rightSlot,
  className = '',
}: GlobalHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Use provided auth or default context
  const authContext = auth || useAuth();
  const { user, isAuthenticated, login, logout } = authContext;

  // Close dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  // Filter nav items based on permissions and auth state
  const visibleItems = navItems.filter((item) => {
    // Check auth requirements
    if (item.requireAuth && !isAuthenticated) return false;
    if (item.requireGuest && isAuthenticated) return false;
    // Check permission
    if (item.permission && !permissions.includes(item.permission)) return false;
    return true;
  });

  const containerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'var(--cc-canvas)',
    borderBottom: '1px solid var(--cc-hairline)',
    height: '64px',
  };

  const innerStyle: React.CSSProperties = {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const linkStyle: React.CSSProperties = {
    color: 'var(--cc-body)',
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '20px',
    padding: '8px 12px',
    borderRadius: 'var(--cc-radius-sm)',
    textDecoration: 'none',
    transition: 'color 0.15s ease',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const profileButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 8px',
    borderRadius: 'var(--cc-radius-sm)',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  };

  const avatarStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    minWidth: '200px',
    background: 'var(--cc-canvas)',
    border: '1px solid var(--cc-hairline)',
    borderRadius: 'var(--cc-radius-md)',
    boxShadow: 'var(--cc-level3)',
    padding: '8px',
    zIndex: 10,
  };

  const dropdownItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: 'var(--cc-radius-sm)',
    color: 'var(--cc-body)',
    fontSize: '14px',
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    width: '100%',
    textAlign: 'left',
    transition: 'background 0.15s ease',
  };

  return (
    <header className={className} style={containerStyle} aria-label="Global header">
      <div style={innerStyle}>
        {/* Brand */}
        <Brand logoSrc={logoSrc} href={brandHref} />

        {/* Desktop Navigation */}
        <nav style={navStyle} className="cc-nav-desktop" aria-label="Primary">
          {visibleItems.map((item) => (
            <a key={item.href + item.label} href={item.href} style={linkStyle} className="cc-navbar-link">
              {item.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div style={actionsStyle}>
          {rightSlot}

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '32px',
                width: '32px',
                borderRadius: 'var(--cc-radius-sm)',
                border: 'none',
                background: 'transparent',
                color: 'var(--cc-body)',
                cursor: 'pointer',
              }}
            >
              {theme === 'dark' ? (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>
          )}

          {/* User Profile / Auth Buttons */}
          {isAuthenticated && user ? (
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                style={profileButtonStyle}
                aria-haspopup="true"
                aria-expanded={profileOpen}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} style={avatarStyle} />
                ) : (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--cc-primary)',
                      color: 'var(--cc-on-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--cc-ink)' }} className="cc-nav-desktop">
                  {user.name}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileOpen && (
                <div style={dropdownStyle} role="menu">
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--cc-hairline)', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--cc-ink)' }}>{user.name}</div>
                    {user.email && (
                      <div style={{ fontSize: '12px', color: 'var(--cc-muted)', marginTop: '2px' }}>{user.email}</div>
                    )}
                  </div>
                  <button style={dropdownItemStyle} role="menuitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Profile
                  </button>
                  <button style={dropdownItemStyle} role="menuitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                    </svg>
                    Settings
                  </button>
                  <div style={{ borderTop: '1px solid var(--cc-hairline)', marginTop: '8px', paddingTop: '8px' }}>
                    <button
                      style={{ ...dropdownItemStyle, color: 'var(--cc-error)' }}
                      role="menuitem"
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {secondaryCta && (
                <a href={secondaryCta.href} className="cc-nav-cta-login" style={{ textDecoration: 'none' }}>
                  {secondaryCta.label}
                </a>
              )}
              {cta && (
                <a href={cta.href} className="cc-nav-cta-signup" style={{ textDecoration: 'none' }}>
                  {cta.label}
                </a>
              )}
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="cc-nav-mobile-btn"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              height: '36px',
              width: '36px',
              borderRadius: 'var(--cc-radius-sm)',
              border: 'none',
              background: 'transparent',
              color: 'var(--cc-body)',
              cursor: 'pointer',
            }}
          >
            {mobileOpen ? (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-label="Mobile navigation"
          style={{
            borderTop: '1px solid var(--cc-hairline)',
            background: 'var(--cc-canvas)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 24px' }}>
            {visibleItems.map((item) => (
              <a
                key={'m' + item.href + item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="cc-navbar-link"
                style={{ padding: '8px 12px' }}
              >
                {item.label}
              </a>
            ))}
            {!isAuthenticated && (
              <>
                {secondaryCta && (
                  <a href={secondaryCta.href} className="cc-navbar-link" style={{ padding: '8px 12px' }}>
                    {secondaryCta.label}
                  </a>
                )}
                {cta && (
                  <a href={cta.href} style={{ marginTop: '8px' }}>
                    <span className="cc-btn-primary-sm" style={{ width: '100%', height: '40px' }}>
                      {cta.label}
                    </span>
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .cc-nav-desktop { display: inline-flex !important; }
          .cc-nav-mobile-btn { display: none !important; }
        }
        @media (max-width: 767px) {
          .cc-nav-desktop { display: none !important; }
          .cc-nav-mobile-btn { display: inline-flex !important; }
        }
      `}</style>
    </header>
  );
}
