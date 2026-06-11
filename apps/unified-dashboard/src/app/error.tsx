'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-4 bg-[var(--cc-canvas-soft)]">
      <h2 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.6px', color: 'var(--cc-ink)' }}>
        Something went wrong.
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--cc-body)' }}>{error.message}</p>
      <button
        onClick={reset}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '40px',
          padding: '0 20px',
          backgroundColor: 'var(--cc-primary)',
          color: 'var(--cc-on-primary)',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}
