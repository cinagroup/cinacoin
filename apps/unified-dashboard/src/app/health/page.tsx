"use client";

import { useEffect, useState } from "react";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    name: string;
    status: "up" | "down" | "degraded";
    latency: number;
    uptime: number;
  }[];
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate health check data
    const mockHealth: HealthStatus = {
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

    setTimeout(() => {
      setHealth(mockHealth);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas-soft">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-body-color">Loading health status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-soft p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-display-sm text-ink">System Health</h1>
          <p className="text-body-color mt-1">Real-time service status</p>
        </header>

        <div className="bg-white rounded-lg shadow-sm border border-border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">Overall Status</h2>
              <p className="text-sm text-body-color mt-1">
                Last updated: {new Date(health?.timestamp || "").toLocaleString()}
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-full font-medium ${
                health?.status === "healthy"
                  ? "bg-green-100 text-green-700"
                  : health?.status === "degraded"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {health?.status?.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {health?.services.map((service) => (
            <div
              key={service.name}
              className="bg-white rounded-lg shadow-sm border border-border p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      service.status === "up"
                        ? "bg-green-500"
                        : service.status === "degraded"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  />
                  <div>
                    <h3 className="font-semibold text-ink">{service.name}</h3>
                    <p className="text-sm text-body-color">
                      Latency: {service.latency}ms
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-ink">
                    {service.uptime}%
                  </p>
                  <p className="text-xs text-body-color">Uptime</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
