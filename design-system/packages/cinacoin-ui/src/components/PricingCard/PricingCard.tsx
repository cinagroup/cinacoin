import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';
import type { BaseProps } from '../../types';

export interface PricingCardProps extends HTMLAttributes<HTMLDivElement>, BaseProps {
  /** Featured (inverted) variant */
  featured?: boolean;
  /** Plan name */
  name: string;
  /** Price display (e.g. "$29") */
  price: string;
  /** Price period (e.g. "/month") */
  period?: string;
  /** Description text */
  description?: string;
  /** Feature list */
  features?: string[];
  /** CTA button */
  cta?: ReactNode;
  /** Badge text (e.g. "Most Popular") */
  badge?: string;
}

export const PricingCard = forwardRef<HTMLDivElement, PricingCardProps>(
  (
    {
      featured = false,
      name,
      price,
      period,
      description,
      features = [],
      cta,
      badge,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[12px] p-8 flex flex-col h-full',
          featured
            ? 'bg-[#171717] text-white'
            : 'bg-white text-[#171717] shadow-[0px_2px_2px_rgba(0,0,0,0.04),0px_8px_16px_-4px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)]',
          className,
        )}
        {...props}
      >
        {badge && (
          <span
            className={cn(
              'inline-flex self-start items-center rounded-full px-2.5 py-0.5 text-xs font-medium mb-4',
              featured
                ? 'bg-white/10 text-white'
                : 'bg-[#fafafa] text-[#4d4d4d]',
            )}
          >
            {badge}
          </span>
        )}

        <h3 className="text-lg font-semibold mb-2">{name}</h3>

        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-4xl font-semibold tracking-tight">{price}</span>
          {period && (
            <span
              className={cn(
                'text-sm',
                featured ? 'text-white/60' : 'text-[#4d4d4d]',
              )}
            >
              {period}
            </span>
          )}
        </div>

        {description && (
          <p
            className={cn(
              'text-sm mb-6',
              featured ? 'text-white/60' : 'text-[#4d4d4d]',
            )}
          >
            {description}
          </p>
        )}

        {features.length > 0 && (
          <ul className="flex flex-col gap-3 mb-8 flex-1">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <svg
                  className={cn(
                    'w-4 h-4 mt-0.5 flex-shrink-0',
                    featured ? 'text-white' : 'text-[#171717]',
                  )}
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.5 4.5L6 12L2.5 8.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className={featured ? 'text-white/80' : 'text-[#4d4d4d]'}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        )}

        {cta && <div className="mt-auto">{cta}</div>}
      </div>
    );
  },
);

PricingCard.displayName = 'PricingCard';
