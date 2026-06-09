import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input size variant. */
  size?: InputSize;
  /** Optional leading icon or addon. */
  leftAddon?: ReactNode;
  /** Optional trailing icon or addon. */
  rightAddon?: ReactNode;
  /** Show error state. */
  error?: boolean;
  /** Helper text below the input. */
  helperText?: string;
  /** Error message (implies error=true). */
  errorMessage?: string;
  className?: string;
}

const sizeStyles: Record<InputSize, React.CSSProperties> = {
  sm: { height: '32px', padding: '0 8px', fontSize: '12px', lineHeight: '16px' },
  md: { height: '40px', padding: '0 12px', fontSize: '14px', lineHeight: '20px' },
  lg: { height: '48px', padding: '0 16px', fontSize: '16px', lineHeight: '24px' },
};

/**
 * Cinacoin Input — wraps design-token primitives with addons, error states, and helper text.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = 'md',
    leftAddon,
    rightAddon,
    error = false,
    helperText,
    errorMessage,
    className = '',
    style,
    disabled,
    ...rest
  },
  ref,
) {
  const hasError = error || !!errorMessage;
  const showHelper = helperText || errorMessage;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '100%',
  };

  const inputWrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--cc-canvas)',
    border: `1px solid ${hasError ? 'var(--cc-error)' : 'var(--cc-hairline)'}`,
    borderRadius: 'var(--cc-radius-sm)',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    ...sizeStyles[size],
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--cc-ink)',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    width: '100%',
  };

  const helperStyle: React.CSSProperties = {
    fontSize: '12px',
    lineHeight: '16px',
    color: hasError ? 'var(--cc-error)' : 'var(--cc-muted)',
  };

  return (
    <div className={className} style={containerStyle}>
      <div style={inputWrapperStyle}>
        {leftAddon && <span style={{ display: 'flex', flexShrink: 0 }}>{leftAddon}</span>}
        <input
          ref={ref}
          disabled={disabled}
          style={inputStyle}
          {...rest}
        />
        {rightAddon && <span style={{ display: 'flex', flexShrink: 0 }}>{rightAddon}</span>}
      </div>
      {showHelper && (
        <span style={helperStyle}>{errorMessage || helperText}</span>
      )}
    </div>
  );
});
