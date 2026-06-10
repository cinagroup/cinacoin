"use client";

const services = [
  { name: "Compute Engine", status: "operational", uptime: "99.99%", icon: "🖥️" },
  { name: "Object Storage", status: "operational", uptime: "99.98%", icon: "💾" },
  { name: "Load Balancer", status: "operational", uptime: "99.97%", icon: "⚖️" },
  { name: "Database Service", status: "degraded", uptime: "99.85%", icon: "🗄️" },
  { name: "CDN", status: "operational", uptime: "99.99%", icon: "🚀" },
  { name: "DNS", status: "operational", uptime: "100%", icon: "🌐" },
];

export default function ServiceStatus() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {services.map((service, index) => (
        <div
          key={index}
          className="resource-card"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-display-sm">{service.icon}</span>
            <span
              className={`status-dot ${
                service.status === "operational"
                  ? "status-running"
                  : service.status === "degraded"
                  ? "status-warning"
                  : "status-error"
              }`}
            />
          </div>
          <h3 className="text-body-sm font-medium text-ink truncate">{service.name}</h3>
          <p className="text-caption text-mute mt-1">Uptime: {service.uptime}</p>
        </div>
      ))}
    </div>
  );
}
