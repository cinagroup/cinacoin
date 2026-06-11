"use client";

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="cc-card text-center py-12 space-y-4">
      <div className="text-4xl">📈</div>
      <h2 className="text-display-sm font-semibold text-ink">Failed to load analytics</h2>
      <p className="text-body-sm text-ink-body">{error.message}</p>
      <button onClick={reset} className="cc-btn-primary">
        Retry
      </button>
    </div>
  );
}
