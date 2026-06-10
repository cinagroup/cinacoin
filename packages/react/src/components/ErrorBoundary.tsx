'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  /** Children to render. */
  children: ReactNode;
  /** Optional custom fallback UI. Receives the error and reset function. */
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — catches render-phase errors in child components and
 * displays a user-friendly fallback UI instead of crashing the app.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 *
 * With custom fallback:
 *   <ErrorBoundary fallback={(error, reset) => <MyFallback error={error} onReset={reset} />}>
 *     <YourComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught a React error:', error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error ?? new Error('Unknown error'),
          this.resetError
        );
      }

      return (
        <div
          style={{
            padding: '24px',
            margin: '16px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
          role="alert"
        >
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: 'var(--text-body-lg)',
              fontWeight: "var(--weight-semibold)",
              color: '#ef4444',
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              margin: '0 0 16px',
              fontSize: 'var(--text-body-sm)',
              color: '#a1a1aa',
            }}
          >
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.resetError}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#6366f1',
              color: '#fff',
              fontSize: 'var(--text-body-sm)',
              fontWeight: "var(--weight-semibold)",
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
