"use client";

import { logger } from '@cinacoin/logger';
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render and lifecycle errors in child components.
 * Falls back to a user-friendly error message with retry button.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("[ErrorBoundary]", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="bg-[var(--cc-error-soft)] border border-[var(--cc-error)]/30 rounded-[var(--cc-radius-md)] p-6 text-center">
          <svg className="w-10 h-10 mx-auto mb-3 block text-[var(--cc-error)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <h3 className="cc-display-sm text-[var(--cc-ink)] mb-1">Something went wrong</h3>
          <p className="cc-body-sm text-[var(--cc-body)] max-w-md mx-auto mb-4">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button onClick={this.handleRetry} className="cc-btn-primary-sm">
            ↻ Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
