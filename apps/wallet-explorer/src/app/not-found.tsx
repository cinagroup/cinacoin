'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <h1 className="text-display text-ink mb-4">404.</h1>
      <p className="text-body-lg text-mute mb-8 max-w-md">
        Page not found. The wallet explorer page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/" className="cc-btn-primary">
        ← Back to Wallet Explorer
      </Link>
    </div>
  );
}
