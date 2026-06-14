/**
 * Alert Configuration for Cinacoin Cinacoin Relay.
 *
 * Defines alerting rules, thresholds, severity levels,
 * and notification channels for the relay infrastructure.
 *
 * These rules are consumed by the monitoring worker and
 * integrated with Cloudflare Logpush, Workers Analytics Engine,
 * and external alerting systems.
 */

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertChannel = 'slack' | 'email' | 'pagerduty';
export type AlertCondition =
  | { type: 'error_rate'; threshold: number; window: string }
  | { type: 'latency_p99'; threshold: number; window: string }
  | { type: 'connection_drop'; threshold: number; window: string }
  | { type: 'health_check_fail'; threshold: number; window: string }
  | { type: 'kv_latency_p99'; threshold: number; window: string }
  | { type: 'd1_error_rate'; threshold: number; window: string }
  | { type: 'rate_limit_blocks'; threshold: number; window: string };

export interface AlertRule {
  /** Unique alert identifier. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Description of what the alert monitors. */
  description: string;
  /** Severity level. */
  severity: AlertSeverity;
  /** Alert condition with threshold and time window. */
  condition: AlertCondition;
  /** Notification channels for this alert. */
  channels: AlertChannel[];
  /** Whether the alert is currently enabled. */
  enabled: boolean;
  /** Minimum interval between notifications (cooldown, in seconds). */
  cooldownSeconds: number;
  /** Tags for alert grouping and filtering. */
  tags: string[];
}

/** Complete set of alert rules. */
export const ALERT_RULES: AlertRule[] = [
  // ─── Worker Error Rate ─────────────────────────────────
  {
    id: 'worker-error-rate',
    name: 'Worker Error Rate > 1%',
    description: 'Alert when Cloudflare Worker error rate exceeds 1% of all requests over a 5-minute window.',
    severity: 'critical',
    condition: {
      type: 'error_rate',
      threshold: 0.01, // 1%
      window: '5m',
    },
    channels: ['slack', 'pagerduty'],
    enabled: true,
    cooldownSeconds: 300,
    tags: ['worker', 'errors', 'critical'],
  },

  // ─── Response Time P99 ────────────────────────────────
  {
    id: 'response-time-p99',
    name: 'Response Time P99 > 1s',
    description: 'Alert when the 99th percentile response time exceeds 1 second over a 5-minute window.',
    severity: 'warning',
    condition: {
      type: 'latency_p99',
      threshold: 1000, // ms
      window: '5m',
    },
    channels: ['slack', 'email'],
    enabled: true,
    cooldownSeconds: 600,
    tags: ['worker', 'latency', 'performance'],
  },

  // ─── Connection Count Drop ─────────────────────────────
  {
    id: 'connection-count-drop',
    name: 'Connection Count Drop > 50%',
    description: 'Alert when active WebSocket connections drop by more than 50% below the 1-hour baseline.',
    severity: 'critical',
    condition: {
      type: 'connection_drop',
      threshold: 0.5, // 50% drop
      window: '5m',
    },
    channels: ['slack', 'pagerduty', 'email'],
    enabled: true,
    cooldownSeconds: 300,
    tags: ['connections', 'availability', 'critical'],
  },

  // ─── Health Check Failures ─────────────────────────────
  {
    id: 'health-check-fail',
    name: 'Health Check Failures (3x)',
    description: 'Alert when health checks fail 3 consecutive times across any region.',
    severity: 'critical',
    condition: {
      type: 'health_check_fail',
      threshold: 3,
      window: '5m',
    },
    channels: ['slack', 'pagerduty', 'email'],
    enabled: true,
    cooldownSeconds: 120,
    tags: ['health', 'availability', 'critical'],
  },

  // ─── KV Store Latency ─────────────────────────────────
  {
    id: 'kv-latency-p99',
    name: 'KV Store Latency P99 > 200ms',
    description: 'Alert when KV namespace read latency exceeds 200ms at P99 over 5 minutes.',
    severity: 'warning',
    condition: {
      type: 'kv_latency_p99',
      threshold: 200, // ms
      window: '5m',
    },
    channels: ['slack'],
    enabled: true,
    cooldownSeconds: 600,
    tags: ['kv', 'latency', 'storage'],
  },

  // ─── D1 Query Errors ──────────────────────────────────
  {
    id: 'd1-error-rate',
    name: 'D1 Query Errors > 5/min',
    description: 'Alert when D1 database query errors exceed 5 per minute.',
    severity: 'warning',
    condition: {
      type: 'd1_error_rate',
      threshold: 5, // errors per minute
      window: '1m',
    },
    channels: ['slack'],
    enabled: true,
    cooldownSeconds: 300,
    tags: ['d1', 'database', 'errors'],
  },

  // ─── Rate Limit Blocks ────────────────────────────────
  {
    id: 'rate-limit-blocks',
    name: 'Rate Limit Blocks > 1000/min',
    description: 'Informational alert when rate limiting blocks more than 1000 requests per minute, indicating potential abuse or misconfiguration.',
    severity: 'info',
    condition: {
      type: 'rate_limit_blocks',
      threshold: 1000,
      window: '1m',
    },
    channels: ['slack'],
    enabled: true,
    cooldownSeconds: 900,
    tags: ['rate-limit', 'security', 'info'],
  },
];

/** Notification channel configurations. */
export interface NotificationChannel {
  type: AlertChannel;
  enabled: boolean;
}

export interface SlackConfig extends NotificationChannel {
  type: 'slack';
  webhookUrl: string;
  channel: string;
  username: string;
  iconEmoji: string;
}

export interface EmailConfig extends NotificationChannel {
  type: 'email';
  recipients: string[];
  from: string;
  subjectPrefix: string;
}

export interface PagerDutyConfig extends NotificationChannel {
  type: 'pagerduty';
  integrationKey: string;
  apiUrl: string;
  defaultServiceId: string;
}

/** Default notification configuration. */
export const NOTIFICATION_CONFIG = {
  slack: {
    type: 'slack' as const,
    enabled: true,
    webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
    channel: '#cinacoin-alerts',
    username: 'Cinacoin Relay Monitor',
    iconEmoji: ':warning:',
  } as SlackConfig,

  email: {
    type: 'email' as const,
    enabled: true,
    recipients: ['ops@cinacoin.com'],
    from: 'alerts@cinacoin.com',
    subjectPrefix: '[CINACOIN RELAY]',
  } as EmailConfig,

  pagerduty: {
    type: 'pagerduty' as const,
    enabled: true,
    integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY || '',
    apiUrl: 'https://events.pagerduty.com/v2/enqueue',
    defaultServiceId: 'cinacoin-wc-relay',
  } as PagerDutyConfig,
};

/** Helper to get enabled rules by severity. */
export function getRulesBySeverity(severity: AlertSeverity): AlertRule[] {
  return ALERT_RULES.filter((r) => r.enabled && r.severity === severity);
}

/** Helper to get all enabled rules. */
export function getEnabledRules(): AlertRule[] {
  return ALERT_RULES.filter((r) => r.enabled);
}

/** Helper to generate a human-readable alert message. */
export function formatAlertMessage(
  rule: AlertRule,
  region: string,
  currentValue: number,
  threshold: number,
  window: string,
): string {
  const severityEmoji: Record<AlertSeverity, string> = {
    critical: '🔴',
    warning: '🟡',
    info: '🔵',
  };

  const unitMap: Record<string, string> = {
    error_rate: '%',
    latency_p99: 'ms',
    connection_drop: '%',
    health_check_fail: 'failures',
    kv_latency_p99: 'ms',
    d1_error_rate: 'errors/min',
    rate_limit_blocks: 'blocks/min',
  };

  const unit = unitMap[rule.condition.type] || '';

  return `${severityEmoji[rule.severity]} *${rule.name}*

*Region:* ${region.toUpperCase()}
*Severity:* ${rule.severity}
*Current:* ${currentValue}${unit}
*Threshold:* ${threshold}${unit}
*Window:* ${window}
*Time:* ${new Date().toISOString()}`;
}
