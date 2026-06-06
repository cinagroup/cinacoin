import { useState } from 'react';
import { Brand } from './Brand';

export interface NavLink {
  label: string;
  href: string;
}

export interface SiteHeaderProps {
  logoSrc?: string;
  brandHref?: string;
  /** Optional muted sub-label after the wordmark (e.g. "Cloud", "Status"). */
  sublabel?: string;
  /** Center nav links. */
  links?: NavLink[];
  /** Primary CTA on the right (rendered as an ink pill). */
  cta?: NavLink;
  /** Secondary text link on the right (e.g. "Log in"). */
  secondaryCta?: NavLink;
  /** Current theme + toggle callback. If omitted, no toggle is shown. */
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  /** Extra node rendered just left of the CTA (e.g. a language selector). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rightSlot?: any;
}

/**
 * Shared sticky site header. Pure props in — no app-specific providers — so it
 * works in every Cinacoin app (Next or Vite). Uses the .cc-navbar primitives
 * from @cinacoin/design-tokens.
 */
export function SiteHeader({
  logoSrc,
  brandHref,
  sublabel,
  links = [],
  cta,
  secondaryCta,
  theme,
  onToggleTheme,
  rightSlot,
}: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="cc-navbar" aria-label="Site header">
      <div
        className="cc-container"
        style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Brand logoSrc={logoSrc} href={brandHref} sublabel={sublabel} />

        {/* Desktop links */}
        <nav
          aria-label="Primary"
          style={{ display: 'none', alignItems: 'center', gap: 4 }}
          className="cc-nav-desktop"
        >
          {links.map((l) => (
            <a key={l.href + l.label} href={l.href} className="cc-navbar-link">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {rightSlot}

          {onToggleTheme ? (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: 32, width: 32, borderRadius: 8, border: 'none',
                background: 'transparent', color: 'var(--cc-body)', cursor: 'pointer',
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
          ) : null}

          {secondaryCta ? (
            <a href={secondaryCta.href} className="cc-navbar-link cc-nav-desktop" style={{ display: 'none' }}>
              {secondaryCta.label}
            </a>
          ) : null}

          {cta ? (
            <a href={cta.href} className="cc-nav-desktop" style={{ display: 'none', marginLeft: 4 }}>
              <span className="cc-btn-primary-sm">{cta.label}</span>
            </a>
          ) : null}

          {/* Mobile toggle */}
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="cc-nav-mobile-btn"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: 36, width: 36, borderRadius: 8, border: 'none',
              background: 'transparent', color: 'var(--cc-body)', cursor: 'pointer',
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
      {mobileOpen ? (
        <div
          role="dialog"
          aria-label="Mobile navigation"
          style={{
            borderTop: '1px solid var(--cc-hairline)',
            background: 'var(--cc-canvas)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '16px 24px' }}>
            {links.map((l) => (
              <a
                key={'m' + l.href + l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="cc-navbar-link"
                style={{ padding: '8px 12px' }}
              >
                {l.label}
              </a>
            ))}
            {secondaryCta ? (
              <a href={secondaryCta.href} className="cc-navbar-link" style={{ padding: '8px 12px' }}>
                {secondaryCta.label}
              </a>
            ) : null}
            {cta ? (
              <a href={cta.href} style={{ marginTop: 8 }}>
                <span className="cc-btn-primary-sm" style={{ width: '100%', height: 40 }}>
                  {cta.label}
                </span>
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Show desktop nav at >=768px, hide the mobile button. Scoped to this header. */}
      <style>{`
        @media (min-width: 768px) {
          .cc-navbar .cc-nav-desktop { display: inline-flex !important; }
          .cc-navbar .cc-nav-mobile-btn { display: none !important; }
        }
      `}</style>
    </header>
  );
}
