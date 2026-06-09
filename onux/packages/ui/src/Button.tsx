import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant. */
  variant?: ButtonVariant;
  /** Size preset. */
  size?: ButtonSize;
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Optional trailing icon. */
  iconRight?: ReactNode;
  /** Show loading spinner and disable interaction. */
  loading?: boolean;
  /** Stretch to full width of container. */
  fullWidth?: boolean;
  children?: ReactNode;
  className?: string;
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: '32px', padding: '0 12px', fontSize: '14px', lineHeight: '20px' },
  md: { height: '40px', padding: '0 16px', fontSize: '14px', lineHeight: '20px' },
  lg: { height: '48px', padding: '0 24px', fontSize: '16px', lineHeight: '24px' },
};

/**
 * Cinacoin Button — wraps design-token primitives with variant/size/loading support.
 *
 * - `primary` → uses `.cc-btn-primary` from design tokens
 * - `secondary` → uses `.cc-btn-secondary` from design tokens
 * - `ghost` → transparent bg, text color
 * - `danger` → error-colored background
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon,
    iconRight,
    loading = false,
    fullWidth = false,
    disabled,
    children,
    className = '',
    style,
    type = 'button',
    ...rest
  },
  ref,
) {
  const useTokenClass = variant === 'primary' || variant === 'secondary';
  const tokenClass = variant === 'primary'
    ? 'cc-btn-primary'
    : variant === 'secondary'
      ? 'cc-btn-secondary'
      : '';

  const ghostBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    background: 'transparent', color: 'var(--cc-body)',
    border: '1px solid transparent', borderRadius: 'var(--cc-radius-pill)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    fontWeight: 500, whiteSpace: 'nowrap', textDecoration: 'none',
    transition: 'color 0.15s ease',
  };

  const dangerBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    background: 'var(--cc-error)', color: '#ffffff',
    border: 'none', borderRadius: 'var(--cc-radius-pill)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    fontWeight: 500, whiteSpace: 'nowrap', textDecoration: 'none',
    transition: 'opacity 0.15s ease',
  };

  const variantStyle: React.CSSProperties = variant === 'ghost'
    ? ghostBase
    : variant === 'danger'
      ? dangerBase
      : {};

  const mergedStyle: React.CSSProperties = {
    ...variantStyle,
    ...sizeStyles[size],
    ...(disabled || loading ? { opacity: 0.5 } : {}),
    ...(fullWidth ? { width: '100%' } : {}),
    ...style,
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${tokenClass} ${className}`.trim()}
      style={mergedStyle}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
      {iconRight}
    </button>
  );
});

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ animation: 'cc-spin 0.6s linear infinite' }}
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <style>{`@keyframes cc-spin { to { transform: rotate(360deg) } }`}</style>
    </svg>
  );
}
