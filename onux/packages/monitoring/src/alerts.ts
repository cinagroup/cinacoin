/**
 * Cinacoin Monitoring — Alert Rules Engine
 *
 * Evaluates service metrics against threshold rules and manages alert state
 * with cooldown and deduplication.
 *
 * Rules:
 *   - Error rate > 5% in 5 minutes → Critical
 *   - Latency P95 > 2s in 5 minutes → Warning
 *   - Worker down (no response in 30s) → Critical
 *   - Request rate drop > 50% in 5 minutes → Warning
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Severity = 'critical' | 'warning' | 'info';

export interface AlertRule {
  id: string;
  name: string;
  severity: Severity;
  description: string;
}

export interface AlertState {
  ruleId: string;
  serviceName: string;
  severity: Severity;
  message: string;
  triggeredAt: number;
  lastNotifiedAt: number;
  acknowledged: boolean;
  resolvedAt?: number;
  value?: number;
  threshold?: number;
}

export interface AlertConfig {
  cooldownSeconds: number;
  maxAlertsPerService: number;
  discordWebhookUrl: string;
}

export interface MetricSnapshot {
  serviceName: string;
  timestamp: number;
  requestCount: number;
  errorCount: number;
  errorRate: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  uptime: number;
  alive: boolean;
  responseTime: number;
}

export interface RateHistory {
  serviceName: string;
  samples: { timestamp: number; requests: number }[];
}

// ---------------------------------------------------------------------------
// Alert Rules
// ---------------------------------------------------------------------------

export const ALERT_RULES: AlertRule[] = [
  {
    id: 'error-rate-critical',
    name: 'High Error Rate',
    severity: 'critical',
    description: 'Error rate exceeds 5% over a 5-minute window',
  },
  {
    id: 'latency-p95-warning',
    name: 'High Latency P95',
    severity: 'warning',
    description: 'P95 latency exceeds 2 seconds over a 5-minute window',
  },
  {
    id: 'worker-down-critical',
    name: 'Worker Unreachable',
    severity: 'critical',
    description: 'Worker did not respond within 30 seconds',
  },
  {
    id: 'request-rate-drop-warning',
    name: 'Request Rate Drop',
    severity: 'warning',
    description: 'Request rate dropped by more than 50% over a 5-minute window',
  },
];

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

const ERROR_RATE_CRITICAL_THRESHOLD = 5; // percent
const LATENCY_P95_WARNING_THRESHOLD = 2000; // ms
const WORKER_DOWN_TIMEOUT = 30; // seconds
const REQUEST_RATE_DROP_THRESHOLD = 50; // percent
const METRICS_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Alert Evaluator
// ---------------------------------------------------------------------------

export class AlertEvaluator {
  private activeAlerts: Map<string, AlertState> = new Map();
  private rateHistories: Map<string, RateHistory> = new Map();
  private config: AlertConfig;

  constructor(config: AlertConfig) {
    this.config = config;
  }

  /**
   * Evaluate all alert rules for a given metric snapshot.
   * Returns any new or re-triggered alerts.
   */
  evaluate(snapshot: MetricSnapshot): AlertState[] {
    const newAlerts: AlertState[] = [];

    // Rule 1: Error rate > 5% → Critical
    if (snapshot.errorRate > ERROR_RATE_CRITICAL_THRESHOLD) {
      const alert = this.maybeTriggerAlert({
        ruleId: 'error-rate-critical',
        serviceName: snapshot.serviceName,
        severity: 'critical',
        message: `Error rate ${snapshot.errorRate.toFixed(2)}% exceeds threshold of ${ERROR_RATE_CRITICAL_THRESHOLD}%`,
        value: snapshot.errorRate,
        threshold: ERROR_RATE_CRITICAL_THRESHOLD,
      });
      if (alert) newAlerts.push(alert);
    }

    // Rule 2: Latency P95 > 2s → Warning
    if (snapshot.latencyP95 > LATENCY_P95_WARNING_THRESHOLD) {
      const alert = this.maybeTriggerAlert({
        ruleId: 'latency-p95-warning',
        serviceName: snapshot.serviceName,
        severity: 'warning',
        message: `P95 latency ${snapshot.latencyP95.toFixed(0)}ms exceeds threshold of ${LATENCY_P95_WARNING_THRESHOLD}ms`,
        value: snapshot.latencyP95,
        threshold: LATENCY_P95_WARNING_THRESHOLD,
      });
      if (alert) newAlerts.push(alert);
    }

    // Rule 3: Worker down → Critical
    if (!snapshot.alive || snapshot.responseTime > WORKER_DOWN_TIMEOUT * 1000) {
      const alert = this.maybeTriggerAlert({
        ruleId: 'worker-down-critical',
        serviceName: snapshot.serviceName,
        severity: 'critical',
        message: `Worker unreachable (response time: ${snapshot.responseTime}ms, alive: ${snapshot.alive})`,
        value: snapshot.responseTime,
        threshold: WORKER_DOWN_TIMEOUT * 1000,
      });
      if (alert) newAlerts.push(alert);
    }

    // Rule 4: Request rate drop > 50% → Warning
    const rateDrop = this.checkRateDrop(snapshot);
    if (rateDrop) {
      const alert = this.maybeTriggerAlert({
        ruleId: 'request-rate-drop-warning',
        serviceName: snapshot.serviceName,
        severity: 'warning',
        message: `Request rate dropped ${rateDrop.toFixed(1)}% in 5-minute window`,
        value: rateDrop,
        threshold: REQUEST_RATE_DROP_THRESHOLD,
      });
      if (alert) newAlerts.push(alert);
    }

    // Update rate history
    this.updateRateHistory(snapshot);

    return newAlerts;
  }

  /**
   * Check if a new alert should be triggered, respecting cooldown and deduplication.
   */
  private maybeTriggerAlert(params: {
    ruleId: string;
    serviceName: string;
    severity: Severity;
    message: string;
    value?: number;
    threshold?: number;
  }): AlertState | null {
    const key = `${params.ruleId}:${params.serviceName}`;
    const now = Date.now();

    // Check for existing active alert with cooldown
    const existing = this.activeAlerts.get(key);
    if (existing && !existing.resolvedAt) {
      // Alert already active — check cooldown for re-notification
      if (now - existing.lastNotifiedAt < this.config.cooldownSeconds * 1000) {
        return null;
      }
      // Update last notified time
      existing.lastNotifiedAt = now;
      return existing;
    }

    // Resolve any previously resolved alert of the same key
    if (existing && existing.resolvedAt) {
      this.activeAlerts.delete(key);
    }

    // Create new alert
    const alert: AlertState = {
      ruleId: params.ruleId,
      serviceName: params.serviceName,
      severity: params.severity,
      message: params.message,
      triggeredAt: now,
      lastNotifiedAt: now,
      acknowledged: false,
      value: params.value,
      threshold: params.threshold,
    };

    this.activeAlerts.set(key, alert);
    return alert;
  }

  /**
   * Resolve an alert for a service/rule combination.
   */
  resolveAlert(ruleId: string, serviceName: string): void {
    const key = `${ruleId}:${serviceName}`;
    const existing = this.activeAlerts.get(key);
    if (existing && !existing.resolvedAt) {
      existing.resolvedAt = Date.now();
    }
  }

  /**
   * Check if request rate dropped more than threshold.
   * Compares current sample with the oldest sample within the metrics window.
   */
  private checkRateDrop(snapshot: MetricSnapshot): number | null {
    const history = this.rateHistories.get(snapshot.serviceName);
    if (!history || history.samples.length < 2) {
      return null;
    }

    const now = snapshot.timestamp;
    const windowStart = now - METRICS_WINDOW_MS;

    // Find samples within the window
    const recentSamples = history.samples.filter(s => s.timestamp >= windowStart);
    if (recentSamples.length < 2) {
      return null;
    }

    const oldest = recentSamples[0].requests;
    const latest = recentSamples[recentSamples.length - 1].requests;

    if (oldest === 0) return null;

    const drop = ((oldest - latest) / oldest) * 100;
    return drop > REQUEST_RATE_DROP_THRESHOLD ? drop : null;
  }

  /**
   * Update rate history for a service.
   */
  private updateRateHistory(snapshot: MetricSnapshot): void {
    let history = this.rateHistories.get(snapshot.serviceName);
    if (!history) {
      history = { serviceName: snapshot.serviceName, samples: [] };
      this.rateHistories.set(snapshot.serviceName, history);
    }

    history.samples.push({
      timestamp: snapshot.timestamp,
      requests: snapshot.requestCount,
    });

    // Keep only samples from the last 10 minutes to limit memory
    const cutoff = snapshot.timestamp - 10 * 60 * 1000;
    history.samples = history.samples.filter(s => s.timestamp >= cutoff);
  }

  /**
   * Get all active (unresolved) alerts.
   */
  getActiveAlerts(): AlertState[] {
    return Array.from(this.activeAlerts.values())
      .filter(a => !a.resolvedAt)
      .sort((a, b) => {
        const sevOrder = { critical: 0, warning: 1, info: 2 };
        return (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3);
      });
  }

  /**
   * Get all alerts (including resolved).
   */
  getAllAlerts(): AlertState[] {
    return Array.from(this.activeAlerts.values())
      .sort((a, b) => b.triggeredAt - a.triggeredAt);
  }

  /**
   * Acknowledge an alert.
   */
  acknowledgeAlert(ruleId: string, serviceName: string): boolean {
    const key = `${ruleId}:${serviceName}`;
    const alert = this.activeAlerts.get(key);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Clear resolved alerts older than 1 hour.
   */
  cleanup(): number {
    const oneHour = 60 * 60 * 1000;
    const now = Date.now();
    let cleared = 0;

    for (const [key, alert] of this.activeAlerts) {
      if (alert.resolvedAt && now - alert.resolvedAt > oneHour) {
        this.activeAlerts.delete(key);
        cleared++;
      }
    }

    return cleared;
  }
}

// ---------------------------------------------------------------------------
// Discord Webhook Integration
// ---------------------------------------------------------------------------

/**
 * Format an alert for Discord webhook.
 */
export function formatDiscordEmbed(alert: AlertState, serviceName: string): Record<string, unknown> {
  const color = alert.severity === 'critical' ? 0xFF0000 : 0xFFA500;
  const severityEmoji = alert.severity === 'critical' ? '🚨' : '⚠️';

  return {
    embeds: [{
      title: `${severityEmoji} ${alert.severity.toUpperCase()}: ${ALERT_RULES.find(r => r.id === alert.ruleId)?.name ?? alert.ruleId}`,
      description: alert.message,
      color,
      fields: [
        { name: 'Service', value: `\`${serviceName}\``, inline: true },
        { name: 'Severity', value: alert.severity, inline: true },
        { name: 'Triggered', value: new Date(alert.triggeredAt).toISOString(), inline: true },
        ...(alert.value !== undefined ? [{ name: 'Value', value: String(alert.value), inline: true }] : []),
        ...(alert.threshold !== undefined ? [{ name: 'Threshold', value: String(alert.threshold), inline: true }] : []),
      ],
      footer: { text: 'Cinacoin Monitoring' },
      timestamp: new Date(alert.triggeredAt).toISOString(),
    }],
  };
}

/**
 * Send an alert to Discord via webhook.
 */
export async function sendDiscordAlert(
  webhookUrl: string,
  alert: AlertState,
  serviceName: string
): Promise<boolean> {
  if (!webhookUrl) return false;

  try {
    const payload = formatDiscordEmbed(alert, serviceName);
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}
