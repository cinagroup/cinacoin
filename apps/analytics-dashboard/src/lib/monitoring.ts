/**
 * Production Monitoring Utilities
 *
 * Provides performance marks, error tracking, and metrics collection
 * for the analytics dashboard in production environments.
 */

/**
 * Track a performance mark with optional duration measurement
 */
export function trackPerformance(markName: string, duration?: number): void {
  if (typeof window === 'undefined') return; // SSR guard

  try {
    if (duration !== undefined) {
      // Custom duration tracking
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Perf] ${markName}: ${duration.toFixed(2)}ms`);
      }

      // Send to analytics endpoint if configured
      if (process.env.NEXT_PUBLIC_PERF_ENDPOINT) {
        sendMetric('performance', {
          name: markName,
          duration,
          timestamp: Date.now(),
        });
      }
    } else {
      // Use Performance API for automatic measurement
      performance.mark(`${markName}-start`);
    }
  } catch (err) {
    // Silently fail - monitoring should never break the app
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Perf] Failed to track performance:', err);
    }
  }
}

/**
 * End a performance measurement started with trackPerformance
 */
export function endPerformanceMark(markName: string): number | null {
  if (typeof window === 'undefined') return null;

  try {
    performance.mark(`${markName}-end`);
    const measure = performance.measure(
      markName,
      `${markName}-start`,
      `${markName}-end`
    );

    const duration = measure.duration;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Perf] ${markName}: ${duration.toFixed(2)}ms`);
    }

    if (process.env.NEXT_PUBLIC_PERF_ENDPOINT) {
      sendMetric('performance', {
        name: markName,
        duration,
        timestamp: Date.now(),
      });
    }

    // Clean up marks
    performance.clearMarks(`${markName}-start`);
    performance.clearMarks(`${markName}-end`);
    performance.clearMeasures(markName);

    return duration;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Perf] Failed to end performance mark:', err);
    }
    return null;
  }
}

/**
 * Track an error with context
 */
export function trackError(
  error: Error | string,
  context?: Record<string, unknown>
): void {
  const errorObj = typeof error === 'string' ? new Error(error) : error;

  const errorData = {
    message: errorObj.message,
    stack: errorObj.stack,
    context,
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : 'server',
  };

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', errorObj.message, context);
  }

  // Send to error tracking endpoint
  if (process.env.NEXT_PUBLIC_ERROR_ENDPOINT) {
    sendMetric('error', errorData);
  }

  // Also log to console.error in production for server logs
  if (process.env.NODE_ENV === 'production') {
    console.error('[Analytics Dashboard Error]', errorObj.message, {
      ...context,
      url: errorData.url,
    });
  }
}

/**
 * Track a custom metric/event
 */
export function trackMetric(
  name: string,
  value: number | string,
  metadata?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Metric] ${name}:`, value, metadata);
  }

  if (process.env.NEXT_PUBLIC_METRICS_ENDPOINT) {
    sendMetric('custom', {
      name,
      value,
      metadata,
      timestamp: Date.now(),
    });
  }
}

/**
 * Track component mount/render time
 */
export function trackComponentRender(componentName: string): () => void {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    trackPerformance(`${componentName}.render`, duration);
  };
}

/**
 * Track WebSocket connection events
 */
export function trackWebSocketEvent(
  event: 'connect' | 'disconnect' | 'reconnect' | 'error',
  details?: Record<string, unknown>
): void {
  trackMetric('websocket.event', event, details);
}

/**
 * Track user interactions (for analytics)
 */
export function trackUserAction(
  action: string,
  metadata?: Record<string, unknown>
): void {
  trackMetric('user.action', action, metadata);
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

let metricQueue: Array<{ type: string; data: unknown }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Queue metrics and batch-send them to avoid excessive network requests
 */
function sendMetric(type: string, data: unknown): void {
  metricQueue.push({ type, data });

  // Flush immediately if queue is large
  if (metricQueue.length >= 10) {
    flushMetrics();
    return;
  }

  // Otherwise, debounce flush
  if (flushTimer) {
    clearTimeout(flushTimer);
  }
  flushTimer = setTimeout(flushMetrics, 2000); // Flush every 2 seconds
}

/**
 * Flush queued metrics to the backend
 */
function flushMetrics(): void {
  if (metricQueue.length === 0) return;

  const batch = metricQueue;
  metricQueue = [];

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  // Determine endpoint based on metric type
  const endpoint =
    batch[0]?.type === 'error'
      ? process.env.NEXT_PUBLIC_ERROR_ENDPOINT
      : batch[0]?.type === 'performance'
      ? process.env.NEXT_PUBLIC_PERF_ENDPOINT
      : process.env.NEXT_PUBLIC_METRICS_ENDPOINT;

  if (!endpoint) return;

  // Use sendBeacon for reliability (works even during page unload)
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify({ batch })], {
      type: 'application/json',
    });
    navigator.sendBeacon(endpoint, blob);
  } else {
    // Fallback to fetch
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch }),
      keepalive: true,
    }).catch((err) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Monitoring] Failed to send metrics:', err);
      }
    });
  }
}

/**
 * Initialize monitoring on app load
 */
export function initMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Track initial page load
  if (performance.timing) {
    const loadTime =
      performance.timing.loadEventEnd - performance.timing.navigationStart;
    if (loadTime > 0) {
      trackPerformance('page.load', loadTime);
    }
  }

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    trackMetric('page.visibility', document.visibilityState);
  });

  // Track errors
  window.addEventListener('error', (event) => {
    trackError(event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    trackError(event.reason, {
      type: 'unhandledrejection',
    });
  });
}
