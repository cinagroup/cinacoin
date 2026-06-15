/**
 * Cinacoin Monitoring Package
 *
 * Comprehensive monitoring and observability for the Cinacoin platform.
 *
 * Features:
 * - Web Vitals collection (LCP, FID, CLS, TTFB, INP)
 * - Performance budgets and validation
 * - Resource timing metrics
 * - Long task observation
 * - Prometheus metrics export
 * - Alerting and dashboarding
 *
 * @packageDocumentation
 */

// Metrics definitions
export * from './metrics.js';

// Performance monitoring
export * from './performance.js';

// Alerts
export * from './alerts.js';

// Dashboard utilities
export * from './dashboard.js';

// Cloudflare Workers Analytics Engine integration
export * from './analytics-engine.js';
