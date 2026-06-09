import React, { forwardRef, type AnchorHTMLAttributes } from 'react';
import { cn } from '../../utils';
import type { BaseProps } from '../../types';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement>, BaseProps {
  /** Inline link variant */
  variant?: 'inline' | 'nav' | 'footer';
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ variant = 'inline', className, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(
          'transition-colors',
          variant === 'inline' && 'text-[#0070f3] underline underline-offset-2 hover:text-[#0060df]',
          variant === 'nav' && 'text-sm text-[#4d4d4d] hover:text-[#171717]',
          variant === 'footer' && 'text-sm text-[#4d4d4d] hover:text-[#171717]',
          className,
        )}
        {...props}
      >
        {children}
      </a>
    );
  },
);

Link.displayName = 'Link';
