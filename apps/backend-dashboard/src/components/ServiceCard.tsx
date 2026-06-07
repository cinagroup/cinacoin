import { HealthCheck, ServiceDefinition, ServiceMetrics, generateDemoMetrics } from "@/lib/services";
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
    <div className="cc-card relative transition-all duration-300 hover:shadow-[var(--cc-shadow-level-3)]">
      {/* Status indicator - top right */}
      <div className="absolute top-3 right-3">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${statusBadgeBg(health.status)}`}>
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
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[var(--cc-error)]">⚠</span>
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
            ℹ️ Services on Cloudflare Workers — using demo data
          </p>
        </div>
      )}
    </div>
  );
}
