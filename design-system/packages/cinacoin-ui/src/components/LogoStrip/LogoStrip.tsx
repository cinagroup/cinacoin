import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';
import type { BaseProps } from '../../types';

export interface LogoStripProps extends HTMLAttributes<HTMLDivElement>, BaseProps {
  /** Section heading */
  heading?: string;
  /** Logo items */
  logos: Array<{
    src?: string;
    alt: string;
    node?: ReactNode;
  }>;
  /** Grayscale logos */
  grayscale?: boolean;
}

export const LogoStrip = forwardRef<HTMLDivElement, LogoStripProps>(
  ({ heading, logos, grayscale = true, className, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn('px-6 py-12 md:py-16', className)}
        {...props}
      >
        <div className="max-w-6xl mx-auto">
          {heading && (
            <p className="text-center text-sm text-[#4d4d4d] mb-8">{heading}</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {logos.map((logo, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center',
                  grayscale && 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all',
                )}
              >
                {logo.node || (logo.src && (
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    className="h-6 md:h-8 object-contain"
                  />
                )) || (
                  <span className="text-sm font-medium text-[#4d4d4d]">{logo.alt}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  },
);

LogoStrip.displayName = 'LogoStrip';
