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
          background: "#fafafa",
          color: "#171717",
        }}
      >
        <div
          style={{
            border: "1px solid #ebebeb",
            borderRadius: "12px",
            padding: "2rem",
            maxWidth: "28rem",
            textAlign: "center",
            background: "#ffffff",
            boxShadow: "0px 1px 1px #17171705, 0px 2px 2px #1717170a, 0 0 0 1px #17171714 inset",
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
            Application Error
          </h1>
          <p
            style={{
              color: "#4d4d4d",
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
              background: "#171717",
              color: "white",
              border: "none",
              borderRadius: "100px",
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
