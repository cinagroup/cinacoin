'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="cc-card text-center py-12">
      <h2 className="text-heading-2 text-ink mb-4">Something went wrong.</h2>
      <p className="text-body text-mute mb-6">{error.message || 'An unexpected error occurred.'}</p>
      <button onClick={reset} className="cc-btn-primary">
        Try again
      </button>
    </div>
  );
}
