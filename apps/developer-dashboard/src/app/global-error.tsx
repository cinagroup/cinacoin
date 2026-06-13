"use client";

export default function GlobalRootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "Geist, Inter, system-ui, -apple-system, sans-serif",
          padding: "2rem",
          background: "var(--cc-canvas-soft)",
          color: "var(--cc-ink)",
        }}
      >
        <div
          style={{
            border: "1px solid var(--cc-hairline)",
            borderRadius: "var(--cc-radius-sm)",
            padding: "2rem",
            maxWidth: "28rem",
            textAlign: "center",
            background: "var(--cc-canvas)",
            boxShadow: "var(--cc-level2)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</div>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 600,
              marginBottom: "0.5rem",
              lineHeight: "28px",
              letterSpacing: "-0.6px",
            }}
          >
            Application error.
          </h1>
          <p
            style={{
              color: "var(--cc-body)",
              fontSize: "14px",
              lineHeight: "20px",
              letterSpacing: "-0.28px",
              marginBottom: "1rem",
            }}
          >
            A critical error occurred. The application could not be rendered.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              background: "var(--cc-primary)",
              color: "white",
              border: "none",
              borderRadius: "var(--cc-radius-sm)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              lineHeight: "20px",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
