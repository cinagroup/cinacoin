import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';
import type { BaseProps } from '../../types';

export interface FooterColumn {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
}

export interface FooterProps extends HTMLAttributes<HTMLElement>, BaseProps {
  /** Footer columns (4-column layout) */
  columns?: FooterColumn[];
  /** Logo slot */
  logo?: ReactNode;
  /** Copyright text */
  copyright?: string;
  /** Social links slot */
  social?: ReactNode;
}

export const Footer = forwardRef<HTMLElement, FooterProps>(
  ({ columns = [], logo, copyright, social, className, children, ...props }, ref) => {
    return (
      <footer
        ref={ref}
        className={cn('bg-white text-[#4d4d4d] py-16 px-6', className)}
        {...props}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {columns.map((column, idx) => (
              <div key={idx} className="flex flex-col gap-3">
                <h3 className="text-sm font-medium text-[#171717] mb-2">
                  {column.title}
                </h3>
                {column.links.map((link, linkIdx) => (
                  <a
                    key={linkIdx}
                    href={link.href}
                    className="text-sm text-[#4d4d4d] hover:text-[#171717] transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-[#ebebeb] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {logo && <div className="flex-shrink-0">{logo}</div>}
              {copyright && (
                <p className="text-sm text-[#4d4d4d]">{copyright}</p>
              )}
            </div>
            {social && <div className="flex items-center gap-4">{social}</div>}
          </div>

          {children}
        </div>
      </footer>
    );
  },
);

Footer.displayName = 'Footer';
