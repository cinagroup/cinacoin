"use client";

import { Monitor, HardDrive, Scale, Database, Rocket, Globe } from "lucide-react";

const services = [
  { name: "Compute Engine", status: "operational", uptime: "99.99%", icon: Monitor },
  { name: "Object Storage", status: "operational", uptime: "99.98%", icon: HardDrive },
  { name: "Load Balancer", status: "operational", uptime: "99.97%", icon: Scale },
  { name: "Database service.", status: "degraded", uptime: "99.85%", icon: Database },
  { name: "CDN", status: "operational", uptime: "99.99%", icon: Rocket },
  { name: "DNS", status: "operational", uptime: "100%", icon: Globe },
];

export default function ServiceStatus() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {services.map((service) => {
        const Icon = service.icon;
        return (
          <div
            key={service.name}
            className="resource-card"
            role="status"
            aria-label={`${service.name}: ${service.status}`}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className="w-5 h-5 text-[var(--cc-ink)]" aria-hidden="true" />
              <span
                className={`status-dot ${
                  service.status === "operational"
                    ? "status-running"
                    : service.status === "degraded"
                    ? "status-warning"
                    : "status-error"
                }`}
                aria-hidden="true"
              />
            </div>
            <h3 className="cc-body-sm-strong text-[var(--cc-ink)] truncate">{service.name}</h3>
            <p className="cc-caption text-[var(--cc-muted)] mt-1">Uptime: {service.uptime}</p>
          </div>
        );
      })}
    </div>
  );
}
