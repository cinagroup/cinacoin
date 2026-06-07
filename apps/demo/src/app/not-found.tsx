'use client';

import Link from 'next/link';
import Header from '@/components/Header';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)] flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <p className="cc-caption-mono text-[var(--cc-link)] mb-4">404</p>
        <h1 className="text-[48px] font-[600] tracking-[-2.4px] leading-[48px] text-[var(--cc-ink)]">
          Page not found.
        </h1>
        <p className="mt-6 text-[18px] text-[var(--cc-body)] max-w-xl">
          The page you are looking for does not exist, or has been moved.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="px-8 py-4 rounded-[100px] font-[500] text-[16px] leading-[24px] bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5"
          >
            Go Home
          </Link>
          <Link
            href="/swap"
            className="px-6 py-4 rounded-[100px] font-[500] text-[16px] leading-[24px] bg-[var(--cc-canvas-soft-2)]/60 border border-[var(--cc-hairline-strong)]/60 text-[var(--cc-body)] hover:text-[var(--cc-ink)] hover:border-[var(--cc-hairline-strong)] transition-all duration-200"
          >
            Try Swap Demo →
          </Link>
        </div>
      </main>
    </div>
  );
}
