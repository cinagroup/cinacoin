import React, { useState, useCallback } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:opacity-80',
  secondary:
    'bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] text-[var(--cc-ink)] hover:border-[var(--cc-hairline-strong)]',
  ghost:
    'bg-transparent text-[var(--cc-muted)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft-2)]/50',
  success:
    'bg-[var(--cc-success)] text-[var(--cc-on-primary)] hover:opacity-85',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-[var(--cc-xs)] text-[var(--cc-button-md)] rounded-[var(--cc-radius-pill)] h-[32px] min-h-[44px]',
  md: 'px-[var(--cc-sm)] text-[var(--cc-button-lg)] rounded-[var(--cc-radius-pill)] h-[40px] min-h-[44px]',
  lg: 'px-[var(--cc-sm)] text-[var(--cc-button-lg)] rounded-[var(--cc-radius-pill)] h-[48px] min-h-[48px]',
};

/** Ripple effect on click */
function Ripple({ x, y }: { x: number; y: number }) {
  return (
    <span
      className="absolute rounded-full bg-[var(--cc-canvas)]/30 pointer-events-none animate-ripple"
      style={{ left: x - 40, top: y - 40, width: 80, height: 80 }}
    />
  );
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  onClick,
  className = '',
  type = 'button',
}: ButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ripple = { x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() };
      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== ripple.id)), 600);
      onClick?.(e);
    },
    [disabled, loading, onClick],
  );

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`relative overflow-hidden transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        loading ? 'cursor-wait' : 'active:scale-[0.97]'
      } ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading && (
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
      {ripples.map((r) => (
        <Ripple key={r.id} x={r.x} y={r.y} />
      ))}
    </button>
  );
}
