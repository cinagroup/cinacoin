/**
 * Cinacoin Performance Monitoring — Web Vitals Collection
 *
 * Collects Core Web Vitals and performance metrics from browser clients.
 * Integrates with the monitoring system for real-time performance tracking.
 *
 * Metrics collected:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity (deprecated, use INP)
 * - CLS (Cumulative Layout Shift): Visual stability
 * - TTFB (Time to First Byte): Server responsiveness
 * - INP (Interaction to Next Paint): Overall interactivity
 * - FCP (First Contentful Paint): Initial render
 * - TTI (Time to Interactive): Usable interactivity
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface WebVitalsMetrics {
  /** Largest Contentful Paint (ms) */
  lcp?: number;
  /** First Input Delay (ms) - deprecated */
  fid?: number;
  /** Cumulative Layout Shift (unitless) */
  cls?: number;
  /** Time to First Byte (ms) */
  ttfb?: number;
  /** Interaction to Next Paint (ms) */
  inp?: number;
  /** First Contentful Paint (ms) */
  fcp?: number;
  /** Time to Interactive (ms) */
  tti?: number;
  /** Navigation Timing API data */
  navigation?: NavigationTimingMetrics;
  /** Timestamp when metrics were collected */
  timestamp: number;
  /** Page URL where metrics were collected */
  url: string;
  /** User agent */
  userAgent: string;
  /** Connection type if available */
  connectionType?: string;
  /** Effective connection type (4g, 3g, 2g, slow-2g) */
  effectiveConnectionType?: string;
}

export interface NavigationTimingMetrics {
  /** DNS lookup time (ms) */
  dns: number;
  /** TCP connection time (ms) */
  tcp: number;
  /** TLS handshake time (ms) */
  tls: number;
  /** Time to first byte (ms) */
  ttfb: number;
  /** Response download time (ms) */
  download: number;
  /** DOM interactive time (ms) */
  domInteractive: number;
  /** DOM content loaded time (ms) */
  domContentLoaded: number;
  /** Load event time (ms) */
  loadEvent: number;
  /** Total page load time (ms) */
  total: number;
}

export interface PerformanceReport {
  /** Unique session ID */
  sessionId: string;
  /** Page route/path */
  route: string;
  /** Metrics collected */
  metrics: WebVitalsMetrics;
  /** Device memory (GB) if available */
  deviceMemory?: number;
  /** Hardware concurrency (CPU cores) if available */
  hardwareConcurrency?: number;
  /** Viewport dimensions */
  viewport?: {
    width: number;
    height: number;
  };
  /** Whether page was prerendered */
  prerendered?: boolean;
}

export type PerformanceReporter = (report: PerformanceReport) => Promise<void>;

// ─── Web Vitals Collection ───────────────────────────────────────────

/**
 * Initialize Web Vitals collection.
 *
 * Requires the `web-vitals` library to be installed:
 * ```bash
 * pnpm add web-vitals
 * ```
 *
 * Usage in Next.js App Router (layout.tsx or page.tsx):
 * ```tsx
 * import { initWebVitals } from '@cinacoin/monitoring/performance';
 *
 * export default function RootLayout({ children }) {
 *   useEffect(() => {
 *     initWebVitals(async (report) => {
 *       // Send to your analytics endpoint
 *       await fetch('/api/analytics', {
 *         method: 'POST',
 *         body: JSON.stringify(report),
 *       });
 *     });
 *   }, []);
 *
 *   return <html>{children}</html>;
 * }
 * ```
 */
export async function initWebVitals(reporter: PerformanceReporter): Promise<void> {
  if (typeof window === 'undefined') {
    return; // Skip on server-side
  }

  // Dynamic import to avoid bundling in SSR
  const { onLCP, onFID, onCLS, onTTFB, onINP, onFCP } = await import('web-vitals');

  const sessionId = generateSessionId();
  const metrics: Partial<WebVitalsMetrics> = {
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // Collect connection info
  const connection = (navigator as unknown).connection;
  if (connection) {
    metrics.connectionType = connection.type;
    metrics.effectiveConnectionType = connection.effectiveType;
  }

  // Collect device info
  const deviceMemory = (navigator as unknown).deviceMemory;
  const hardwareConcurrency = navigator.hardwareConcurrency;
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // Collect navigation timing
  const navigationTiming = collectNavigationTiming();
  if (navigationTiming) {
    metrics.navigation = navigationTiming;
  }

  // Web Vitals callbacks
  onLCP((metric) => {
    metrics.lcp = metric.value;
    reportMetric('LCP', metric.value, sessionId);
  });

  onFID((metric) => {
    metrics.fid = metric.value;
    reportMetric('FID', metric.value, sessionId);
  });

  onCLS((metric) => {
    metrics.cls = metric.value;
    reportMetric('CLS', metric.value, sessionId);
  });

  onTTFB((metric) => {
    metrics.ttfb = metric.value;
    reportMetric('TTFB', metric.value, sessionId);
  });

  onINP((metric) => {
    metrics.inp = metric.value;
    reportMetric('INP', metric.value, sessionId);
  });

  onFCP((metric) => {
    metrics.fcp = metric.value;
    reportMetric('FCP', metric.value, sessionId);
  });

  // Report after page load
  window.addEventListener('load', () => {
    // Wait a bit for all metrics to be collected
    setTimeout(() => {
      const report: PerformanceReport = {
        sessionId,
        route: window.location.pathname,
        metrics: metrics as WebVitalsMetrics,
        deviceMemory,
        hardwareConcurrency,
        viewport,
        prerendered: document.prerendering ?? false,
      };

      reporter(report).catch((err) => {
        console.error('[Cinacoin] Failed to report performance metrics:', err);
      });
    }, 2000);
  });
}

/**
 * Collect Navigation Timing metrics.
 */
function collectNavigationTiming(): NavigationTimingMetrics | null {
  if (typeof performance === 'undefined') {
    return null;
  }

  const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  if (!navigation) {
    return null;
  }

  const dns = navigation.domainLookupEnd - navigation.domainLookupStart;
  const tcp = navigation.connectEnd - navigation.connectStart;
  const tls = navigation.secureConnectionStart > 0
    ? navigation.connectEnd - navigation.secureConnectionStart
    : 0;
  const ttfb = navigation.responseStart - navigation.requestStart;
  const download = navigation.responseEnd - navigation.responseStart;
  const domInteractive = navigation.domInteractive - navigation.startTime;
  const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.startTime;
  const loadEvent = navigation.loadEventEnd - navigation.startTime;
  const total = navigation.loadEventEnd - navigation.startTime;

  return {
    dns,
    tcp,
    tls,
    ttfb,
    download,
    domInteractive,
    domContentLoaded,
    loadEvent,
    total,
  };
}

/**
 * Generate a unique session ID.
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Report a metric to the monitoring system.
 */
function reportMetric(name: string, value: number, sessionId: string): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Cinacoin] ${name}: ${value.toFixed(2)}ms (session: ${sessionId})`);
  }

  // Send to monitoring endpoint (if configured)
  if (typeof window !== 'undefined' && (window as unknown as Window & typeof globalThis).__CINACOIN_MONITORING__) {
    const endpoint = (window as unknown as Window & typeof globalThis).__CINACOIN_MONITORING__.endpoint;
    if (endpoint) {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: name,
          value,
          sessionId,
          timestamp: Date.now(),
        }),
        keepalive: true,
      }).catch(() => {
        // Silently fail - don't block the main thread
      });
    }
  }
}

// ─── Performance Budgets ─────────────────────────────────────────────

export interface PerformanceBudget {
  /** Maximum LCP in ms */
  lcp: number;
  /** Maximum FID in ms */
  fid: number;
  /** Maximum CLS (unitless) */
  cls: number;
  /** Maximum TTFB in ms */
  ttfb: number;
  /** Maximum INP in ms */
  inp: number;
  /** Maximum FCP in ms */
  fcp: number;
}

/**
 * Default performance budgets based on Google's recommendations.
 * https://web.dev/articles/assessing-performance
 */
export const DEFAULT_BUDGETS: PerformanceBudget = {
  lcp: 2500, // 2.5 seconds
  fid: 100, // 100 milliseconds
  cls: 0.1, // 0.1 unitless
  ttfb: 800, // 800 milliseconds
  inp: 200, // 200 milliseconds
  fcp: 1800, // 1.8 seconds
};

/**
 * Check if metrics meet performance budgets.
 */
export function checkBudgets(
  metrics: WebVitalsMetrics,
  budgets: PerformanceBudget = DEFAULT_BUDGETS
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];

  if (metrics.lcp !== undefined && metrics.lcp > budgets.lcp) {
    violations.push(`LCP: ${metrics.lcp.toFixed(0)}ms > ${budgets.lcp}ms`);
  }

  if (metrics.fid !== undefined && metrics.fid > budgets.fid) {
    violations.push(`FID: ${metrics.fid.toFixed(0)}ms > ${budgets.fid}ms`);
  }

  if (metrics.cls !== undefined && metrics.cls > budgets.cls) {
    violations.push(`CLS: ${metrics.cls.toFixed(2)} > ${budgets.cls}`);
  }

  if (metrics.ttfb !== undefined && metrics.ttfb > budgets.ttfb) {
    violations.push(`TTFB: ${metrics.ttfb.toFixed(0)}ms > ${budgets.ttfb}ms`);
  }

  if (metrics.inp !== undefined && metrics.inp > budgets.inp) {
    violations.push(`INP: ${metrics.inp.toFixed(0)}ms > ${budgets.inp}ms`);
  }

  if (metrics.fcp !== undefined && metrics.fcp > budgets.fcp) {
    violations.push(`FCP: ${metrics.fcp.toFixed(0)}ms > ${budgets.fcp}ms`);
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

// ─── Resource Timing ─────────────────────────────────────────────────

export interface ResourceMetrics {
  /** Total number of resources */
  count: number;
  /** Total transfer size (bytes) */
  transferSize: number;
  /** Total decoded body size (bytes) */
  decodedSize: number;
  /** Total encoded body size (bytes) */
  encodedSize: number;
  /** Resources by type */
  byType: {
    script: ResourceStats;
    stylesheet: ResourceStats;
    image: ResourceStats;
    font: ResourceStats;
    other: ResourceStats;
  };
}

export interface ResourceStats {
  count: number;
  transferSize: number;
  decodedSize: number;
}

/**
 * Collect resource timing metrics.
 */
export function collectResourceMetrics(): ResourceMetrics {
  if (typeof performance === 'undefined') {
    return {
      count: 0,
      transferSize: 0,
      decodedSize: 0,
      encodedSize: 0,
      byType: {
        script: { count: 0, transferSize: 0, decodedSize: 0 },
        stylesheet: { count: 0, transferSize: 0, decodedSize: 0 },
        image: { count: 0, transferSize: 0, decodedSize: 0 },
        font: { count: 0, transferSize: 0, decodedSize: 0 },
        other: { count: 0, transferSize: 0, decodedSize: 0 },
      },
    };
  }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  const metrics: ResourceMetrics = {
    count: resources.length,
    transferSize: 0,
    decodedSize: 0,
    encodedSize: 0,
    byType: {
      script: { count: 0, transferSize: 0, decodedSize: 0 },
      stylesheet: { count: 0, transferSize: 0, decodedSize: 0 },
      image: { count: 0, transferSize: 0, decodedSize: 0 },
      font: { count: 0, transferSize: 0, decodedSize: 0 },
      other: { count: 0, transferSize: 0, decodedSize: 0 },
    },
  };

  for (const resource of resources) {
    const transferSize = resource.transferSize || 0;
    const decodedSize = resource.decodedBodySize || 0;
    const encodedSize = resource.encodedBodySize || 0;

    metrics.transferSize += transferSize;
    metrics.decodedSize += decodedSize;
    metrics.encodedSize += encodedSize;

    let type: keyof ResourceMetrics['byType'] = 'other';
    if (resource.initiatorType === 'script') type = 'script';
    else if (resource.initiatorType === 'link' || resource.initiatorType === 'css') type = 'stylesheet';
    else if (resource.initiatorType === 'img') type = 'image';
    else if (resource.initiatorType === 'font') type = 'font';

    metrics.byType[type].count++;
    metrics.byType[type].transferSize += transferSize;
    metrics.byType[type].decodedSize += decodedSize;
  }

  return metrics;
}

// ─── Long Tasks ──────────────────────────────────────────────────────

export interface LongTask {
  /** Start time (ms) */
  startTime: number;
  /** Duration (ms) */
  duration: number;
  /** Attributed to (if available) */
  attribution?: string[];
}

/**
 * Observe long tasks (> 50ms).
 */
export function observeLongTasks(callback: (task: LongTask) => void): () => void {
  if (typeof PerformanceObserver === 'undefined') {
    return () => {};
  }

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'longtask') {
        callback({
          startTime: entry.startTime,
          duration: entry.duration,
          attribution: (entry as unknown).attribution?.map((a: any) => a.name) || [],
        });
      }
    }
  });

  observer.observe({ entryTypes: ['longtask'] });

  return () => observer.disconnect();
}

// ─── Exports ─────────────────────────────────────────────────────────

export {
  generateSessionId,
  collectNavigationTiming,
};
