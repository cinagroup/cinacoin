"use client";

const services = [
  { name: "API Gateway", status: "operational", uptime: "99.98%", latency: "45ms" },
  { name: "Auth Service", status: "operational", uptime: "99.99%", latency: "32ms" },
  { name: "Transaction Engine", status: "operational", uptime: "99.95%", latency: "128ms" },
  { name: "WebSocket Server", status: "degraded", uptime: "99.80%", latency: "210ms" },
  { name: "Database Cluster", status: "operational", uptime: "99.99%", latency: "12ms" },
  { name: "Cache Layer", status: "operational", uptime: "100%", latency: "3ms" },
];

const statusColors: Record<string, string> = {
  operational: "bg-[var(--cc-success)]",
  degraded: "bg-[var(--cc-warning)]",
  down: "bg-[var(--cc-error)]",
};

export function SystemOverview() {
  return (
    <div className="cc-card" aria-label="System status overview">
      <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">
        System overview.
      </h3>
      <div className="space-y-3">
        {services.map((service) => (
          <div
            key={service.name}
            className="flex items-center justify-between py-2 border-b border-[var(--cc-hairline)] last:border-0"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full ${statusColors[service.status]}`}
              />
              <span className="cc-body-sm-strong text-[var(--cc-ink)]">
                {service.name}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="cc-caption text-[var(--cc-muted)]">{service.latency}</span>
              <span className="cc-caption font-medium text-[var(--cc-body)]">
                {service.uptime}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
