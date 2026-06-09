import React, { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils';
import type { BaseProps } from '../../types';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, BaseProps {
  /** Badge variant */
  variant?: 'default' | 'secondary';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-normal',
          variant === 'default' && 'bg-[#fafafa] text-[#4d4d4d]',
          variant === 'secondary' && 'bg-[#171717] text-white',
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';
