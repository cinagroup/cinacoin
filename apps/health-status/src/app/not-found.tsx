'use client';

import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--cc-canvas-soft)]">
      <header className="sticky top-0 z-50 h-16 bg-[var(--cc-canvas)] border-b border-[var(--cc-hairline)]">
        <div className="cc-container px-4 h-16 flex items-center justify-between">
          <a href="https://cinacoin.com" className="flex items-center gap-2" aria-label="Cinacoin home">
            <Image src="/logo.png" alt="Cinacoin" width={28} height={28} className="h-7 w-7 rounded-md" loading="lazy" />
            <span className="cc-body-md-strong text-[var(--cc-ink)]">
              Cinacoin <span className="cc-body-md text-[var(--cc-muted)] font-normal">Status</span>
            </span>
          </a>
        </div>
      </header>

      <main className="cc-container px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="cc-display-xl text-[var(--cc-ink)] mb-4">404.</h1>
          <p className="cc-body-lg text-[var(--cc-body)] mb-8 max-w-md">
            Page not found. The status page you&apos;re looking for doesn&apos;t exist.
          </p>
          <a
            href="/"
            className="cc-btn-primary"
          >
            Back to status page.
          </a>
        </div>
      </main>
    </div>
  );
}
