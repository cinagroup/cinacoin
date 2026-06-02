/**
 * Monitoring Worker — Alert Evaluation & Dispatch
 *
 * Cloudflare Worker that periodically evaluates alert rules
 * against relay infrastructure metrics and dispatches
 * notifications when thresholds are exceeded.
 *
 * Integrates with:
 * - Cloudflare Workers Analytics Engine
 * - Cloudflare Logpush
 * - D1 metrics table
 *
 * Run as a cron trigger (every 1 minute).
 */

import { ALERT_RULES, getEnabledRules, AlertRule } from './alert-config.js';
import { dispatchAlert } from './alert-notifier.js';

// ============================================================
// Environment
// ============================================================

export interface Env {
  METRICS_DB: D1Database;
  SESSION_CACHE: KVNamespace;
  ANALYTICS: AnalyticsEngineDataset;
  REGIONS?: string;
}

// ============================================================
// Metric Evaluation
// ============================================================

interface MetricValue {
  value: number;
  timestamp: number;
}

/** Fetch a metric value from D1 or Analytics Engine. */
async function fetchMetric(
  env: Env,
  metricName: string,
  window: string,
  region: string,
): Promise<MetricValue | null> {
  try {
    // Parse window string (e.g., "5m" -> 300 seconds)
    const windowSeconds = parseWindow(window);
    const since = Math.floor(Date.now() / 1000) - windowSeconds;

    const query = `
      SELECT AVG(value) as avg_value, MAX(timestamp) as ts
      FROM metrics
      WHERE metric_name = ?
        AND region = ?
        AND timestamp >= ?
    `;

    const result = await env.METRICS_DB.prepare(query)
      .bind(metricName, region, since)
      .first<{ avg_value: number; ts: number }>();

    if (result?.avg_value !== undefined) {
      return { value: result.avg_value, timestamp: result.ts };
    }

    return null;
  } catch (err) {
    console.warn(`[Monitor] Failed to fetch metric ${metricName}:`, err);
    return null;
  }
}

/** Parse a window string to seconds. */
function parseWindow(window: string): number {
  const match = window.match(/^(\d+)([smh])$/);
  if (!match) return 300; // default 5 minutes

  const value = parseInt(match[1]);
  switch (match[2]) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    default: return 300;
  }
}

/** Map alert condition type to D1 metric name. */
function getMetricName(condition: AlertRule['condition']): string {
  switch (condition.type) {
    case 'error_rate': return 'worker_error_rate';
    case 'latency_p99': return 'worker_latency_p99';
    case 'connection_drop': return 'active_connections';
    case 'health_check_fail': return 'health_check_failures';
    case 'kv_latency_p99': return 'kv_latency_p99';
    case 'd1_error_rate': return 'd1_errors_per_min';
    case 'rate_limit_blocks': return 'rate_limit_blocks_per_min';
  }
}

// ============================================================
// Alert Evaluation
// ============================================================

interface AlertResult {
  ruleId: string;
  triggered: boolean;
  currentValue: number | null;
  threshold: number;
}

async function evaluateRule(
  env: Env,
  rule: AlertRule,
  region: string,
): Promise<AlertResult> {
  const metricName = getMetricName(rule.condition);
  const metric = await fetchMetric(env, metricName, rule.condition.window, region);

  if (!metric) {
    return {
      ruleId: rule.id,
      triggered: false,
      currentValue: null,
      threshold: rule.condition.threshold,
    };
  }

  let triggered = false;

  switch (rule.condition.type) {
    case 'error_rate':
      triggered = metric.value >= rule.condition.threshold;
      break;
    case 'latency_p99':
      triggered = metric.value >= rule.condition.threshold;
      break;
    case 'connection_drop':
      // Compare with baseline (last hour average)
      const baseline = await fetchMetric(env, metricName, '1h', region);
      if (baseline && baseline.value > 0) {
        const dropRatio = (baseline.value - metric.value) / baseline.value;
        triggered = dropRatio >= rule.condition.threshold;
      }
      break;
    case 'health_check_fail':
      triggered = metric.value >= rule.condition.threshold;
      break;
    case 'kv_latency_p99':
      triggered = metric.value >= rule.condition.threshold;
      break;
    case 'd1_error_rate':
      triggered = metric.value >= rule.condition.threshold;
      break;
    case 'rate_limit_blocks':
      triggered = metric.value >= rule.condition.threshold;
      break;
  }

  return {
    ruleId: rule.id,
    triggered,
    currentValue: metric.value,
    threshold: rule.condition.threshold,
  };
}

// ============================================================
// Health Check
// ============================================================

async function checkHealth(
  region: string,
): Promise<{ healthy: boolean; latency: number; details: string }> {
  const startTime = Date.now();
  const regions: Record<string, string> = {
    nam: 'https://cinacoin-wc-relay.workers.dev/health',
    eur: 'https://cinacoin-wc-relay-eu.workers.dev/health',
    apac: 'https://cinacoin-wc-relay-ap.workers.dev/health',
  };

  const url = regions[region] || regions.nam;

  try {
    const response = await fetch(url, {
      cf: { cacheTtl: 0 },
      headers: { 'User-Agent': 'Cinacoin-Monitor/1.0' },
    });

    const latency = Date.now() - startTime;
    const data = await response.json().catch(() => null);

    return {
      healthy: response.ok && data?.status === 'ok',
      latency,
      details: JSON.stringify(data),
    };
  } catch (err) {
    return {
      healthy: false,
      latency: Date.now() - startTime,
      details: String(err),
    };
  }
}

// ============================================================
// Main Scheduled Handler
// ============================================================

export default {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    const regions = (env.REGIONS || 'nam,eur,apac').split(',');
    const enabledRules = getEnabledRules();
    const results: Array<{ region: string; alerts: AlertResult[] }> = [];

    for (const region of regions) {
      const regionResults: AlertResult[] = [];

      // Evaluate each alert rule
      for (const rule of enabledRules) {
        const result = await evaluateRule(env, rule, region.trim());
        regionResults.push(result);

        // Dispatch alert if triggered
        if (result.triggered && result.currentValue !== null) {
          await dispatchAlert({
            rule,
            region: region.trim(),
            currentValue: result.currentValue,
            threshold: result.threshold,
            window: rule.condition.window,
          });
        }
      }

      results.push({ region, alerts: regionResults });

      // Run health checks
      const health = await checkHealth(region.trim());
      if (!health.healthy) {
        // Health check failure — trigger alert for all critical rules
        for (const rule of enabledRules.filter((r) => r.severity === 'critical')) {
          if (rule.condition.type === 'health_check_fail') {
            await dispatchAlert({
              rule,
              region: region.trim(),
              currentValue: 1,
              threshold: rule.condition.threshold,
              window: rule.condition.window,
              additionalDetails: {
                health_check: {
                  healthy: false,
                  latency: health.latency,
                  details: health.details,
                },
              },
            });
          }
        }
      }

      // Record health check metric
      try {
        await env.METRICS_DB.prepare(
          `INSERT INTO metrics (metric_name, region, value, tags)
           VALUES ('health_check_latency', ?, ?, ?)`,
        )
          .bind(
            region.trim(),
            health.latency,
            JSON.stringify({ healthy: health.healthy }),
          )
          .run();
      } catch {
        // Non-fatal — metric recording failure
      }
    }

    // Log summary
    const triggered = results.flatMap((r) =>
      r.alerts.filter((a) => a.triggered).map((a) => `${r.region}/${a.ruleId}`),
    );

    if (triggered.length > 0) {
      console.log(`[Monitor] ${triggered.length} alert(s) triggered:`, triggered.join(', '));
    }
  },

  // HTTP handler for manual trigger and status
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Manual trigger
    if (url.pathname === '/api/trigger' && request.method === 'POST') {
      ctx.waitUntil(
        (async () => {
          await (this as typeof import('./alert-monitoring-worker.js')).scheduled(
            { scheduledTime: Date.now(), cron: 'manual' },
            env,
            ctx,
          );
        })(),
      );
      return new Response(JSON.stringify({ status: 'triggered' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Status endpoint
    if (url.pathname === '/api/status') {
      return new Response(
        JSON.stringify({
          enabledRules: getEnabledRules().length,
          totalRules: ALERT_RULES.length,
          timestamp: Date.now(),
        }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not Found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  },
};
