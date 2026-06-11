'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
      <h2 className="text-heading-3 text-[var(--cc-ink)]">Something went wrong.</h2>
      <p className="text-body text-[var(--cc-body)]">{error.message}</p>
      <button onClick={reset} className="cc-btn-primary">
        Try again
      </button>
    </div>
  );
}
