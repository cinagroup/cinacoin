'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: '2rem', background: 'var(--cc-canvas)', color: 'var(--cc-ink)' }}>
        <div style={{ maxWidth: 600, margin: '4rem auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h2>
          <p style={{ color: 'var(--cc-body)', marginBottom: '1.5rem' }}>
            The Cinacoin SDK demo encountered an error. This is expected in static-hosted environments.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '10px 24px',
              background: 'var(--cc-primary)',
              color: 'var(--cc-on-primary)',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
