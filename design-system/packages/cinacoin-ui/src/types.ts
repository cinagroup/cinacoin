import { type ReactNode } from 'react';

export type Size = 'sm' | 'md' | 'lg';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'primary-sm'
  | 'secondary-sm'
  | 'nav-cta'
  | 'tab-ghost';

export type CardVariant =
  | 'marketing'
  | 'marketing-large'
  | 'soft'
  | 'template'
  | 'pricing'
  | 'pricing-featured';

export interface BaseProps {
  className?: string;
  children?: ReactNode;
}
