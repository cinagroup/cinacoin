import * as React from 'react';
import { Brand } from './Brand';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

export interface SiteFooterProps {
  logoSrc?: string;
  columns?: FooterColumn[];
  /** Tagline under the brand. */
  tagline?: string;
  /** Copyright line. Defaults to the current year. */
  copyright?: string;
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    heading: 'Products',
    links: [
      { label: 'Connect SDK', href: 'https://cinacoin.com/products/connect' },
      { label: 'Swaps', href: 'https://cinacoin.com/products/swaps' },
      { label: 'Infrastructure', href: 'https://cinacoin.com/products/infrastructure' },
      { label: 'Wallet Explorer', href: 'https://wallet.cinacoin.com' },
    ],
  },
  {
    heading: 'Developers',
    links: [
      { label: 'Docs', href: 'https://docs.cinacoin.com' },
      { label: 'Demo', href: 'https://demo.cinacoin.com' },
      { label: 'Changelog', href: 'https://cinacoin.com/changelog' },
      { label: 'Status', href: 'https://status.cinacoin.com' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: 'https://cinacoin.com/about' },
      { label: 'Pricing', href: 'https://cinacoin.com/pricing' },
      { label: 'Contact', href: 'https://cinacoin.com/contact' },
      { label: 'GitHub', href: 'https://github.com/cinagroup' },
    ],
  },
];

/**
 * Shared multi-column site footer with mono uppercase headings and the brand
 * lockup. Pure props in. Uses .cc-footer primitives from @cinacoin/design-tokens.
 */
export function SiteFooter({
  logoSrc,
  columns = DEFAULT_COLUMNS,
  tagline = 'Onchain access, simplified.',
  copyright,
}: SiteFooterProps) {
  const year = new Date().getFullYear();
  return (
    <footer className="cc-footer">
      <div
        className="cc-container"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 48, justifyContent: 'space-between' }}
      >
        <div style={{ maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Brand logoSrc={logoSrc} />
          <p className="cc-body-sm" style={{ color: 'var(--cc-muted)' }}>{tagline}</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48 }}>
          {columns.map((col) => (
            <div key={col.heading} style={{ minWidth: 120 }}>
              <p className="cc-footer-heading">{col.heading}</p>
              {col.links.map((l) => (
                <a key={l.href + l.label} href={l.href} className="cc-footer-link">
                  {l.label}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div
        className="cc-container"
        style={{
          marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--cc-hairline)',
        }}
      >
        <p className="cc-caption" style={{ color: 'var(--cc-muted)' }}>
          {copyright || `© ${year} Cinacoin. All rights reserved.`}
        </p>
      </div>
    </footer>
  );
}
