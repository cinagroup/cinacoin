/**
 * Cloudflare Workers Analytics Engine Integration
 *
 * Provides utilities for sending metrics to Cloudflare Workers Analytics Engine,
 * a high-performance time-series database optimized for Workers.
 *
 * Features:
 * - Batch metric writes for efficiency
 * - Automatic data point formatting
 * - Support for counters, gauges, and histograms
 * - Query helpers for retrieving metrics
 *
 * @see https://developers.cloudflare.com/analytics/analytics-engine/
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AnalyticsEngineBinding {
  writeDataPoint(point: AnalyticsDataPoint): void;
}

export interface AnalyticsDataPoint {
  /** Indexes for fast querying (up to 1 string, 1 number) */
  indexes?: [string] | [string, number];
  /** Blob data (up to 20 strings, max 5120 bytes total) */
  blobs?: string[];
  /** Numeric data (up to 20 doubles) */
  doubles?: number[];
}

export interface MetricDefinition {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  description: string;
  labels?: string[];
  unit?: string;
}

export interface MetricPoint {
  metric: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_BLOB_SIZE = 5120; // Analytics Engine blob size limit
const MAX_BLOBS = 20;
const MAX_DOUBLES = 20;

// ─── Analytics Engine Writer ─────────────────────────────────────────────────

/**
 * AnalyticsEngineWriter provides a high-level API for writing metrics
 * to Cloudflare Workers Analytics Engine.
 */
export class AnalyticsEngineWriter {
  private binding: AnalyticsEngineBinding;
  private buffer: MetricPoint[] = [];
  private batchSize: number;
  private flushInterval: number;
  private lastFlush: number = 0;

  constructor(
    binding: AnalyticsEngineBinding,
    options: { batchSize?: number; flushIntervalMs?: number } = {}
  ) {
    this.binding = binding;
    this.batchSize = options.batchSize || 100;
    this.flushInterval = options.flushIntervalMs || 5000; // 5 seconds
  }

  /**
   * Record a metric point.
   * Points are buffered and flushed in batches for efficiency.
   */
  record(point: MetricPoint): void {
    this.buffer.push(point);

    // Auto-flush if buffer is full or interval has elapsed
    if (this.buffer.length >= this.batchSize) {
      this.flush();
    } else if (Date.now() - this.lastFlush >= this.flushInterval) {
      this.flush();
    }
  }

  /**
   * Increment a counter metric.
   */
  incrementCounter(name: string, value: number = 1, labels: Record<string, string> = {}): void {
    this.record({
      metric: name,
      value,
      labels,
      timestamp: Date.now(),
    });
  }

  /**
   * Set a gauge metric.
   */
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    this.record({
      metric: name,
      value,
      labels,
      timestamp: Date.now(),
    });
  }

  /**
   * Record a histogram observation.
   */
  observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    this.record({
      metric: name,
      value,
      labels,
      timestamp: Date.now(),
    });
  }

  /**
   * Flush buffered metrics to Analytics Engine.
   */
  flush(): void {
    if (this.buffer.length === 0) return;

    const points = this.buffer.splice(0, this.batchSize);

    for (const point of points) {
      try {
        const dataPoint = this.formatDataPoint(point);
        this.binding.writeDataPoint(dataPoint);
      } catch (err) {
        console.error('Failed to write analytics data point:', err);
      }
    }

    this.lastFlush = Date.now();
  }

  /**
   * Format a MetricPoint into an AnalyticsDataPoint.
   */
  private formatDataPoint(point: MetricPoint): AnalyticsDataPoint {
    // Use metric name as primary index
    const indexes: [string] = [point.metric];

    // Encode labels as blobs
    const blobs: string[] = [];
    const doubles: number[] = [point.value]; // First double is always the metric value

    if (point.labels) {
      for (const [key, value] of Object.entries(point.labels)) {
        if (blobs.length < MAX_BLOBS - 1) {
          blobs.push(`${key}=${value}`);
        }
      }
    }

    // Add timestamp as second double if provided
    if (point.timestamp && doubles.length < MAX_DOUBLES) {
      doubles.push(point.timestamp);
    }

    return {
      indexes,
      blobs: blobs.length > 0 ? blobs : undefined,
      doubles: doubles.length > 0 ? doubles : undefined,
    };
  }
}

// ─── Query Helpers ───────────────────────────────────────────────────────────

/**
 * Query helpers for retrieving metrics from Analytics Engine.
 * These are meant to be used from a Worker that queries the Analytics Engine API.
 */
export class AnalyticsEngineQuerier {
  private accountId: string;
  private apiToken: string;
  private baseUrl: string;

  constructor(accountId: string, apiToken: string) {
    this.accountId = accountId;
    this.apiToken = apiToken;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`;
  }

  /**
   * Execute a SQL query against Analytics Engine.
   */
  async query(sql: string): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'text/plain',
      },
      body: sql,
    });

    if (!response.ok) {
      throw new Error(`Analytics Engine query failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get the sum of a counter metric over a time range.
   */
  async getCounterSum(
    metricName: string,
    from: Date,
    to: Date,
    labels?: Record<string, string>
  ): Promise<number> {
    const labelFilter = labels
      ? Object.entries(labels)
          .map(([k, v]) => `AND blob2 LIKE '${k}=${v}%'`)
          .join(' ')
      : '';

    const sql = `
      SELECT SUM(double1) as total
      FROM analytics_engine
      WHERE timestamp >= '${from.toISOString()}'
        AND timestamp <= '${to.toISOString()}'
        AND index1 = '${metricName}'
        ${labelFilter}
    `;

    const result = await this.query(sql);
    return result.data?.[0]?.total || 0;
  }

  /**
   * Get the latest value of a gauge metric.
   */
  async getGaugeValue(
    metricName: string,
    labels?: Record<string, string>
  ): Promise<number> {
    const labelFilter = labels
      ? Object.entries(labels)
          .map(([k, v]) => `AND blob2 LIKE '${k}=${v}%'`)
          .join(' ')
      : '';

    const sql = `
      SELECT double1 as value
      FROM analytics_engine
      WHERE index1 = '${metricName}'
        ${labelFilter}
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const result = await this.query(sql);
    return result.data?.[0]?.value || 0;
  }

  /**
   * Get histogram statistics (avg, p50, p95, p99) over a time range.
   */
  async getHistogramStats(
    metricName: string,
    from: Date,
    to: Date,
    labels?: Record<string, string>
  ): Promise<{ avg: number; p50: number; p95: number; p99: number }> {
    const labelFilter = labels
      ? Object.entries(labels)
          .map(([k, v]) => `AND blob2 LIKE '${k}=${v}%'`)
          .join(' ')
      : '';

    const sql = `
      SELECT
        AVG(double1) as avg,
        quantile(0.5, double1) as p50,
        quantile(0.95, double1) as p95,
        quantile(0.99, double1) as p99
      FROM analytics_engine
      WHERE timestamp >= '${from.toISOString()}'
        AND timestamp <= '${to.toISOString()}'
        AND index1 = '${metricName}'
        ${labelFilter}
    `;

    const result = await this.query(sql);
    const data = result.data?.[0] || {};

    return {
      avg: data.avg || 0,
      p50: data.p50 || 0,
      p95: data.p95 || 0,
      p99: data.p99 || 0,
    };
  }
}

// ─── Predefined Metrics ──────────────────────────────────────────────────────

/**
 * Predefined metric definitions for common infrastructure metrics.
 */
export const INFRASTRUCTURE_METRICS: MetricDefinition[] = [
  {
    name: 'http_requests_total',
    type: 'counter',
    description: 'Total HTTP requests',
    labels: ['service', 'method', 'path', 'status_code'],
  },
  {
    name: 'http_request_duration_seconds',
    type: 'histogram',
    description: 'HTTP request duration',
    labels: ['service', 'method', 'path'],
    unit: 'seconds',
  },
  {
    name: 'http_request_size_bytes',
    type: 'histogram',
    description: 'HTTP request size',
    labels: ['service', 'method', 'path'],
    unit: 'bytes',
  },
  {
    name: 'http_response_size_bytes',
    type: 'histogram',
    description: 'HTTP response size',
    labels: ['service', 'method', 'path'],
    unit: 'bytes',
  },
  {
    name: 'cache_hits_total',
    type: 'counter',
    description: 'Total cache hits',
    labels: ['service', 'cache_type'],
  },
  {
    name: 'cache_misses_total',
    type: 'counter',
    description: 'Total cache misses',
    labels: ['service', 'cache_type'],
  },
  {
    name: 'active_connections',
    type: 'gauge',
    description: 'Number of active connections',
    labels: ['service', 'protocol'],
  },
  {
    name: 'error_rate_percent',
    type: 'gauge',
    description: 'Error rate as percentage',
    labels: ['service', 'error_type'],
    unit: 'percent',
  },
];

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Create an AnalyticsEngineWriter from a Worker environment binding.
 */
export function createWriter(
  binding: AnalyticsEngineBinding,
  options?: { batchSize?: number; flushIntervalMs?: number }
): AnalyticsEngineWriter {
  return new AnalyticsEngineWriter(binding, options);
}

/**
 * Create an AnalyticsEngineQuerier for querying metrics.
 */
export function createQuerier(accountId: string, apiToken: string): AnalyticsEngineQuerier {
  return new AnalyticsEngineQuerier(accountId, apiToken);
}
