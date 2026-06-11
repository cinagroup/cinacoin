"use client";

import { useEffect, useState } from "react";

interface ServiceStatus {
  name: string;
  status: "up" | "down" | "degraded";
  latency: number;
  uptime: number;
}

interface HealthData {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: ServiceStatus[];
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockHealth: HealthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: [
        { name: "API Gateway", status: "up", latency: 45, uptime: 99.98 },
        { name: "Auth Service", status: "up", latency: 32, uptime: 99.99 },
        { name: "Transaction Engine", status: "up", latency: 128, uptime: 99.95 },
        { name: "WebSocket Server", status: "up", latency: 210, uptime: 99.80 },
        { name: "Database Cluster", status: "up", latency: 12, uptime: 99.99 },
        { name: "Cache Layer", status: "up", latency: 3, uptime: 100 },
      ],
    };

    const timeoutId = setTimeout(() => {
      setHealth(mockHealth);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cc-canvas-soft)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--cc-primary)] mx-auto" />
          <p className="mt-4 text-sm text-[var(--cc-body)]">Loading health status...</p>
        </div>
      </div>
    );
  }

  const statusColor = (s: string) => {
    if (s === "up" || s === "healthy") return "bg-[var(--cc-success, #22c55e)]";
    if (s === "degraded") return "bg-[var(--cc-warning, #eab308)]";
    return "bg-[var(--cc-error, #ef4444)]";
  };

  const statusBadge = (s: string) => {
    if (s === "healthy") return "bg-[var(--cc-success-bg, #f0fdf4)] text-[var(--cc-success, #16a34a)]";
    if (s === "degraded") return "bg-[var(--cc-warning-bg, #fefce8)] text-[var(--cc-warning, #ca8a04)]";
    return "bg-[var(--cc-error-bg, #fef2f2)] text-[var(--cc-error, #dc2626)]";
  };

  return (
    <div className="min-h-screen bg-[var(--cc-canvas-soft)]">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-8">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">MONITORING</p>
          <h1 className="text-[var(--cc-display-lg)] font-semibold text-[var(--cc-ink)]">
            System health.
          </h1>
          <p className="text-[var(--cc-body)] mt-1">
            Real-time service status and uptime metrics.
          </p>
        </header>

        {/* Overall status card */}
        <div className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] p-6 shadow-[var(--cc-level1)] mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs text-[var(--cc-muted)] mb-1">OVERALL STATUS</p>
              <p className="text-sm text-[var(--cc-body)]">
                Last updated: {new Date(health?.timestamp || "").toLocaleString()}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-[var(--cc-radius-pill-sm)] text-xs font-medium ${statusBadge(health?.status || "")}`}>
              {health?.status?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Services grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {health?.services.map((service) => (
            <div
              key={service.name}
              className="bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] p-5 shadow-[var(--cc-level1)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${statusColor(service.status)}`} />
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--cc-ink)]">{service.name}</h3>
                    <p className="text-xs text-[var(--cc-body)]">
                      Latency: {service.latency}ms
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[var(--cc-ink)]">
                    {service.uptime}%
                  </p>
                  <p className="text-xs text-[var(--cc-muted)]">Uptime</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
