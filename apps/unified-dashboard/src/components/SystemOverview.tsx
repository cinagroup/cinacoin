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
  operational: "bg-green-500",
  degraded: "bg-yellow-500",
  down: "bg-red-500",
};

export function SystemOverview() {
  return (
    <div className="card">
      <h3 className="text-[16px] font-semibold text-ink mb-4">
        System Overview
      </h3>
      <div className="space-y-3">
        {services.map((service) => (
          <div
            key={service.name}
            className="flex items-center justify-between py-2 border-b border-hairline last:border-0"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full ${statusColors[service.status]}`}
              />
              <span className="text-sm font-medium text-ink">
                {service.name}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-mute">{service.latency}</span>
              <span className="text-xs font-medium text-body-color">
                {service.uptime}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
