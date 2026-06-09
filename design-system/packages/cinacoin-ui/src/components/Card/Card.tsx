import React, { forwardRef, type HTMLAttributes, type ReactElement } from 'react';
import { cn, mergeProps } from '../../utils';
import type { BaseProps } from '../../types';

export type CardVariant =
  | 'marketing'
  | 'marketing-large'
  | 'soft'
  | 'template'
  | 'pricing'
  | 'pricing-featured';

export interface CardProps extends HTMLAttributes<HTMLDivElement>, BaseProps {
  /** Visual variant */
  variant?: CardVariant;
  /** Enable hover effect */
  hover?: boolean;
  /** Render as child element (Radix UI pattern) */
  asChild?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  marketing:
    'bg-white rounded-[8px] p-6 shadow-[0px_2px_2px_rgba(0,0,0,0.04),0px_8px_8px_-8px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)]',
  'marketing-large':
    'bg-white rounded-[12px] p-8 shadow-[0px_2px_2px_rgba(0,0,0,0.04),0px_8px_16px_-4px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)]',
  soft: 'bg-[#fafafa] rounded-[8px] p-6',
  template: 'bg-white rounded-[8px] p-4',
  pricing: 'bg-white rounded-[12px] p-8 shadow-[0px_2px_2px_rgba(0,0,0,0.04),0px_8px_16px_-4px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.08)]',
  'pricing-featured':
    'bg-[#171717] text-white rounded-[12px] p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'marketing', hover = false, asChild = false, className, children, ...props }, ref) => {
    const classes = cn(
      variantStyles[variant],
      hover && 'transition-shadow duration-200 hover:shadow-[0px_1px_1px_rgba(0,0,0,0.02),0px_8px_16px_-4px_rgba(0,0,0,0.04),0px_24px_32px_-8px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(0,0,0,0.08)]',
      className,
    );

    if (asChild && React.isValidElement(children)) {
      const child = children as ReactElement;
      const merged = mergeProps(
        { className: classes, ref, ...props },
        child.props as Record<string, unknown>,
      );
      return React.cloneElement(child, merged);
    }

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  },
) as CardComponent;

Card.displayName = 'Card';

// Sub-components
export interface CardSubProps extends HTMLAttributes<HTMLDivElement>, BaseProps {}

const CardHeader = forwardRef<HTMLDivElement, CardSubProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  ),
);
CardHeader.displayName = 'Card.Header';

const CardBody = forwardRef<HTMLDivElement, CardSubProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex-1', className)} {...props}>
      {children}
    </div>
  ),
);
CardBody.displayName = 'Card.Body';

const CardFooter = forwardRef<HTMLDivElement, CardSubProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('mt-4 pt-4 border-t border-[#ebebeb]', className)} {...props}>
      {children}
    </div>
  ),
);
CardFooter.displayName = 'Card.Footer';

// Compound component type
interface CardComponent
  extends React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>> {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
}

(Card as CardComponent).Header = CardHeader;
(Card as CardComponent).Body = CardBody;
(Card as CardComponent).Footer = CardFooter;
