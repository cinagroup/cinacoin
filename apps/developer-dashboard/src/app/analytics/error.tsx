"use client";

import { TrendingUp } from 'lucide-react';

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="cc-card text-center py-12 space-y-4">
      <TrendingUp className="w-8 h-8 text-[var(--cc-ink)] mx-auto" />
      <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">ANALYTICS</p>
      <h2 className="text-display-sm font-semibold text-ink">Failed to load analytics.</h2>
      <p className="text-body-sm text-ink-body">{error.message}</p>
      <button onClick={reset} className="cc-btn-primary">
        Retry
      </button>
    </div>
  );
}
