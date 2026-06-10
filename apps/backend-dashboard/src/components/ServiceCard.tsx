import { HealthCheck, ServiceDefinition } from "@/lib/services";
import { statusColor, formatLatency } from "@/lib/utils";

interface ServiceCardProps {
  service: ServiceDefinition;
  health: HealthCheck;
  demoMode?: boolean;
}

function statusBadgeBg(status: string): string {
  switch (status) {
    case "healthy":
      return "bg-[var(--cc-success)]/10 border-[var(--cc-success)]/20";
    case "degraded":
      return "bg-[var(--cc-warning)]/10 border-[var(--cc-warning)]/20";
    case "down":
      return "bg-[var(--cc-error)]/10 border-[var(--cc-error)]/20";
    default:
      return "bg-[var(--cc-muted)]/10 border-[var(--cc-muted)]/20";
  }
}

function statusDotColor(status: string): string {
  switch (status) {
    case "healthy":
      return "bg-[var(--cc-success)]";
    case "degraded":
      return "bg-[var(--cc-warning)]";
    case "down":
      return "bg-[var(--cc-error)] animate-pulse";
    default:
      return "bg-[var(--cc-muted)]";
  }
}

export default function ServiceCard({ service, health, demoMode = false }: ServiceCardProps) {
  const isDown = health.status === "down";
  const isDegraded = health.status === "degraded";

  return (
    <div className="cc-card relative transition-shadow duration-200 hover:shadow-[var(--cc-level3)] hover:-translate-y-0.5">
      {/* Status indicator - top right */}
      <div className="absolute top-3 right-3">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[12px] font-medium cc-badge ${statusBadgeBg(health.status)}`}>
          <span className={`inline-block w-2 h-2 rounded-full ${statusDotColor(health.status)}`} />
          <span className={statusColor(health.status)}>
            {health.status === "unknown" ? "Checking..." : health.status.charAt(0).toUpperCase() + health.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Service identity */}
      <div className="mb-4">
        <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-1">{service.name}</h3>
        <p className="cc-caption text-[var(--cc-muted)] leading-relaxed">{service.description}</p>
      </div>

      {/* Health details */}
      <div className="space-y-2">
        {health.latency !== null && health.latency >= 0 && (
          <div className="flex items-center justify-between">
            <span className="cc-caption text-[var(--cc-muted)]">Response Time</span>
            <span className={`cc-body-sm-strong ${
              isDown ? "text-[var(--cc-error)]" :
              isDegraded ? "text-[var(--cc-warning)]" :
              health.latency > 500 ? "text-[var(--cc-warning)]" : "text-[var(--cc-ink)]"
            }`}>
              {formatLatency(health.latency)}
            </span>
          </div>
        )}

        {health.error && (
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-[var(--cc-error)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span className="cc-caption text-[var(--cc-error)]/80 truncate">{health.error}</span>
          </div>
        )}

        {/* Last checked */}
        <div className="flex items-center justify-between">
          <span className="cc-caption text-[var(--cc-muted)]">Last Check</span>
          <span className="cc-caption text-[var(--cc-muted)]/60">
            {health.lastChecked ? new Date(health.lastChecked).toLocaleTimeString() : "—"}
          </span>
        </div>
      </div>

      {/* Demo mode hint */}
      {demoMode && health.status === "down" && (
        <div className="mt-3 pt-3 border-t border-[var(--cc-hairline)]">
          <p className="cc-caption text-[var(--cc-muted)]/60">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-[var(--cc-muted)]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> Services on Cloudflare Workers — using demo data
          </p>
        </div>
      )}
    </div>
  );
}
