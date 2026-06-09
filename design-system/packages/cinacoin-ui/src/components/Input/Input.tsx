import React, { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils';
import type { BaseProps, Size } from '../../types';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, BaseProps {
  /** Input size */
  size?: Size;
  /** Error state */
  error?: boolean;
  /** Label text */
  label?: string;
  /** Description text */
  description?: string;
  /** Prefix icon or text */
  prefix?: React.ReactNode;
  /** Suffix icon or text */
  suffix?: React.ReactNode;
}

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 text-sm',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      error = false,
      label,
      description,
      prefix,
      suffix,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#171717]"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            'flex items-center gap-2 bg-white border rounded-[6px] px-3 transition-colors',
            'focus-within:border-[#171717] focus-within:ring-1 focus-within:ring-[#171717]',
            error
              ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500'
              : 'border-[#ebebeb]',
            sizeStyles[size],
          )}
        >
          {prefix && (
            <span className="text-[#4d4d4d] flex-shrink-0">{prefix}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'flex-1 bg-transparent outline-none placeholder:text-[#999]',
              className,
            )}
            {...props}
          />
          {suffix && (
            <span className="text-[#4d4d4d] flex-shrink-0">{suffix}</span>
          )}
        </div>
        {description && (
          <p className="text-xs text-[#4d4d4d]">{description}</p>
        )}
        {error && typeof props.value === 'string' && (
          <p className="text-xs text-red-500">{props.value}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
