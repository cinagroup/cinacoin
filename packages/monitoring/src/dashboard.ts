/**
 * Cinacoin Monitoring — HTML Dashboard
 *
 * Generates a self-contained HTML page with real-time service status,
 * latency charts, error rate charts, uptime, and alert history.
 *
 * Uses inline CSS and vanilla JS for zero dependencies.
 * Polls /health every 30 seconds for live updates.
 */

// ---------------------------------------------------------------------------
// Types (shared with index.ts)
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

interface AlertItem {
  ruleId: string;
  serviceName: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  triggeredAt: string;
  resolvedAt?: string;
}

// ---------------------------------------------------------------------------
// Dashboard HTML Generator
// ---------------------------------------------------------------------------

export function generateDashboard(
  services: ServiceStatus[],
  alerts: AlertItem[]
): string {
  const totalServices = services.length;
  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const downCount = services.filter(s => s.status === 'down').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.resolvedAt).length;

  const now = new Date().toISOString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cinacoin Monitoring Dashboard</title>
  <style>
    :root {
      --bg: #0f172a;
      --surface: #1e293b;
      --surface-hover: #334155;
      --border: #334155;
      --text: #e2e8f0;
      --text-muted: #94a3b8;
      --green: #22c55e;
      --yellow: #eab308;
      --red: #ef4444;
      --blue: #3b82f6;
      --orange: #f97316;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 600;
    }
    .header .badge {
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 999px;
      font-weight: 600;
    }
    .badge-healthy { background: rgba(34,197,94,0.15); color: var(--green); }
    .badge-degraded { background: rgba(234,179,8,0.15); color: var(--yellow); }
    .badge-down { background: rgba(239,68,68,0.15); color: var(--red); }
    .last-updated {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 24px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .summary-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .summary-card .value {
      font-size: 36px;
      font-weight: 600;
    }
    .summary-card .label {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .service-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .service-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .service-card:hover { border-color: var(--blue); }
    .service-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }
    .service-name { font-weight: 600; font-size: 15px; }
    .service-url { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
    .status-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 8px;
    }
    .dot-healthy { background: var(--green); box-shadow: 0 0 8px var(--green); }
    .dot-degraded { background: var(--yellow); box-shadow: 0 0 8px var(--yellow); }
    .dot-down { background: var(--red); box-shadow: 0 0 8px var(--red); }
    .dot-unknown { background: var(--text-muted); }
    .service-card-body { padding: 16px 20px; }
    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      font-size: 13px;
    }
    .metric-label { color: var(--text-muted); }
    .metric-value { font-weight: 600; font-variant-numeric: tabular-nums; }
    .latency-bar {
      height: 6px;
      border-radius: 3px;
      background: var(--surface-hover);
      margin-top: 8px;
      overflow: hidden;
    }
    .latency-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s;
    }
    .latency-good { background: var(--green); }
    .latency-warn { background: var(--yellow); }
    .latency-bad { background: var(--red); }
    .alert-table {
      width: 100%;
      border-collapse: collapse;
    }
    .alert-table th, .alert-table td {
      padding: 10px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border);
      font-size: 13px;
    }
    .alert-table th {
      color: var(--text-muted);
      font-weight: 500;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .severity-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .severity-critical { background: rgba(239,68,68,0.2); color: var(--red); }
    .severity-warning { background: rgba(249,115,22,0.2); color: var(--orange); }
    .severity-info { background: rgba(59,130,246,0.2); color: var(--blue); }
    .severity-resolved { background: rgba(34,197,94,0.15); color: var(--green); }
    .uptime-pct {
      font-size: 14px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    .chart-section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .chart-section h3 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .chart-bar-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .chart-bar-label {
      width: 140px;
      font-size: 12px;
      color: var(--text-muted);
      text-align: right;
      flex-shrink: 0;
    }
    .chart-bar-track {
      flex: 1;
      height: 20px;
      background: var(--bg);
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }
    .chart-bar-fill {
      height: 100%;
      border-radius: 4px;
      display: flex;
      align-items: center;
      padding-left: 8px;
      font-size: 11px;
      font-weight: 600;
      color: white;
      min-width: fit-content;
      transition: width 0.5s;
    }
    .chart-bar-value {
      width: 60px;
      font-size: 12px;
      font-weight: 600;
      text-align: right;
      flex-shrink: 0;
    }
    .alerts-section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }
    .alerts-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }
    .table-container {
      overflow-x: auto;
      max-height: 400px;
      overflow-y: auto;
    }
    @media (max-width: 640px) {
      body { padding: 12px; }
      .service-grid { grid-template-columns: 1fr; }
      .summary-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔢 Cinacoin Monitoring</h1>
    <span class="badge ${downCount > 0 ? 'badge-down' : criticalAlerts > 0 ? 'badge-degraded' : 'badge-healthy'}">
      ${downCount > 0 ? '⚠ SYSTEM ALERT' : criticalAlerts > 0 ? '⚠ DEGRADED' : '✓ ALL HEALTHY'}
    </span>
  </div>

  <div class="last-updated">Last updated: ${now} · Auto-refresh every 30s</div>

  <!-- Summary Cards -->
  <div class="summary-grid">
    <div class="summary-card">
      <div class="value" style="color: var(--green)">${healthyCount}/${totalServices}</div>
      <div class="label">Services Healthy</div>
    </div>
    <div class="summary-card">
      <div class="value" style="color: ${downCount > 0 ? 'var(--red)' : 'var(--green)'}">${downCount}</div>
      <div class="label">Services Down</div>
    </div>
    <div class="summary-card">
      <div class="value" style="color: ${criticalAlerts > 0 ? 'var(--red)' : 'var(--yellow)'}">${criticalAlerts}</div>
      <div class="label">Active Critical Alerts</div>
    </div>
    <div class="summary-card">
      <div class="value" style="color: var(--blue)">${alerts.filter(a => a.resolvedAt).length}</div>
      <div class="label">Resolved Alerts</div>
    </div>
  </div>

  <!-- Service Status Cards -->
  <div class="section-title">📊 Service Status</div>
  <div class="service-grid">
    ${services.map(s => {
      const dotClass = s.status === 'healthy' ? 'dot-healthy' :
        s.status === 'degraded' ? 'dot-degraded' :
        s.status === 'down' ? 'dot-down' : 'dot-unknown';

      const latencyColor = s.latencyP95 < 500 ? 'latency-good' :
        s.latencyP95 < 2000 ? 'latency-warn' : 'latency-bad';
      const latencyWidth = Math.min((s.latencyP95 / 5000) * 100, 100);

      const uptimePct = s.uptime > 0 ? (Math.min(s.uptime / (30 * 24 * 3600 * 1000) * 100, 100)).toFixed(2) : 'N/A';

      return `<div class="service-card">
        <div class="service-card-header">
          <div>
            <div class="service-name"><span class="status-dot ${dotClass}"></span>${s.name}</div>
            <div class="service-url">${s.url}</div>
          </div>
          <span class="badge ${s.status === 'healthy' ? 'badge-healthy' : s.status === 'down' ? 'badge-down' : 'badge-degraded'}">${s.status}</span>
        </div>
        <div class="service-card-body">
          <div class="metric-row">
            <span class="metric-label">Response Time</span>
            <span class="metric-value">${s.responseTime.toFixed(0)}ms</span>
          </div>
          <div class="latency-bar">
            <div class="latency-fill ${latencyColor}" style="width: ${latencyWidth}%"></div>
          </div>
          <div class="metric-row" style="margin-top: 8px;">
            <span class="metric-label">P50 Latency</span>
            <span class="metric-value">${s.latencyP50.toFixed(0)}ms</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">P95 Latency</span>
            <span class="metric-value">${s.latencyP95.toFixed(0)}ms</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">P99 Latency</span>
            <span class="metric-value">${s.latencyP99.toFixed(0)}ms</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Error Rate</span>
            <span class="metric-value" style="color: ${s.errorRate > 5 ? 'var(--red)' : s.errorRate > 1 ? 'var(--yellow)' : 'var(--green)'}">${s.errorRate.toFixed(2)}%</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Requests</span>
            <span class="metric-value">${s.requestCount.toLocaleString()}</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Uptime (30d est.)</span>
            <span class="uptime-pct" style="color: ${parseFloat(uptimePct) > 99.9 ? 'var(--green)' : parseFloat(uptimePct) > 99 ? 'var(--yellow)' : 'var(--red)'}">${uptimePct}%</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Last Checked</span>
            <span class="metric-value" style="font-size: 11px; color: var(--text-muted)">${s.lastChecked}</span>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>

  <!-- Latency Chart -->
  <div class="chart-section">
    <h3>⏱️ P95 Latency Comparison</h3>
    ${services.map(s => {
      const pct = Math.min((s.latencyP95 / 5000) * 100, 100);
      const color = s.latencyP95 < 500 ? 'var(--green)' : s.latencyP95 < 2000 ? 'var(--yellow)' : 'var(--red)';
      return `<div class="chart-bar-row">
        <div class="chart-bar-label">${s.name}</div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="width: ${Math.max(pct, 8)}%; background: ${color}">${s.latencyP95.toFixed(0)}ms</div>
        </div>
        <div class="chart-bar-value">${s.latencyP95.toFixed(0)}ms</div>
      </div>`;
    }).join('')}
  </div>

  <!-- Error Rate Chart -->
  <div class="chart-section">
    <h3>❌ Error Rate by Service</h3>
    ${services.map(s => {
      const pct = Math.min(s.errorRate * 10, 100); // Scale: 10% = 100% bar
      const color = s.errorRate < 1 ? 'var(--green)' : s.errorRate < 5 ? 'var(--yellow)' : 'var(--red)';
      return `<div class="chart-bar-row">
        <div class="chart-bar-label">${s.name}</div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="width: ${Math.max(pct, 2)}%; background: ${color}">${s.errorRate.toFixed(2)}%</div>
        </div>
        <div class="chart-bar-value">${s.errorRate.toFixed(2)}%</div>
      </div>`;
    }).join('')}
  </div>

  <!-- Alert History -->
  <div class="section-title">🔔 Alert History</div>
  <div class="alerts-section">
    ${alerts.length === 0 ? '<div style="padding: 24px; text-align: center; color: var(--text-muted);">No alerts recorded</div>' : `
    <div class="table-container">
      <table class="alert-table">
        <thead>
          <tr>
            <th>Severity</th>
            <th>Service</th>
            <th>Message</th>
            <th>Triggered</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${alerts.slice(0, 50).map(a => {
            const sevClass = a.resolvedAt ? 'severity-resolved' :
              a.severity === 'critical' ? 'severity-critical' :
              a.severity === 'warning' ? 'severity-warning' : 'severity-info';
            const sevLabel = a.resolvedAt ? 'resolved' : a.severity;
            return `<tr>
              <td><span class="severity-badge ${sevClass}">${sevLabel}</span></td>
              <td>${a.serviceName}</td>
              <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${a.message}</td>
              <td style="white-space: nowrap;">${a.triggeredAt}</td>
              <td>${a.resolvedAt ? 'Resolved' : 'Active'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`}
  </div>

  <div style="margin-top: 32px; text-align: center; color: var(--text-muted); font-size: 12px;">
    Cinacoin Monitoring Dashboard · Generated at ${now} · Auto-refresh enabled
  </div>

  <script>
    // Auto-refresh every 30 seconds
    setTimeout(() => location.reload(), 30000);
  </script>
</body>
</html>`;
}
