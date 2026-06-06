export interface BrandProps {
  /** Logo image src. Defaults to /logo.png (each app serves its own copy). */
  logoSrc?: string;
  /** Where the brand lockup links to. Defaults to the marketing site. */
  href?: string;
  /** Optional sub-label rendered after the wordmark, e.g. "Cloud", "Status". */
  sublabel?: string;
  /** Logo size in px (square). Default 28. */
  size?: number;
  /** Render an <a> (default) or just the inline lockup (set as="span"). */
  as?: 'a' | 'span';
  className?: string;
}

/**
 * Canonical Cinacoin brand lockup: square logo + "Cinacoin" ink wordmark,
 * with an optional muted sub-label. Used in every app's header/footer.
 */
export function Brand({
  logoSrc = '/logo.png',
  href = 'https://cinacoin.com',
  sublabel,
  size = 28,
  as = 'a',
  className = '',
}: BrandProps) {
  const inner = (
    <>
      <img
        src={logoSrc}
        alt="Cinacoin logo"
        width={size}
        height={size}
        style={{ height: size, width: size, borderRadius: 8, flexShrink: 0 }}
      />
      <span
        style={{
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: '-0.3px',
          color: 'var(--cc-ink)',
          whiteSpace: 'nowrap',
        }}
      >
        Cinacoin
        {sublabel ? (
          <span style={{ color: 'var(--cc-muted)', fontWeight: 400 }}> {sublabel}</span>
        ) : null}
      </span>
    </>
  );

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
  } as const;

  if (as === 'span') {
    return (
      <span className={className} style={style}>
        {inner}
      </span>
    );
  }
  return (
    <a className={className} style={style} href={href} aria-label="Cinacoin home">
      {inner}
    </a>
  );
}
