import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';
import type { BaseProps } from '../../types';

export interface FeatureItem {
  icon?: ReactNode;
  title: string;
  description: string;
}

export interface FeatureBandProps extends HTMLAttributes<HTMLDivElement>, BaseProps {
  /** Section heading */
  heading?: string;
  /** Section subheading */
  subheading?: string;
  /** Feature items */
  features: FeatureItem[];
  /** Number of columns (1-3) */
  columns?: 1 | 2 | 3;
}

export const FeatureBand = forwardRef<HTMLDivElement, FeatureBandProps>(
  ({ heading, subheading, features, columns = 3, className, ...props }, ref) => {
    const colClasses: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-3',
    };

    return (
      <section
        ref={ref}
        className={cn('px-6 py-20 md:py-24', className)}
        {...props}
      >
        <div className="max-w-6xl mx-auto">
          {(heading || subheading) && (
            <div className="text-center mb-12">
              {subheading && (
                <p className="text-sm font-medium text-[#0070f3] mb-2">
                  {subheading}
                </p>
              )}
              {heading && (
                <h2
                  className={cn(
                    'font-semibold tracking-[-1.28px]',
                    'text-[24px] leading-[32px] md:text-[32px] md:leading-[40px]',
                  )}
                >
                  {heading}
                </h2>
              )}
            </div>
          )}

          <div className={cn('grid gap-8', colClasses[columns])}>
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-3 p-6 bg-white rounded-[8px] border border-[#ebebeb]"
              >
                {feature.icon && (
                  <div className="w-10 h-10 flex items-center justify-center rounded-[8px] bg-[#fafafa] text-[#171717]">
                    {feature.icon}
                  </div>
                )}
                <h3 className="text-base font-semibold text-[#171717]">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#4d4d4d] leading-5">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  },
);

FeatureBand.displayName = 'FeatureBand';
