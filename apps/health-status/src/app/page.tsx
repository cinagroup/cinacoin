import OverallStatus from "@/components/OverallStatus";
import ServiceCard from "@/components/ServiceCard";
import StatusBar90Days from "@/components/StatusBar90Days";
import IncidentTimeline from "@/components/IncidentTimeline";

// Mock data
const services = [
  { name: "Blockchain Node", status: "operational" as const, uptime: "99.98%", description: "Core blockchain network nodes" },
  { name: "API Gateway", status: "operational" as const, uptime: "99.95%", description: "REST & WebSocket API endpoints" },
  { name: "Wallet Service", status: "degraded" as const, uptime: "99.80%", description: "Wallet creation & management" },
  { name: "Explorer Service", status: "operational" as const, uptime: "99.99%", description: "Block & transaction explorer" },
  { name: "Mining Pool", status: "operational" as const, uptime: "99.92%", description: "Mining pool coordination" },
  { name: "DNS / CDN", status: "operational" as const, uptime: "100%", description: "Domain resolution & content delivery" },
];

function generate90Days(): ("operational" | "degraded" | "outage" | "maintenance" | "none")[] {
  const days: ("operational" | "degraded" | "outage" | "maintenance" | "none")[] = [];
  for (let i = 0; i < 90; i++) {
    const rand = Math.random();
    if (rand < 0.85) days.push("operational");
    else if (rand < 0.92) days.push("degraded");
    else if (rand < 0.96) days.push("outage");
    else if (rand < 0.99) days.push("maintenance");
    else days.push("none");
  }
  return days;
}

const incidents = [
  {
    id: "inc-001",
    title: "Elevated API latency",
    status: "resolved" as const,
    severity: "minor" as const,
    date: "June 7, 2026",
    updates: [
      { status: "resolved" as const, message: "API latency has returned to normal levels.", timestamp: "Jun 7, 18:30 UTC" },
      { status: "monitoring" as const, message: "We've scaled up API instances. Monitoring closely.", timestamp: "Jun 7, 17:15 UTC" },
      { status: "identified" as const, message: "Root cause identified: database connection pool exhaustion.", timestamp: "Jun 7, 16:45 UTC" },
      { status: "investigating" as const, message: "We're investigating increased API response times.", timestamp: "Jun 7, 16:00 UTC" },
    ],
  },
  {
    id: "inc-002",
    title: "Wallet service intermittent failures",
    status: "monitoring" as const,
    severity: "major" as const,
    date: "June 5, 2026",
    updates: [
      { status: "monitoring" as const, message: "Fix deployed. Monitoring for recurrence over next 24h.", timestamp: "Jun 5, 22:00 UTC" },
      { status: "identified" as const, message: "Issue traced to a memory leak in wallet signing module.", timestamp: "Jun 5, 20:30 UTC" },
      { status: "investigating" as const, message: "Users reporting failed transaction signing.", timestamp: "Jun 5, 19:00 UTC" },
    ],
  },
  {
    id: "inc-003",
    title: "Scheduled maintenance - Node upgrade v3.2.0",
    status: "resolved" as const,
    severity: "minor" as const,
    date: "June 1, 2026",
    updates: [
      { status: "resolved" as const, message: "All nodes successfully upgraded to v3.2.0.", timestamp: "Jun 1, 06:00 UTC" },
      { status: "monitoring" as const, message: "Rolling upgrade in progress. 70% complete.", timestamp: "Jun 1, 04:30 UTC" },
      { status: "investigating" as const, message: "Beginning scheduled maintenance window.", timestamp: "Jun 1, 02:00 UTC" },
    ],
  },
];

export default function HealthStatusPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          CinaCoin Status
        </h1>
        <p className="mt-2 text-gray-400">
          Real-time system health and incident reports
        </p>
      </div>

      {/* Overall Status */}
      <OverallStatus status="partial-outage" />

      {/* Services */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Services</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <ServiceCard key={service.name} {...service} />
          ))}
        </div>
      </section>

      {/* 90-Day Status Bars */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">90-Day History</h2>
        <div className="space-y-4 rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          {services.map((service) => (
            <div key={service.name}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-gray-300">{service.name}</span>
                <span className="text-xs text-gray-500">{service.uptime}</span>
              </div>
              <StatusBar90Days days={generate90Days()} serviceName={service.name} />
            </div>
          ))}
        </div>
      </section>

      {/* Incident Timeline */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Recent Incidents</h2>
        <IncidentTimeline incidents={incidents} />
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
        <p>© 2026 CinaCoin. All rights reserved.</p>
        <p className="mt-1">Powered by CinaCoin Infrastructure</p>
      </footer>
    </div>
  );
}
