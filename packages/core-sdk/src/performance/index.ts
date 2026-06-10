/**
 * Cinacoin Core SDK — Performance Module
 *
 * Comprehensive performance utilities for the SDK:
 * - Request batching and result caching
 * - Lazy loading and code splitting
 * - Connection pooling and request deduplication
 * - Retry logic with exponential backoff
 * - Debounce, throttle, and memoize utilities
 *
 * @packageDocumentation
 */

// Optimization primitives
export {
  ResultCache,
  RequestBatcher,
  debounce,
  throttle,
  memoize,
  type CacheOptions,
  type BatchHandler,
} from './optimization.js';

// Lazy loading
export {
  createLazyLoader,
  AdapterRegistry,
  conditionalLoad,
  loadWithTimeout,
  type ModuleLoader,
  type AdapterRegistration,
} from './lazy-loading.js';

// Connection pool and transport optimizations
export {
  ConnectionPool,
  createInterceptedFetch,
  createRetryFetch,
  type ConnectionPoolConfig,
  type RequestInterceptor,
  type RetryConfig,
} from './connection-pool.js';

// Performance metrics collection
export {
  MetricsCollector,
  metricsCollector,
  type PerformanceMetrics,
} from './metrics.js';
