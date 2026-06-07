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
      <span className="text-4xl mb-3 block" aria-hidden="true">⚠️</span>
      <h3 className="text-lg font-semibold text-[var(--cc-ink)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--cc-body)] max-w-md mx-auto">{message}</p>
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
