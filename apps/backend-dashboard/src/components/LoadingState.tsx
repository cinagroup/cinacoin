"use client";

interface LoadingStateProps {
  label?: string;
  message?: string;
}

/**
 * Loading skeleton for async operations.
 * Follows DESIGN.md: canvas-soft-2 background, hairline border.
 */
export default function LoadingState({
  label = "Loading",
  message = "Please wait while data is being fetched...",
}: LoadingStateProps) {
  return (
    <div
      className="bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] p-6 flex items-center gap-3"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <svg className="animate-spin h-5 w-5 text-[var(--cc-muted)] flex-shrink-0" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <div>
        <p className="cc-body-sm-strong text-[var(--cc-ink)]">{label}</p>
        <p className="cc-caption text-[var(--cc-muted)]">{message}</p>
      </div>
    </div>
  );
}
