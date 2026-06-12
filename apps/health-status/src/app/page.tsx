import OverallStatus from "@/components/OverallStatus";
import ServiceCard from "@/components/ServiceCard";
import StatusBar90Days from "@/components/StatusBar90Days";
import IncidentTimeline from "@/components/IncidentTimeline";

// Mock data
const services = [
  { name: "Blockchain Node", status: "operational" as const, uptime: "99.98%", description: "Core blockchain network nodes", responseTime: "124ms" },
  { name: "API Gateway", status: "operational" as const, uptime: "99.95%", description: "REST & WebSocket API endpoints", responseTime: "42ms" },
  { name: "Wallet Service", status: "degraded" as const, uptime: "99.80%", description: "Wallet creation & management", responseTime: "890ms" },
  { name: "Explorer Service", status: "operational" as const, uptime: "99.99%", description: "Block & transaction explorer", responseTime: "67ms" },
  { name: "Mining Pool", status: "operational" as const, uptime: "99.92%", description: "Mining pool coordination", responseTime: "203ms" },
  { name: "DNS / CDN", status: "operational" as const, uptime: "100%", description: "Domain resolution & content delivery", responseTime: "8ms" },
];

// Deterministic 90-day status pattern (seeded from service name)
function generate90Days(serviceName: string): ("operational" | "degraded" | "outage" | "maintenance" | "none")[] {
  let seed = 0;
  for (let i = 0; i < serviceName.length; i++) seed += serviceName.charCodeAt(i);
  const rand = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 49297 + 233280) * 49297;
    return x - Math.floor(x);
  };
  const days: ("operational" | "degraded" | "outage" | "maintenance" | "none")[] = [];
  for (let i = 0; i < 90; i++) {
    const r = rand(i);
    if (r < 0.88) days.push("operational");
    else if (r < 0.93) days.push("degraded");
    else if (r < 0.96) days.push("outage");
    else if (r < 0.99) days.push("maintenance");
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
      <header className="text-center">
        <p className="cc-caption-mono text-[var(--cc-muted)] mb-2" aria-label="Page section label">System status</p>
        <h1 className="cc-display-lg">
          CinaCoin status.
        </h1>
        <p className="mt-2 cc-body-sm text-[var(--cc-body)]">
          Real-time system health and incident reports.
        </p>
      </header>

      {/* Overall Status */}
      <OverallStatus status="partial-outage" />

      {/* Services */}
      <section aria-labelledby="services-heading">
        <p className="cc-caption-mono text-[var(--cc-muted)] mb-2">Monitored services</p>
        <h2 id="services-heading" className="mb-4 cc-body-lg font-semibold tracking-tight text-[var(--cc-ink)]">Services</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <ServiceCard key={service.name} {...service} />
          ))}
        </div>
      </section>

      {/* 90-Day Status Bars */}
      <section aria-labelledby="history-heading">
        <p className="cc-caption-mono text-[var(--cc-muted)] mb-2">Historical uptime</p>
        <h2 id="history-heading" className="mb-4 cc-body-lg font-semibold tracking-tight text-[var(--cc-ink)]">90-day history</h2>
        <div className="space-y-4 rounded-[8px] border border-[var(--cc-hairline)] bg-[var(--cc-canvas)] p-5" style={{ boxShadow: 'inset 0 0 0 1px var(--cc-hairline)' }}>
          {services.map((service, idx) => (
            <div key={service.name} className={idx > 0 ? 'pt-4 border-t border-[var(--cc-hairline)]' : ''}>
              <div className="mb-1 flex items-center justify-between">
                <span className="cc-body-sm text-[var(--cc-body)]">{service.name}</span>
                <span className="font-mono text-[var(--cc-muted)]">{service.uptime}</span>
              </div>
              <StatusBar90Days days={generate90Days(service.name)} serviceName={service.name} />
            </div>
          ))}
        </div>
      </section>

      {/* Incident Timeline */}
      <section aria-labelledby="incidents-heading">
        <p className="cc-caption-mono text-[var(--cc-muted)] mb-2">Incident log</p>
        <h2 id="incidents-heading" className="mb-4 cc-body-lg font-semibold tracking-tight text-[var(--cc-ink)]">Recent incidents</h2>
        <IncidentTimeline incidents={incidents} />
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--cc-hairline)] pt-6 text-center cc-caption text-[var(--cc-muted)]">
        <p>&copy; 2026 CinaCoin. All rights reserved.</p>
        <p className="mt-1">
          Powered by <a href="https://cinacoin.com" className="hover:text-[var(--cc-ink)] transition-colors" aria-label="CinaCoin Infrastructure">CinaCoin Infrastructure</a>.
        </p>
      </footer>
    </div>
  );
}
