/**
 * Cinacoin Monitoring — Main Cloudflare Worker
 *
 * Collects metrics from all 5 Workers (rpc-proxy, keys-server, relay-server,
 * notify-server, push-server), exposes health/metrics/dashboard/alerts
 * endpoints, and runs alert evaluation.
 *
 * Endpoints:
 *   GET /health     — Detailed status of all services
 *   GET /metrics    — Prometheus-format metrics
 *   GET /alerts     — Current alert state (JSON)
 *   GET /dashboard  — HTML dashboard
 *   POST /alerts/ack/:ruleId/:service — Acknowledge an alert
 *
 * Scheduled runs every 5 minutes via cron trigger to collect metrics
 * and evaluate alerts.
 */

import { AlertEvaluator, MetricSnapshot, AlertState, formatDiscordEmbed, sendDiscordAlert } from './alerts';
import { generateDashboard } from './dashboard';

// ---------------------------------------------------------------------------
// Service Configuration
// ---------------------------------------------------------------------------

interface ServiceDef {
  name: string;
  healthUrl: string;
  metricsUrl: string;
}

const SERVICES: ServiceDef[] = [
  {
    name: 'rpc-proxy',
    healthUrl: 'https://rpc.cinacoin.com/health',
    metricsUrl: 'https://rpc.cinacoin.com/metrics',
  },
  {
    name: 'keys-server',
    healthUrl: 'https://keys.cinacoin.com/health',
    metricsUrl: 'https://keys.cinacoin.com/metrics',
  },
  {
    name: 'relay-server',
    healthUrl: 'https://relay.cinacoin.com/health',
    metricsUrl: 'https://relay.cinacoin.com/metrics',
  },
  {
    name: 'notify-server',
    healthUrl: 'https://notify.cinacoin.com/health',
    metricsUrl: 'https://notify.cinacoin.com/metrics',
  },
  {
    name: 'push-server',
    healthUrl: 'https://push.cinacoin.com/health',
    metricsUrl: 'https://push.cinacoin.com/metrics',
  },
];

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

interface Env {
  MONITORING_KV: KVNamespace;
  MONITORING_DB?: D1Database;
  DISCORD_WEBHOOK_URL?: string;
  POLL_INTERVAL_SECONDS?: string;
  ALERT_COOLDOWN_SECONDS?: string;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceStatus {
  name: string;
  url: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  uptime: number;
  responseTime: number;
  errorRate: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  requestCount: number;
  lastChecked: string;
}

interface MonitoringState {
  services: ServiceStatus[];
  alerts: AlertState[];
  lastPoll: string;
  uptimeMs: number;
}

// ---------------------------------------------------------------------------
// Global State
// ---------------------------------------------------------------------------

let alertEvaluator: AlertEvaluator | null = null;
let latestState: MonitoringState | null = null;
let metricsHistory: Map<string, { timestamp: number; p95: number; errorRate: number }[]> = new Map();
const startTime = Date.now();

function getEvaluator(env: Env): AlertEvaluator {
  if (!alertEvaluator) {
    const cooldownSeconds = parseInt(env.ALERT_COOLDOWN_SECONDS || '300');
    alertEvaluator = new AlertEvaluator({
      cooldownSeconds,
      maxAlertsPerService: 10,
      discordWebhookUrl: env.DISCORD_WEBHOOK_URL || '',
    });
  }
  return alertEvaluator;
}

// ---------------------------------------------------------------------------
// Metrics Collection
// ---------------------------------------------------------------------------

/**
 * Probe a single service's health and metrics endpoints.
 */
async function probeService(svc: ServiceDef): Promise<ServiceStatus> {
  const startMs = Date.now();
  let alive = false;
  let serviceData: Record<string, unknown> = {};
  let metricsData: Record<string, unknown> = {};

  // Try health endpoint
  try {
    const healthRes = await fetch(svc.healthUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(30000),
    });
    if (healthRes.ok) {
      alive = true;
      serviceData = await healthRes.json<Record<string, unknown>>();
    }
  } catch {
    alive = false;
  }

  // Try metrics endpoint
  try {
    const metricsRes = await fetch(svc.metricsUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(30000),
    });
    if (metricsRes.ok) {
      metricsData = await metricsRes.json<Record<string, unknown>>();
    }
  } catch {
    // Metrics endpoint failure is non-fatal
  }

  const responseTime = Date.now() - startMs;

  // Extract metrics from responses
  const requestCount = (metricsData.request_count as number) ||
    (serviceData.request_count as number) || 0;
  const errorCount = (metricsData.error_count as number) ||
    (serviceData.error_count as number) || 0;
  const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;

  // Latency estimates (use response time as a proxy if not in metrics)
  const latencyP50 = (metricsData.latency_p50 as number) || responseTime * 0.7;
  const latencyP95 = (metricsData.latency_p95 as number) || responseTime * 1.5;
  const latencyP99 = (metricsData.latency_p99 as number) || responseTime * 2;

  // Uptime (milliseconds)
  const uptime = (serviceData.uptime_ms as number) ||
    (metricsData.uptime_ms as number) || 0;

  // Determine status
  let status: ServiceStatus['status'] = 'unknown';
  if (!alive) {
    status = 'down';
  } else if (errorRate > 5 || responseTime > 5000) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  return {
    name: svc.name,
    url: svc.healthUrl,
    status,
    uptime,
    responseTime,
    errorRate,
    latencyP50,
    latencyP95,
    latencyP99,
    requestCount,
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Probe all services concurrently.
 */
async function probeAllServices(): Promise<ServiceStatus[]> {
  const results = await Promise.allSettled(
    SERVICES.map(svc => probeService(svc))
  );

  return results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    // If probe itself throws, return a "down" status
    return {
      name: SERVICES[i].name,
      url: SERVICES[i].healthUrl,
      status: 'down' as const,
      uptime: 0,
      responseTime: 0,
      errorRate: 0,
      latencyP50: 0,
      latencyP95: 0,
      latencyP99: 0,
      requestCount: 0,
      lastChecked: new Date().toISOString(),
    };
  });
}

// ---------------------------------------------------------------------------
// Alert Evaluation
// ---------------------------------------------------------------------------

async function evaluateAlerts(
  services: ServiceStatus[],
  env: Env
): Promise<AlertState[]> {
  const evaluator = getEvaluator(env);
  const allNewAlerts: AlertState[] = [];

  for (const svc of services) {
    const snapshot: MetricSnapshot = {
      serviceName: svc.name,
      timestamp: Date.now(),
      requestCount: svc.requestCount,
      errorCount: Math.round(svc.errorRate * svc.requestCount / 100),
      errorRate: svc.errorRate,
      latencyP50: svc.latencyP50,
      latencyP95: svc.latencyP95,
      latencyP99: svc.latencyP99,
      uptime: svc.uptime,
      alive: svc.status !== 'down',
      responseTime: svc.responseTime,
    };

    const newAlerts = evaluator.evaluate(snapshot);
    allNewAlerts.push(...newAlerts);

    // Check for resolution: if a service is healthy now, resolve its alerts
    if (svc.status === 'healthy') {
      evaluator.resolveAlert('error-rate-critical', svc.name);
      evaluator.resolveAlert('latency-p95-warning', svc.name);
      evaluator.resolveAlert('worker-down-critical', svc.name);
      evaluator.resolveAlert('request-rate-drop-warning', svc.name);
    }

    // Send Discord alerts for new critical alerts
    const webhookUrl = env.DISCORD_WEBHOOK_URL || '';
    for (const alert of newAlerts) {
      if (webhookUrl && alert.severity === 'critical') {
        await sendDiscordAlert(webhookUrl, alert, alert.serviceName);
      }
    }

    // Track metrics history
    let history = metricsHistory.get(svc.name);
    if (!history) history = [];
    history.push({
      timestamp: Date.now(),
      p95: svc.latencyP95,
      errorRate: svc.errorRate,
    });
    // Keep last 60 samples (~5 hours at 5-min intervals)
    if (history.length > 60) history = history.slice(-60);
    metricsHistory.set(svc.name, history);
  }

  // Cleanup old resolved alerts
  evaluator.cleanup();

  return evaluator.getActiveAlerts();
}

// ---------------------------------------------------------------------------
// State Persistence (KV)
// ---------------------------------------------------------------------------

async function saveState(state: MonitoringState, env: Env): Promise<void> {
  try {
    await env.MONITORING_KV.put('latest_state', JSON.stringify(state), {
      expirationTtl: 3600, // 1 hour
    });
  } catch {
    // KV write failure is non-fatal
  }
}

async function loadState(env: Env): Promise<MonitoringState | null> {
  try {
    const raw = await env.MONITORING_KV.get('latest_state');
    if (raw) return JSON.parse(raw) as MonitoringState;
  } catch {
    // Ignore
  }
  return null;
}

// ---------------------------------------------------------------------------
// Cron Handler
// ---------------------------------------------------------------------------

async function runMonitoring(env: Env): Promise<MonitoringState> {
  const services = await probeAllServices();
  const alerts = await evaluateAlerts(services, env);

  const state: MonitoringState = {
    services,
    alerts,
    lastPoll: new Date().toISOString(),
    uptimeMs: Date.now() - startTime,
  };

  await saveState(state, env);
  latestState = state;
  return state;
}

// ---------------------------------------------------------------------------
// Response Helpers
// ---------------------------------------------------------------------------

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function htmlResponse(html: string): Response {
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function textResponse(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: { 'Content-Type': 'text/plain' },
  });
}

// ---------------------------------------------------------------------------
// /health Endpoint
// ---------------------------------------------------------------------------

function handleHealth(state: MonitoringState): Response {
  const downCount = state.services.filter(s => s.status === 'down').length;
  const degradedCount = state.services.filter(s => s.status === 'degraded').length;
  const overallStatus = downCount > 0 ? 'critical' : degradedCount > 0 ? 'degraded' : 'healthy';

  return jsonResponse({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime_ms: state.uptimeMs,
    last_poll: state.lastPoll,
    services_total: state.services.length,
    services_healthy: state.services.filter(s => s.status === 'healthy').length,
    services_degraded: degradedCount,
    services_down: downCount,
    active_alerts: state.alerts.length,
    services: state.services,
  });
}

// ---------------------------------------------------------------------------
// /metrics Endpoint (Prometheus Format)
// ---------------------------------------------------------------------------

function handleMetrics(state: MonitoringState): Response {
  const lines: string[] = [];

  lines.push('# HELP cinacoin_service_up Whether the service is reachable');
  lines.push('# TYPE cinacoin_service_up gauge');
  for (const svc of state.services) {
    const up = svc.status !== 'down' ? 1 : 0;
    lines.push(`cinacoin_service_up{service="${svc.name}"} ${up}`);
  }

  lines.push('');
  lines.push('# HELP cinacoin_service_response_time_ms Response time in milliseconds');
  lines.push('# TYPE cinacoin_service_response_time_ms gauge');
  for (const svc of state.services) {
    lines.push(`cinacoin_service_response_time_ms{service="${svc.name}"} ${svc.responseTime.toFixed(0)}`);
  }

  lines.push('');
  lines.push('# HELP cinacoin_service_error_rate Error rate as percentage');
  lines.push('# TYPE cinacoin_service_error_rate gauge');
  for (const svc of state.services) {
    lines.push(`cinacoin_service_error_rate{service="${svc.name}"} ${svc.errorRate.toFixed(2)}`);
  }

  lines.push('');
  lines.push('# HELP cinacoin_service_latency_p50_ms P50 latency in milliseconds');
  lines.push('# TYPE cinacoin_service_latency_p50_ms gauge');
  for (const svc of state.services) {
    lines.push(`cinacoin_service_latency_p50_ms{service="${svc.name}"} ${svc.latencyP50.toFixed(0)}`);
  }

  lines.push('');
  lines.push('# HELP cinacoin_service_latency_p95_ms P95 latency in milliseconds');
  lines.push('# TYPE cinacoin_service_latency_p95_ms gauge');
  for (const svc of state.services) {
    lines.push(`cinacoin_service_latency_p95_ms{service="${svc.name}"} ${svc.latencyP95.toFixed(0)}`);
  }

  lines.push('');
  lines.push('# HELP cinacoin_service_latency_p99_ms P99 latency in milliseconds');
  lines.push('# TYPE cinacoin_service_latency_p99_ms gauge');
  for (const svc of state.services) {
    lines.push(`cinacoin_service_latency_p99_ms{service="${svc.name}"} ${svc.latencyP99.toFixed(0)}`);
  }

  lines.push('');
  lines.push('# HELP cinacoin_service_request_count Total request count');
  lines.push('# TYPE cinacoin_service_request_count counter');
  for (const svc of state.services) {
    lines.push(`cinacoin_service_request_count{service="${svc.name}"} ${svc.requestCount}`);
  }

  lines.push('');
  lines.push('# HELP cinacoin_service_uptime_ms Service uptime in milliseconds');
  lines.push('# TYPE cinacoin_service_uptime_ms gauge');
  for (const svc of state.services) {
    lines.push(`cinacoin_service_uptime_ms{service="${svc.name}"} ${svc.uptime}`);
  }

  lines.push('');
  lines.push('# HELP cinacoin_monitoring_alerts Active alerts by severity');
  lines.push('# TYPE cinacoin_monitoring_alerts gauge');
  const criticalCount = state.alerts.filter(a => a.severity === 'critical').length;
  const warningCount = state.alerts.filter(a => a.severity === 'warning').length;
  lines.push(`cinacoin_monitoring_alerts{severity="critical"} ${criticalCount}`);
  lines.push(`cinacoin_monitoring_alerts{severity="warning"} ${warningCount}`);

  lines.push('');
  lines.push('# HELP cinacoin_monitoring_up Whether the monitoring worker is alive');
  lines.push('# TYPE cinacoin_monitoring_up gauge');
  lines.push(`cinacoin_monitoring_up 1`);

  lines.push('');
  lines.push('# HELP cinacoin_monitoring_last_poll_seconds Time since last poll in seconds');
  lines.push('# TYPE cinacoin_monitoring_last_poll_seconds gauge');
  const lastPollMs = new Date(state.lastPoll).getTime();
  const sincePoll = Math.floor((Date.now() - lastPollMs) / 1000);
  lines.push(`cinacoin_monitoring_last_poll_seconds ${sincePoll}`);

  return new Response(lines.join('\n') + '\n', {
    headers: { 'Content-Type': 'text/plain; version=0.0.4' },
  });
}

// ---------------------------------------------------------------------------
// /alerts Endpoint
// ---------------------------------------------------------------------------

function handleAlerts(state: MonitoringState): Response {
  const alertItems = state.alerts.map(a => ({
    ruleId: a.ruleId,
    serviceName: a.serviceName,
    severity: a.severity,
    message: a.message,
    triggeredAt: new Date(a.triggeredAt).toISOString(),
    lastNotifiedAt: new Date(a.lastNotifiedAt).toISOString(),
    acknowledged: a.acknowledged,
    resolvedAt: a.resolvedAt ? new Date(a.resolvedAt).toISOString() : undefined,
    value: a.value,
    threshold: a.threshold,
  }));

  return jsonResponse({
    total: alertItems.length,
    active: alertItems.filter(a => !a.resolvedAt).length,
    acknowledged: alertItems.filter(a => a.acknowledged).length,
    alerts: alertItems,
  });
}

// ---------------------------------------------------------------------------
// /dashboard Endpoint
// ---------------------------------------------------------------------------

function handleDashboard(state: MonitoringState): Response {
  const alertItems = state.alerts.map(a => ({
    ruleId: a.ruleId,
    serviceName: a.serviceName,
    severity: a.severity,
    message: a.message,
    triggeredAt: new Date(a.triggeredAt).toISOString(),
    resolvedAt: a.resolvedAt ? new Date(a.resolvedAt).toISOString() : undefined,
  }));

  const html = generateDashboard(state.services, alertItems);
  return htmlResponse(html);
}

// ---------------------------------------------------------------------------
// Main Fetch Handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Determine if we should use cached state or force a fresh poll
    const forcePoll = url.searchParams.get('refresh') === 'true';

    // Load or compute state
    let state = latestState;
    if (!state || forcePoll) {
      // Try KV first
      state = await loadState(env);
      // If no cached state, run monitoring
      if (!state) {
        state = await runMonitoring(env);
      } else {
        // Update in-memory reference
        latestState = state;
        // If state is stale (> 10 min), refresh in background
        const age = Date.now() - new Date(state.lastPoll).getTime();
        if (age > 10 * 60 * 1000) {
          ctx.waitUntil(runMonitoring(env));
        }
      }
    }

    // Route
    if (path === '/health') {
      return handleHealth(state);
    }

    if (path === '/metrics') {
      return handleMetrics(state);
    }

    if (path === '/alerts') {
      return handleAlerts(state);
    }

    if (path === '/dashboard') {
      return handleDashboard(state);
    }

    if (path.startsWith('/alerts/ack/')) {
      // POST /alerts/ack/:ruleId/:service
      if (request.method !== 'POST') {
        return textResponse('Method not allowed', 405);
      }
      const parts = path.split('/').filter(Boolean);
      if (parts.length >= 4) {
        const ruleId = parts[2];
        const serviceName = parts[3];
        const evaluator = getEvaluator(env);
        const ok = evaluator.acknowledgeAlert(ruleId, serviceName);
        return jsonResponse({ acknowledged: ok, ruleId, serviceName });
      }
      return textResponse('Invalid path', 400);
    }

    // Root — redirect to dashboard
    if (path === '/') {
      return Response.redirect(url.origin + '/dashboard', 302);
    }

    return jsonResponse({ error: 'Not found', paths: ['/health', '/metrics', '/alerts', '/dashboard'] }, 404);
  },

  // ---------------------------------------------------------------------------
  // Cron Handler (every 5 minutes)
  // ---------------------------------------------------------------------------

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await runMonitoring(env);
  },
};
