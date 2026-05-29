/**
 * Circuit Breaker Pattern for External API Calls
 *
 * Prevents cascading failures when external services are unhealthy.
 * States:
 *   CLOSED    — normal operation, requests pass through
 *   OPEN      — failures exceeded threshold, requests fail fast
 *   HALF_OPEN — testing if service recovered, limited attempts allowed
 *
 * Emits events on state transitions for observability.
 */

export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening the circuit (default 5) */
  failureThreshold?: number;
  /** Milliseconds to wait before transitioning OPEN → HALF_OPEN (default 30000) */
  recoveryTimeout?: number;
  /** Max concurrent attempts allowed in HALF_OPEN state (default 3) */
  halfOpenMaxAttempts?: number;
  /** Optional callback on state changes */
  onStateChange?: (from: CircuitBreakerState, to: CircuitBreakerState, error?: Error) => void;
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly state: CircuitBreakerState,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "CircuitBreakerError";
  }
}

interface CircuitBreakerMetrics {
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
  lastFailureAt: number | null;
  lastSuccessAt: number | null;
}

export class CircuitBreaker {
  private state: CircuitBreakerState = "CLOSED";
  private failureCount: number = 0;
  private halfOpenAttempts: number = 0;
  private lastFailureTime: number = 0;
  private metrics: CircuitBreakerMetrics = {
    totalCalls: 0,
    totalFailures: 0,
    totalSuccesses: 0,
    lastFailureAt: null,
    lastSuccessAt: null,
  };

  readonly failureThreshold: number;
  readonly recoveryTimeout: number;
  readonly halfOpenMaxAttempts: number;
  readonly onStateChange?: (from: CircuitBreakerState, to: CircuitBreakerState, error?: Error) => void;

  constructor(options?: CircuitBreakerOptions) {
    this.failureThreshold = options?.failureThreshold ?? 5;
    this.recoveryTimeout = options?.recoveryTimeout ?? 30_000;
    this.halfOpenMaxAttempts = options?.halfOpenMaxAttempts ?? 3;
    this.onStateChange = options?.onStateChange;
  }

  /**
   * Execute a function through the circuit breaker.
   * - CLOSED: executes normally; failures increment counter
   * - OPEN: rejects immediately (fail-fast)
   * - HALF_OPEN: allows limited attempts; success closes, failure re-opens
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.metrics.totalCalls++;
    this.checkState();

    const currentState = this.state;

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /** Get the current circuit state */
  getState(): CircuitBreakerState {
    // Auto-transition from OPEN to HALF_OPEN if recovery timeout has elapsed
    if (
      this.state === "OPEN" &&
      Date.now() - this.lastFailureTime >= this.recoveryTimeout
    ) {
      this.transitionTo("HALF_OPEN");
    }
    return this.state;
  }

  /** Manually reset the circuit breaker to CLOSED */
  reset(): void {
    this.transitionTo("CLOSED");
    this.failureCount = 0;
    this.halfOpenAttempts = 0;
  }

  /** Reset metrics counters (does not affect state) */
  resetMetrics(): void {
    this.metrics = {
      totalCalls: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      lastFailureAt: null,
      lastSuccessAt: null,
    };
  }

  /** Get current metrics snapshot */
  getMetrics(): Readonly<CircuitBreakerMetrics> {
    return { ...this.metrics };
  }

  // ============================================================
  // Internal State Management
  // ============================================================

  private checkState(): void {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime >= this.recoveryTimeout) {
        this.transitionTo("HALF_OPEN");
      } else {
        throw new CircuitBreakerError(
          `Circuit breaker is OPEN — request rejected (retry after ${this.recoveryTimeout}ms)`,
          "OPEN",
        );
      }
    }

    if (this.state === "HALF_OPEN" && this.halfOpenAttempts >= this.halfOpenMaxAttempts) {
      throw new CircuitBreakerError(
        "Circuit breaker HALF_OPEN max attempts exceeded",
        "HALF_OPEN",
      );
    }
  }

  private onSuccess(): void {
    this.metrics.totalSuccesses++;
    this.metrics.lastSuccessAt = Date.now();

    if (this.state === "HALF_OPEN") {
      // Successful call in HALF_OPEN → close the circuit
      this.transitionTo("CLOSED");
      this.failureCount = 0;
      this.halfOpenAttempts = 0;
    } else if (this.state === "CLOSED") {
      // Reset failure counter on success
      this.failureCount = 0;
    }
  }

  private onFailure(error: Error): void {
    this.metrics.totalFailures++;
    this.metrics.lastFailureAt = Date.now();
    this.lastFailureTime = Date.now();

    if (this.state === "HALF_OPEN") {
      // Failure in HALF_OPEN → re-open the circuit
      this.halfOpenAttempts++;
      this.transitionTo("OPEN", error);
    } else if (this.state === "CLOSED") {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.transitionTo("OPEN", error);
      }
    }
  }

  private transitionTo(newState: CircuitBreakerState, error?: Error): void {
    const oldState = this.state;
    if (oldState === newState) return;

    this.state = newState;

    if (newState === "HALF_OPEN") {
      this.halfOpenAttempts = 0;
    }

    if (this.onStateChange) {
      this.onStateChange(oldState, newState, error);
    }
  }
}
