'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface Metric {
  timestamp: string;
  requestCount: number;
  avgResponseTime: number;
  errorCount: number;
  errorRate: number;
}

interface Alert {
  type: string;
  severity: string;
  message: string;
  timestamp: number;
}

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedService, setSelectedService] = useState('api-gateway');
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.cinacoin.com';

  useEffect(() => {
    fetch(`${API_BASE}/monitoring/metrics/${selectedService}?hours=24`)
      .then(res => res.json())
      .then(data => setMetrics(data.metrics || []))
      .catch(err => {
        logger.error('Failed to fetch metrics', err);
        setError(err.message);
      });
    
    fetch(`${API_BASE}/monitoring/alerts?limit=20`)
      .then(res => res.json())
      .then(data => setAlerts(data.alerts || []))
      .catch(err => {
        logger.error('Failed to fetch alerts', err);
        setError(err.message);
      });
  }, [selectedService]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-heading-1">Monitoring.</h1>
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          aria-label="Select service"
          className="px-4 py-2 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-lg"
        >
          <option value="api-gateway">API Gateway</option>
          <option value="auth-service">Auth Service</option>
          <option value="user-service">User Service</option>
        </select>
      </div>

      {/* 指标图表 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="cc-card p-6">
          <h3 className="text-body font-medium mb-2">Avg response time.</h3>
          <p className="text-heading-2 text-link">
            {metrics[metrics.length - 1]?.avgResponseTime || 0} ms
          </p>
        </div>
        <div className="cc-card p-6">
          <h3 className="text-body font-medium mb-2">Error rate.</h3>
          <p className="text-heading-2 text-link">
            {metrics[metrics.length - 1]?.errorRate || 0}%
          </p>
        </div>
        <div className="cc-card p-6">
          <h3 className="text-body font-medium mb-2">Total requests.</h3>
          <p className="text-heading-2 text-link">
            {metrics.reduce((sum, m) => sum + m.requestCount, 0)}
          </p>
        </div>
      </div>

      {/* 告警列表 */}
      <div className="cc-card p-6">
        <h2 className="text-heading-2 mb-4">Recent alerts.</h2>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <p className="text-[var(--cc-body)]">No alerts</p>
          ) : (
            alerts.map((alert) => (
              <div
                key={`${alert.timestamp}-${alert.message}`}
                className={`p-4 rounded-lg border ${
                  alert.severity === 'critical'
                    ? 'bg-error/10 border-error/20'
                    : 'bg-warning/10 border-warning/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-caption text-[var(--cc-muted)] mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-caption ${
                    alert.severity === 'critical'
                      ? 'bg-error text-[var(--color-on-primary)]'
                      : 'bg-warning text-[var(--color-ink)]'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
