"use client";

import Link from "next/link";

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="cc-card text-center py-12 space-y-4">
      <div className="text-4xl">📦</div>
      <h2 className="text-display-sm font-semibold text-ink">Failed to load projects</h2>
      <p className="text-body-sm text-ink-body">{error.message}</p>
      <div className="flex gap-3 justify-center">
        <button onClick={reset} className="cc-btn-primary">
          Retry
        </button>
        <Link href="/" className="cc-btn-secondary">
          Go Home
        </Link>
      </div>
    </div>
  );
}
