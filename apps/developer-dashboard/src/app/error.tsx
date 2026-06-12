"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CinaCoin Dashboard Error]", error);
    // In production, report to error tracking service
    // Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="cc-card max-w-md text-center space-y-4">
        <div className="text-4xl" aria-hidden="true">
          ⚠️
        </div>
        <h1 className="text-display-sm font-semibold text-[var(--cc-ink)]">Something went wrong.</h1>
        <p className="text-body-sm text-ink-body">
          {error.digest
            ? `Error ID: ${error.digest}`
            : "An unexpected error occurred while rendering this page."}
        </p>
        {process.env.NODE_ENV === "development" && (
          <details className="text-left">
            <summary className="text-caption text-ink-mute cursor-pointer">Error details</summary>
            <pre className="mt-2 p-3 bg-[var(--cc-canvas-soft)] rounded text-caption font-mono text-danger overflow-x-auto">
              {error.message}
              {"\n"}
              {error.stack}
            </pre>
          </details>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="cc-btn-primary">
            Try again
          </button>
          <a href="/" className="cc-btn-secondary">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
