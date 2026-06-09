import React, { forwardRef, type ButtonHTMLAttributes, type ReactElement } from 'react';
import { cn, mergeProps } from '../../utils';
import type { BaseProps } from '../../types';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'primary-sm'
  | 'secondary-sm'
  | 'nav-cta'
  | 'tab-ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, BaseProps {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size override (overrides variant default) */
  size?: ButtonSize;
  /** Render as child element (Radix UI pattern) */
  asChild?: boolean;
  /** Show loading spinner */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#171717] text-white rounded-[100px] text-base font-medium h-12 px-3 hover:bg-[#2a2a2a] transition-colors',
  secondary:
    'bg-white text-[#171717] border border-[#ebebeb] rounded-[100px] text-base font-medium h-12 px-3 hover:bg-[#fafafa] transition-colors',
  'primary-sm':
    'bg-[#171717] text-white rounded-[100px] text-sm font-medium h-8 px-3 hover:bg-[#2a2a2a] transition-colors',
  'secondary-sm':
    'bg-white text-[#171717] border border-[#ebebeb] rounded-[100px] text-sm font-medium h-8 px-3 hover:bg-[#fafafa] transition-colors',
  'nav-cta':
    'bg-[#171717] text-white rounded-[6px] h-7 text-sm font-medium px-3 hover:bg-[#2a2a2a] transition-colors',
  'tab-ghost':
    'bg-white text-[#171717] rounded-[64px] text-sm font-normal hover:bg-[#fafafa] transition-colors',
};

const sizeOverrides: Record<ButtonSize, string> = {
  sm: 'h-8 text-sm px-3',
  md: 'h-12 text-base px-3',
  lg: 'h-12 text-base px-4',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size,
      asChild = false,
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const classes = cn(
      'inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variantStyles[variant],
      size && sizeOverrides[size],
      className,
    );

    if (asChild && React.isValidElement(children)) {
      const child = children as ReactElement;
      const merged = mergeProps(
        { className: classes, ref, disabled: disabled || loading, ...props },
        child.props as Record<string, unknown>,
      );
      return React.cloneElement(child, merged);
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
