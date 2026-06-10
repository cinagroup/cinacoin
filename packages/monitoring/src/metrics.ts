/**
 * Cinacoin Monitoring — Comprehensive Metrics Definitions
 *
 * Defines all metrics collected across the Cinacoin platform:
 * - Application metrics: HTTP requests, latency, error rates
 * - Business metrics: wallet connections, transactions, active users
 * - Infrastructure metrics: CPU, memory, disk, network
 * - Custom metrics: chain sync, node health, gas prices
 *
 * These metrics are exposed in Prometheus format via the /metrics endpoint
 * and consumed by Grafana dashboards and AlertManager rules.
 */

// ---------------------------------------------------------------------------
// Metric Types
// ---------------------------------------------------------------------------

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export interface MetricDefinition {
  name: string;
  type: MetricType;
  description: string;
  labels?: string[];
  unit?: string;
  buckets?: number[];
}

// ---------------------------------------------------------------------------
// Application Metrics
// ---------------------------------------------------------------------------

export const APPLICATION_METRICS: MetricDefinition[] = [
  // HTTP Request Metrics
  {
    name: 'cinacoin_http_requests_total',
    type: 'counter',
    description: 'Total number of HTTP requests',
    labels: ['service', 'method', 'path', 'status_code'],
  },
  {
    name: 'cinacoin_http_request_duration_seconds',
    type: 'histogram',
    description: 'HTTP request duration in seconds',
    labels: ['service', 'method', 'path'],
    unit: 'seconds',
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  },
  {
    name: 'cinacoin_http_request_size_bytes',
    type: 'histogram',
    description: 'HTTP request size in bytes',
    labels: ['service', 'method', 'path'],
    unit: 'bytes',
    buckets: [100, 1000, 10000, 100000, 1000000, 10000000],
  },
  {
    name: 'cinacoin_http_response_size_bytes',
    type: 'histogram',
    description: 'HTTP response size in bytes',
    labels: ['service', 'method', 'path'],
    unit: 'bytes',
    buckets: [100, 1000, 10000, 100000, 1000000, 10000000],
  },
  {
    name: 'cinacoin_http_requests_in_flight',
    type: 'gauge',
    description: 'Number of HTTP requests currently being processed',
    labels: ['service'],
  },
  {
    name: 'cinacoin_http_errors_total',
    type: 'counter',
    description: 'Total number of HTTP errors (4xx and 5xx)',
    labels: ['service', 'status_code', 'error_type'],
  },

  // Latency Metrics
  {
    name: 'cinacoin_latency_p50_ms',
    type: 'gauge',
    description: '50th percentile latency in milliseconds',
    labels: ['service'],
    unit: 'milliseconds',
  },
  {
    name: 'cinacoin_latency_p95_ms',
    type: 'gauge',
    description: '95th percentile latency in milliseconds',
    labels: ['service'],
    unit: 'milliseconds',
  },
  {
    name: 'cinacoin_latency_p99_ms',
    type: 'gauge',
    description: '99th percentile latency in milliseconds',
    labels: ['service'],
    unit: 'milliseconds',
  },

  // Error Rate Metrics
  {
    name: 'cinacoin_error_rate_percent',
    type: 'gauge',
    description: 'Error rate as percentage',
    labels: ['service', 'error_type'],
    unit: 'percent',
  },
  {
    name: 'cinacoin_5xx_errors_total',
    type: 'counter',
    description: 'Total number of 5xx server errors',
    labels: ['service'],
  },
  {
    name: 'cinacoin_4xx_errors_total',
    type: 'counter',
    description: 'Total number of 4xx client errors',
    labels: ['service'],
  },
];

// ---------------------------------------------------------------------------
// Business Metrics
// ---------------------------------------------------------------------------

export const BUSINESS_METRICS: MetricDefinition[] = [
  // Wallet Connection Metrics
  {
    name: 'cinacoin_wallet_connections_total',
    type: 'counter',
    description: 'Total number of wallet connections',
    labels: ['wallet_type', 'chain', 'region'],
  },
  {
    name: 'cinacoin_wallet_connections_active',
    type: 'gauge',
    description: 'Number of active wallet connections',
    labels: ['wallet_type', 'chain', 'region'],
  },
  {
    name: 'cinacoin_wallet_connection_duration_seconds',
    type: 'histogram',
    description: 'Wallet connection duration in seconds',
    labels: ['wallet_type', 'chain'],
    unit: 'seconds',
    buckets: [1, 5, 10, 30, 60, 300, 600, 1800, 3600],
  },
  {
    name: 'cinacoin_wallet_connection_errors_total',
    type: 'counter',
    description: 'Total number of wallet connection errors',
    labels: ['wallet_type', 'error_type'],
  },

  // Transaction Metrics
  {
    name: 'cinacoin_transactions_total',
    type: 'counter',
    description: 'Total number of transactions',
    labels: ['chain', 'tx_type', 'status'],
  },
  {
    name: 'cinacoin_transactions_value_eth',
    type: 'counter',
    description: 'Total transaction value in ETH',
    labels: ['chain', 'tx_type'],
    unit: 'ETH',
  },
  {
    name: 'cinacoin_transactions_gas_used',
    type: 'counter',
    description: 'Total gas used by transactions',
    labels: ['chain'],
    unit: 'gas',
  },
  {
    name: 'cinacoin_transactions_pending',
    type: 'gauge',
    description: 'Number of pending transactions',
    labels: ['chain'],
  },
  {
    name: 'cinacoin_transaction_confirmation_seconds',
    type: 'histogram',
    description: 'Transaction confirmation time in seconds',
    labels: ['chain'],
    unit: 'seconds',
    buckets: [1, 5, 10, 30, 60, 120, 300, 600],
  },

  // User Activity Metrics
  {
    name: 'cinacoin_active_users',
    type: 'gauge',
    description: 'Number of active users (unique wallets)',
    labels: ['time_window'],
  },
  {
    name: 'cinacoin_daily_active_users',
    type: 'gauge',
    description: 'Daily active users',
    labels: [],
  },
  {
    name: 'cinacoin_weekly_active_users',
    type: 'gauge',
    description: 'Weekly active users',
    labels: [],
  },
  {
    name: 'cinacoin_monthly_active_users',
    type: 'gauge',
    description: 'Monthly active users',
    labels: [],
  },
  {
    name: 'cinacoin_new_users_total',
    type: 'counter',
    description: 'Total number of new users',
    labels: ['chain'],
  },

  // SDK Usage Metrics
  {
    name: 'cinacoin_sdk_requests_total',
    type: 'counter',
    description: 'Total SDK requests',
    labels: ['sdk_version', 'method', 'status'],
  },
  {
    name: 'cinacoin_sdk_request_duration_seconds',
    type: 'histogram',
    description: 'SDK request duration in seconds',
    labels: ['sdk_version', 'method'],
    unit: 'seconds',
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  },
];

// ---------------------------------------------------------------------------
// Infrastructure Metrics
// ---------------------------------------------------------------------------

export const INFRASTRUCTURE_METRICS: MetricDefinition[] = [
  // CPU Metrics
  {
    name: 'cinacoin_cpu_usage_percent',
    type: 'gauge',
    description: 'CPU usage percentage',
    labels: ['instance', 'container'],
    unit: 'percent',
  },
  {
    name: 'cinacoin_cpu_usage_seconds_total',
    type: 'counter',
    description: 'Total CPU time consumed in seconds',
    labels: ['instance', 'container', 'mode'],
    unit: 'seconds',
  },
  {
    name: 'cinacoin_cpu_throttling_seconds_total',
    type: 'counter',
    description: 'Total CPU throttling time in seconds',
    labels: ['instance', 'container'],
    unit: 'seconds',
  },

  // Memory Metrics
  {
    name: 'cinacoin_memory_usage_bytes',
    type: 'gauge',
    description: 'Memory usage in bytes',
    labels: ['instance', 'container'],
    unit: 'bytes',
  },
  {
    name: 'cinacoin_memory_limit_bytes',
    type: 'gauge',
    description: 'Memory limit in bytes',
    labels: ['instance', 'container'],
    unit: 'bytes',
  },
  {
    name: 'cinacoin_memory_usage_percent',
    type: 'gauge',
    description: 'Memory usage percentage',
    labels: ['instance', 'container'],
    unit: 'percent',
  },
  {
    name: 'cinacoin_memory_rss_bytes',
    type: 'gauge',
    description: 'Resident set size in bytes',
    labels: ['instance', 'container'],
    unit: 'bytes',
  },
  {
    name: 'cinacoin_memory_cache_bytes',
    type: 'gauge',
    description: 'Page cache memory in bytes',
    labels: ['instance', 'container'],
    unit: 'bytes',
  },

  // Disk Metrics
  {
    name: 'cinacoin_disk_usage_bytes',
    type: 'gauge',
    description: 'Disk usage in bytes',
    labels: ['instance', 'device', 'mountpoint'],
    unit: 'bytes',
  },
  {
    name: 'cinacoin_disk_total_bytes',
    type: 'gauge',
    description: 'Total disk space in bytes',
    labels: ['instance', 'device', 'mountpoint'],
    unit: 'bytes',
  },
  {
    name: 'cinacoin_disk_usage_percent',
    type: 'gauge',
    description: 'Disk usage percentage',
    labels: ['instance', 'device', 'mountpoint'],
    unit: 'percent',
  },
  {
    name: 'cinacoin_disk_read_bytes_total',
    type: 'counter',
    description: 'Total bytes read from disk',
    labels: ['instance', 'device'],
    unit: 'bytes',
  },
  {
    name: 'cinacoin_disk_write_bytes_total',
    type: 'counter',
    description: 'Total bytes written to disk',
    labels: ['instance', 'device'],
    unit: 'bytes',
  },
  {
    name: 'cinacoin_disk_iops',
    type: 'gauge',
    description: 'Disk I/O operations per second',
    labels: ['instance', 'device', 'operation'],
    unit: 'ops/s',
  },

  // Network Metrics
  {
    name: 'cinacoin_network_receive_bytes_total',
    type: 'counter',
    description: 'Total bytes received over network',
    labels: ['instance', 'interface'],
    unit: 'bytes',
  },
  {
    name: 'cinacoin_network_transmit_bytes_total',
    type: 'counter',
    description: 'Total bytes transmitted over network',
    labels: ['instance', 'interface'],
    unit: 'bytes',
  },
  {
    name: 'cinacoin_network_receive_errors_total',
    type: 'counter',
    description: 'Total network receive errors',
    labels: ['instance', 'interface'],
  },
  {
    name: 'cinacoin_network_transmit_errors_total',
    type: 'counter',
    description: 'Total network transmit errors',
    labels: ['instance', 'interface'],
  },
  {
    name: 'cinacoin_network_bandwidth_bps',
    type: 'gauge',
    description: 'Network bandwidth in bits per second',
    labels: ['instance', 'interface', 'direction'],
    unit: 'bps',
  },
  {
    name: 'cinacoin_network_connections_active',
    type: 'gauge',
    description: 'Number of active network connections',
    labels: ['instance', 'protocol', 'state'],
  },

  // Kubernetes Metrics
  {
    name: 'cinacoin_pod_count',
    type: 'gauge',
    description: 'Number of pods by status',
    labels: ['namespace', 'deployment', 'status'],
  },
  {
    name: 'cinacoin_pod_restarts_total',
    type: 'counter',
    description: 'Total pod restarts',
    labels: ['namespace', 'pod'],
  },
  {
    name: 'cinacoin_pod_ready',
    type: 'gauge',
    description: 'Whether pod is ready (1) or not (0)',
    labels: ['namespace', 'pod'],
  },
];

// ---------------------------------------------------------------------------
// Custom Blockchain Metrics
// ---------------------------------------------------------------------------

export const BLOCKCHAIN_METRICS: MetricDefinition[] = [
  // Chain Sync Metrics
  {
    name: 'cinacoin_chain_sync_status',
    type: 'gauge',
    description: 'Chain sync status (1 = synced, 0 = syncing)',
    labels: ['chain', 'region'],
  },
  {
    name: 'cinacoin_chain_block_height',
    type: 'gauge',
    description: 'Current block height',
    labels: ['chain', 'region'],
  },
  {
    name: 'cinacoin_chain_sync_lag_blocks',
    type: 'gauge',
    description: 'Number of blocks behind the chain head',
    labels: ['chain', 'region'],
    unit: 'blocks',
  },
  {
    name: 'cinacoin_chain_sync_progress_percent',
    type: 'gauge',
    description: 'Sync progress percentage',
    labels: ['chain', 'region'],
    unit: 'percent',
  },

  // Node Health Metrics
  {
    name: 'cinacoin_node_peer_count',
    type: 'gauge',
    description: 'Number of P2P peers connected',
    labels: ['chain', 'region'],
  },
  {
    name: 'cinacoin_node_uptime_seconds',
    type: 'gauge',
    description: 'Node uptime in seconds',
    labels: ['chain', 'region', 'node_id'],
    unit: 'seconds',
  },
  {
    name: 'cinacoin_node_rpc_requests_total',
    type: 'counter',
    description: 'Total RPC requests to node',
    labels: ['chain', 'region', 'method'],
  },
  {
    name: 'cinacoin_node_rpc_errors_total',
    type: 'counter',
    description: 'Total RPC errors from node',
    labels: ['chain', 'region', 'method', 'error_type'],
  },
  {
    name: 'cinacoin_node_rpc_latency_seconds',
    type: 'histogram',
    description: 'Node RPC latency in seconds',
    labels: ['chain', 'region', 'method'],
    unit: 'seconds',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  },

  // Gas Price Metrics
  {
    name: 'cinacoin_gas_price_gwei',
    type: 'gauge',
    description: 'Current gas price in Gwei',
    labels: ['chain', 'priority'],
    unit: 'Gwei',
  },
  {
    name: 'cinacoin_gas_price_base_gwei',
    type: 'gauge',
    description: 'Base fee in Gwei',
    labels: ['chain'],
    unit: 'Gwei',
  },
  {
    name: 'cinacoin_gas_price_priority_gwei',
    type: 'gauge',
    description: 'Priority fee in Gwei',
    labels: ['chain', 'tier'],
    unit: 'Gwei',
  },
  {
    name: 'cinacoin_gas_used_per_block',
    type: 'gauge',
    description: 'Gas used in the latest block',
    labels: ['chain'],
    unit: 'gas',
  },
  {
    name: 'cinacoin_gas_limit_per_block',
    type: 'gauge',
    description: 'Gas limit of the latest block',
    labels: ['chain'],
    unit: 'gas',
  },

  // Mempool Metrics
  {
    name: 'cinacoin_mempool_size',
    type: 'gauge',
    description: 'Number of transactions in mempool',
    labels: ['chain'],
    unit: 'transactions',
  },
  {
    name: 'cinacoin_mempool_size_bytes',
    type: 'gauge',
    description: 'Mempool size in bytes',
    labels: ['chain'],
    unit: 'bytes',
  },

  // RPC Provider Metrics
  {
    name: 'cinacoin_rpc_provider_requests_total',
    type: 'counter',
    description: 'Total requests to RPC provider',
    labels: ['provider', 'method', 'status'],
  },
  {
    name: 'cinacoin_rpc_provider_latency_seconds',
    type: 'histogram',
    description: 'RPC provider latency in seconds',
    labels: ['provider', 'method'],
    unit: 'seconds',
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  },
  {
    name: 'cinacoin_rpc_provider_failover_total',
    type: 'counter',
    description: 'Total RPC provider failovers',
    labels: ['from_provider', 'to_provider'],
  },
  {
    name: 'cinacoin_rpc_cache_hit_total',
    type: 'counter',
    description: 'Total RPC cache hits',
    labels: ['provider', 'method'],
  },
  {
    name: 'cinacoin_rpc_cache_miss_total',
    type: 'counter',
    description: 'Total RPC cache misses',
    labels: ['provider', 'method'],
  },
];

// ---------------------------------------------------------------------------
// Relay Server Metrics
// ---------------------------------------------------------------------------

export const RELAY_METRICS: MetricDefinition[] = [
  {
    name: 'cinacoin_relay_messages_total',
    type: 'counter',
    description: 'Total relay messages processed',
    labels: ['region', 'message_type', 'status'],
  },
  {
    name: 'cinacoin_relay_message_duration_seconds',
    type: 'histogram',
    description: 'Relay message processing duration',
    labels: ['region', 'message_type'],
    unit: 'seconds',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  },
  {
    name: 'cinacoin_relay_active_connections',
    type: 'gauge',
    description: 'Number of active relay connections',
    labels: ['region'],
  },
  {
    name: 'cinacoin_relay_connections_total',
    type: 'counter',
    description: 'Total relay connections established',
    labels: ['region'],
  },
  {
    name: 'cinacoin_relay_bytes_transferred',
    type: 'counter',
    description: 'Total bytes transferred through relay',
    labels: ['region', 'direction'],
    unit: 'bytes',
  },
];

// ---------------------------------------------------------------------------
// Monitoring System Metrics
// ---------------------------------------------------------------------------

export const MONITORING_METRICS: MetricDefinition[] = [
  {
    name: 'cinacoin_monitoring_up',
    type: 'gauge',
    description: 'Whether the monitoring worker is alive',
    labels: [],
  },
  {
    name: 'cinacoin_monitoring_last_poll_seconds',
    type: 'gauge',
    description: 'Time since last poll in seconds',
    labels: [],
    unit: 'seconds',
  },
  {
    name: 'cinacoin_monitoring_alerts',
    type: 'gauge',
    description: 'Number of active alerts by severity',
    labels: ['severity'],
  },
  {
    name: 'cinacoin_service_up',
    type: 'gauge',
    description: 'Whether the service is reachable',
    labels: ['service'],
  },
  {
    name: 'cinacoin_service_response_time_ms',
    type: 'gauge',
    description: 'Service response time in milliseconds',
    labels: ['service'],
    unit: 'milliseconds',
  },
  {
    name: 'cinacoin_service_error_rate',
    type: 'gauge',
    description: 'Service error rate as percentage',
    labels: ['service'],
    unit: 'percent',
  },
  {
    name: 'cinacoin_service_request_count',
    type: 'counter',
    description: 'Total request count per service',
    labels: ['service'],
  },
  {
    name: 'cinacoin_service_uptime_ms',
    type: 'gauge',
    description: 'Service uptime in milliseconds',
    labels: ['service'],
    unit: 'milliseconds',
  },
];

// ---------------------------------------------------------------------------
// Metric Registry
// ---------------------------------------------------------------------------

export const ALL_METRICS: MetricDefinition[] = [
  ...APPLICATION_METRICS,
  ...BUSINESS_METRICS,
  ...INFRASTRUCTURE_METRICS,
  ...BLOCKCHAIN_METRICS,
  ...RELAY_METRICS,
  ...MONITORING_METRICS,
];

/**
 * Get metric definition by name.
 */
export function getMetricDefinition(name: string): MetricDefinition | undefined {
  return ALL_METRICS.find(m => m.name === name);
}

/**
 * Get all metrics by category.
 */
export function getMetricsByCategory(category: 'application' | 'business' | 'infrastructure' | 'blockchain' | 'relay' | 'monitoring'): MetricDefinition[] {
  switch (category) {
    case 'application':
      return APPLICATION_METRICS;
    case 'business':
      return BUSINESS_METRICS;
    case 'infrastructure':
      return INFRASTRUCTURE_METRICS;
    case 'blockchain':
      return BLOCKCHAIN_METRICS;
    case 'relay':
      return RELAY_METRICS;
    case 'monitoring':
      return MONITORING_METRICS;
    default:
      return [];
  }
}

/**
 * Format metrics in Prometheus exposition format.
 */
export function formatPrometheusMetrics(metrics: Map<string, { value: number; labels?: Record<string, string> }>): string {
  const lines: string[] = [];

  for (const [metricName, data] of metrics) {
    const definition = getMetricDefinition(metricName);
    if (!definition) continue;

    lines.push(`# HELP ${definition.name} ${definition.description}`);
    lines.push(`# TYPE ${definition.name} ${definition.type}`);

    const labelString = data.labels
      ? `{${Object.entries(data.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
      : '';

    lines.push(`${definition.name}${labelString} ${data.value}`);
    lines.push('');
  }

  return lines.join('\n');
}
