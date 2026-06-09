'use client';

import Link from 'next/link';
import { useState } from 'react';

const navItems = [
  { label: 'Products', href: '/products' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Developers', href: '/developers' },
  { label: 'Resources', href: '/resources' },
  { label: 'About', href: '/about' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#ebebeb]">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-[#171717] font-semibold text-[16px] tracking-tight hover:opacity-70 transition-opacity duration-150">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="6" fill="#171717"/>
            <text x="16" y="22" fontFamily="Inter,system-ui,sans-serif" fontSize="18" fontWeight="600" fill="#ffffff" textAnchor="middle">C</text>
          </svg>
          CinaCoin
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-[14px] font-medium text-[#4d4d4d] hover:text-[#171717] rounded-[6px] hover:bg-[#f5f5f5] transition-all duration-150"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/developers"
            className="px-4 py-2 text-[14px] font-medium text-[#4d4d4d] hover:text-[#171717] transition-colors duration-150"
          >
            Documentation
          </Link>
          <Link
            href="/products"
            className="px-4 py-2 text-[14px] font-medium bg-[#171717] text-white rounded-[6px] hover:bg-[#000000] transition-colors duration-150"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-[#171717] hover:bg-[#f5f5f5] rounded-[6px] transition-colors duration-150"
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            {mobileOpen ? (
              <>
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </>
            ) : (
              <>
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#ebebeb] bg-white">
          <nav className="max-w-[1200px] mx-auto px-6 py-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 text-[14px] font-medium text-[#4d4d4d] hover:text-[#171717] rounded-[6px] hover:bg-[#f5f5f5] transition-all duration-150"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t border-[#ebebeb] flex flex-col gap-2">
              <Link
                href="/developers"
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 text-[14px] font-medium text-[#4d4d4d] hover:text-[#171717] rounded-[6px] hover:bg-[#f5f5f5] transition-all duration-150"
              >
                Documentation
              </Link>
              <Link
                href="/products"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2 text-[14px] font-medium bg-[#171717] text-white rounded-[6px] hover:bg-[#000000] transition-colors duration-150 text-center"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
