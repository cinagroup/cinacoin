/**
 * Performance Metrics Collection for @cinacoin/core-sdk
 *
 * Provides centralized metrics collection and reporting for all performance
 * optimizations across the SDK and dependent packages.
 */

export interface PerformanceMetrics {
  // Cache metrics
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  
  // Request metrics
  totalRequests: number;
  deduplicatedRequests: number;
  batchedRequests: number;
  
  // Connection pool metrics
  activeConnections: number;
  pooledConnections: number;
  
  // Compression metrics (relay server)
  bytesOriginal: number;
  bytesCompressed: number;
  compressionRatio: number;
  
  // Timing metrics
  averageRequestTime: number;
  p95RequestTime: number;
  p99RequestTime: number;
  
  // Bundle metrics
  bundleSizeBytes: number;
  chunkCount: number;
  
  // Custom metrics
  custom: Map<string, number>;
}

export class MetricsCollector {
  private metrics: PerformanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    cacheHitRate: 0,
    totalRequests: 0,
    deduplicatedRequests: 0,
    batchedRequests: 0,
    activeConnections: 0,
    pooledConnections: 0,
    bytesOriginal: 0,
    bytesCompressed: 0,
    compressionRatio: 0,
    averageRequestTime: 0,
    p95RequestTime: 0,
    p99RequestTime: 0,
    bundleSizeBytes: 0,
    chunkCount: 0,
    custom: new Map(),
  };
  
  private requestTimes: number[] = [];
  private readonly maxRequestTimes = 1000; // Keep last 1000 for percentile calculation
  
  /**
   * Record a cache hit
   */
  recordCacheHit(): void {
    this.metrics.cacheHits++;
    this.updateCacheHitRate();
  }
  
  /**
   * Record a cache miss
   */
  recordCacheMiss(): void {
    this.metrics.cacheMisses++;
    this.updateCacheHitRate();
  }
  
  /**
   * Record a request
   */
  recordRequest(durationMs: number): void {
    this.metrics.totalRequests++;
    this.requestTimes.push(durationMs);
    
    // Keep only last N request times
    if (this.requestTimes.length > this.maxRequestTimes) {
      this.requestTimes.shift();
    }
    
    this.updateRequestTimings();
  }
  
  /**
   * Record a deduplicated request
   */
  recordDeduplication(): void {
    this.metrics.deduplicatedRequests++;
  }
  
  /**
   * Record a batched request
   */
  recordBatch(size: number): void {
    this.metrics.batchedRequests += size;
  }
  
  /**
   * Update connection pool metrics
   */
  updateConnectionPool(active: number, pooled: number): void {
    this.metrics.activeConnections = active;
    this.metrics.pooledConnections = pooled;
  }
  
  /**
   * Update compression metrics
   */
  updateCompression(original: number, compressed: number): void {
    this.metrics.bytesOriginal += original;
    this.metrics.bytesCompressed += compressed;
    this.metrics.compressionRatio = this.metrics.bytesOriginal > 0
      ? (1 - this.metrics.bytesCompressed / this.metrics.bytesOriginal) * 100
      : 0;
  }
  
  /**
   * Update bundle metrics
   */
  updateBundle(sizeBytes: number, chunks: number): void {
    this.metrics.bundleSizeBytes = sizeBytes;
    this.metrics.chunkCount = chunks;
  }
  
  /**
   * Set a custom metric
   */
  setCustom(name: string, value: number): void {
    this.metrics.custom.set(name, value);
  }
  
  /**
   * Increment a custom metric
   */
  incrementCustom(name: string, amount: number = 1): void {
    const current = this.metrics.custom.get(name) ?? 0;
    this.metrics.custom.set(name, current + amount);
  }
  
  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get metrics as JSON (for API responses)
   */
  toJson(): Record<string, unknown> {
    return {
      ...this.metrics,
      custom: Object.fromEntries(this.metrics.custom),
      timestamp: Date.now(),
    };
  }
  
  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      totalRequests: 0,
      deduplicatedRequests: 0,
      batchedRequests: 0,
      activeConnections: 0,
      pooledConnections: 0,
      bytesOriginal: 0,
      bytesCompressed: 0,
      compressionRatio: 0,
      averageRequestTime: 0,
      p95RequestTime: 0,
      p99RequestTime: 0,
      bundleSizeBytes: 0,
      chunkCount: 0,
      custom: new Map(),
    };
    this.requestTimes = [];
  }
  
  /**
   * Export metrics in Prometheus format
   */
  toPrometheus(): string {
    const lines: string[] = [
      '# HELP cinacoin_cache_hits_total Total cache hits',
      '# TYPE cinacoin_cache_hits_total counter',
      `cinacoin_cache_hits_total ${this.metrics.cacheHits}`,
      '',
      '# HELP cinacoin_cache_misses_total Total cache misses',
      '# TYPE cinacoin_cache_misses_total counter',
      `cinacoin_cache_misses_total ${this.metrics.cacheMisses}`,
      '',
      '# HELP cinacoin_cache_hit_rate Cache hit rate percentage',
      '# TYPE cinacoin_cache_hit_rate gauge',
      `cinacoin_cache_hit_rate ${this.metrics.cacheHitRate.toFixed(2)}`,
      '',
      '# HELP cinacoin_requests_total Total requests processed',
      '# TYPE cinacoin_requests_total counter',
      `cinacoin_requests_total ${this.metrics.totalRequests}`,
      '',
      '# HELP cinacoin_deduplicated_requests_total Deduplicated requests',
      '# TYPE cinacoin_deduplicated_requests_total counter',
      `cinacoin_deduplicated_requests_total ${this.metrics.deduplicatedRequests}`,
      '',
      '# HELP cinacoin_batched_requests_total Batched requests',
      '# TYPE cinacoin_batched_requests_total counter',
      `cinacoin_batched_requests_total ${this.metrics.batchedRequests}`,
      '',
      '# HELP cinacoin_active_connections Current active connections',
      '# TYPE cinacoin_active_connections gauge',
      `cinacoin_active_connections ${this.metrics.activeConnections}`,
      '',
      '# HELP cinacoin_pooled_connections Pooled connections',
      '# TYPE cinacoin_pooled_connections gauge',
      `cinacoin_pooled_connections ${this.metrics.pooledConnections}`,
      '',
      '# HELP cinacoin_compression_ratio Compression ratio percentage',
      '# TYPE cinacoin_compression_ratio gauge',
      `cinacoin_compression_ratio ${this.metrics.compressionRatio.toFixed(2)}`,
      '',
      '# HELP cinacoin_bytes_saved_total Bytes saved by compression',
      '# TYPE cinacoin_bytes_saved_total counter',
      `cinacoin_bytes_saved_total ${this.metrics.bytesOriginal - this.metrics.bytesCompressed}`,
      '',
      '# HELP cinacoin_avg_request_time_ms Average request time in milliseconds',
      '# TYPE cinacoin_avg_request_time_ms gauge',
      `cinacoin_avg_request_time_ms ${this.metrics.averageRequestTime.toFixed(2)}`,
      '',
      '# HELP cinacoin_p95_request_time_ms 95th percentile request time',
      '# TYPE cinacoin_p95_request_time_ms gauge',
      `cinacoin_p95_request_time_ms ${this.metrics.p95RequestTime.toFixed(2)}`,
      '',
      '# HELP cinacoin_p99_request_time_ms 99th percentile request time',
      '# TYPE cinacoin_p99_request_time_ms gauge',
      `cinacoin_p99_request_time_ms ${this.metrics.p99RequestTime.toFixed(2)}`,
      '',
      '# HELP cinacoin_bundle_size_bytes Total bundle size',
      '# TYPE cinacoin_bundle_size_bytes gauge',
      `cinacoin_bundle_size_bytes ${this.metrics.bundleSizeBytes}`,
      '',
      '# HELP cinacoin_chunk_count Number of chunks',
      '# TYPE cinacoin_chunk_count gauge',
      `cinacoin_chunk_count ${this.metrics.chunkCount}`,
    ];
    
    // Add custom metrics
    for (const [name, value] of this.metrics.custom) {
      lines.push(`cinacoin_custom_${name} ${value}`);
    }
    
    return lines.join('\n') + '\n';
  }
  
  private updateCacheHitRate(): void {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    this.metrics.cacheHitRate = total > 0 
      ? (this.metrics.cacheHits / total) * 100 
      : 0;
  }
  
  private updateRequestTimings(): void {
    if (this.requestTimes.length === 0) return;
    
    const sorted = [...this.requestTimes].sort((a, b) => a - b);
    
    // Average
    const sum = sorted.reduce((a, b) => a + b, 0);
    this.metrics.averageRequestTime = sum / sorted.length;
    
    // Percentiles
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);
    
    this.metrics.p95RequestTime = sorted[p95Index] ?? 0;
    this.metrics.p99RequestTime = sorted[p99Index] ?? 0;
  }
}

// Global singleton instance
export const metricsCollector = new MetricsCollector();
