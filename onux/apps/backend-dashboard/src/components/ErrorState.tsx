"use client";

interface ErrorStateProps {
  title?: string;
  message?: string;
  retry?: () => void;
}

/**
 * Network failure / error state with user-friendly messaging.
 * Follows DESIGN.md: error-soft background, error border, canvas-soft-2 card.
 */
export default function ErrorState({
  title = "Unable to connect",
  message = "We couldn't reach the server. Please check your internet connection and try again.",
  retry,
}: ErrorStateProps) {
  return (
    <div className="bg-[var(--cc-error-soft)] border border-[var(--cc-error)]/30 rounded-[var(--cc-radius-md)] p-6 text-center">
      <svg className="w-10 h-10 mx-auto mb-3 block text-[var(--cc-error)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <h3 className="cc-display-sm text-[var(--cc-ink)] mb-1">{title}</h3>
      <p className="cc-body-sm text-[var(--cc-body)] max-w-md mx-auto">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="cc-btn-primary-sm mt-4"
        >
          ↻ Retry
        </button>
      )}
    </div>
  );
}
