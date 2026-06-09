import React, { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils';
import type { BaseProps } from '../../types';

export interface BannerProps extends HTMLAttributes<HTMLDivElement>, BaseProps {}

export const Banner = forwardRef<HTMLDivElement, BannerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-[#fafafa] text-[#4d4d4d] rounded-full px-4 py-2 text-sm text-center',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Banner.displayName = 'Banner';
