import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';
import type { BaseProps } from '../../types';

export interface HeroBandProps extends HTMLAttributes<HTMLDivElement>, BaseProps {
  /** Eyebrow badge text */
  eyebrow?: string;
  /** Headline (display-xl) */
  headline: ReactNode;
  /** Body text */
  body?: string;
  /** Primary CTA button */
  primaryCTA?: ReactNode;
  /** Secondary CTA button */
  secondaryCTA?: ReactNode;
  /** Background element (MeshGradient, image, etc.) */
  background?: ReactNode;
}

export const HeroBand = forwardRef<HTMLDivElement, HeroBandProps>(
  (
    {
      eyebrow,
      headline,
      body,
      primaryCTA,
      secondaryCTA,
      background,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <section
        ref={ref}
        className={cn(
          'relative flex flex-col items-center justify-center text-center',
          'px-6 py-24 md:py-32 overflow-hidden',
          className,
        )}
        {...props}
      >
        {/* Background layer */}
        {background && (
          <div className="absolute inset-0 -z-10 pointer-events-none">
            {background}
          </div>
        )}

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6">
          {/* Eyebrow badge */}
          {eyebrow && (
            <span className="inline-flex items-center rounded-full bg-[#fafafa] text-[#4d4d4d] px-3 py-1 text-xs font-medium border border-[#ebebeb]">
              {eyebrow}
            </span>
          )}

          {/* Headline */}
          <h1
            className={cn(
              'font-semibold tracking-[-2.4px]',
              'text-[32px] leading-[36px] md:text-[48px] md:leading-[48px]',
            )}
          >
            {headline}
          </h1>

          {/* Body text */}
          {body && (
            <p className="text-lg leading-7 text-[#4d4d4d] max-w-xl">
              {body}
            </p>
          )}

          {/* CTA buttons */}
          {(primaryCTA || secondaryCTA) && (
            <div className="flex items-center gap-3 mt-2">
              {primaryCTA}
              {secondaryCTA}
            </div>
          )}

          {children}
        </div>
      </section>
    );
  },
);

HeroBand.displayName = 'HeroBand';
