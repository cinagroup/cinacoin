import React, { forwardRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils';
import type { BaseProps } from '../../types';

export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface NavBarProps extends HTMLAttributes<HTMLElement>, BaseProps {
  /** Logo slot (left side) */
  logo?: ReactNode;
  /** Navigation items */
  items?: NavItem[];
  /** CTA buttons slot (right side) */
  actions?: ReactNode;
  /** Sticky positioning */
  sticky?: boolean;
}

export const NavBar = forwardRef<HTMLElement, NavBarProps>(
  ({ logo, items = [], actions, sticky = true, className, children, ...props }, ref) => {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
      <nav
        ref={ref}
        className={cn(
          'bg-white border-b border-[#ebebeb] h-16 px-6 flex items-center justify-between',
          sticky && 'sticky top-0 z-50',
          className,
        )}
        {...props}
      >
        {/* Logo */}
        <div className="flex items-center gap-8">
          {logo && <div className="flex-shrink-0">{logo}</div>}

          {/* Desktop nav items */}
          <div className="hidden md:flex items-center gap-1">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm text-[#4d4d4d] px-3 py-1.5 rounded-full transition-colors',
                  'hover:bg-[#fafafa] hover:text-[#171717]',
                  item.active && 'bg-[#fafafa] text-[#171717] font-medium',
                )}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">{actions}</div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden p-2 -mr-2 text-[#4d4d4d] hover:text-[#171717]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            {mobileOpen ? (
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            ) : (
              <>
                <path d="M3 5H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M3 10H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M3 15H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-[#ebebeb] md:hidden">
            <div className="flex flex-col p-4 gap-1">
              {items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-sm text-[#4d4d4d] px-3 py-2 rounded-[6px] transition-colors',
                    'hover:bg-[#fafafa] hover:text-[#171717]',
                    item.active && 'bg-[#fafafa] text-[#171717] font-medium',
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              {actions && (
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[#ebebeb]">
                  {actions}
                </div>
              )}
            </div>
          </div>
        )}

        {children}
      </nav>
    );
  },
);

NavBar.displayName = 'NavBar';
