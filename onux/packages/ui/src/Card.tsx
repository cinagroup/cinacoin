import { type ReactNode, type HTMLAttributes } from 'react';

export type CardVariant = 'default' | 'soft' | 'featured' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual style variant. */
  variant?: CardVariant;
  /** Optional header content (title, actions). */
  header?: ReactNode;
  /** Optional footer content. */
  footer?: ReactNode;
  /** Remove padding. */
  noPadding?: boolean;
  children?: ReactNode;
  className?: string;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'cc-card',
  soft: 'cc-card-soft',
  featured: 'cc-card-featured',
  lg: 'cc-card-lg',
};

/**
 * Cinacoin Card — wraps design-token primitives with header/footer slots.
 */
export function Card({
  variant = 'default',
  header,
  footer,
  noPadding = false,
  children,
  className = '',
  style,
  ...rest
}: CardProps) {
  const baseClass = variantClasses[variant];

  const containerStyle: React.CSSProperties = {
    ...style,
  };

  const contentStyle: React.CSSProperties = noPadding
    ? {}
    : {};

  return (
    <div className={`${baseClass} ${className}`.trim()} style={containerStyle} {...rest}>
      {header && (
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {header}
        </div>
      )}
      <div style={contentStyle}>{children}</div>
      {footer && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--cc-hairline)' }}>
          {footer}
        </div>
      )}
    </div>
  );
}
