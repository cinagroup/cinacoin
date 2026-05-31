import { HealthCheck, ServiceDefinition, ServiceMetrics, generateDemoMetrics } from "@/lib/services";
import { statusColor, formatLatency } from "@/lib/utils";

interface ServiceCardProps {
  service: ServiceDefinition;
  health: HealthCheck;
  demoMode?: boolean;
}

/** Get the color ring/border for a service based on its status */
function statusBorder(status: string): string {
  switch (status) {
    case "healthy":
      return "border-l-4 border-l-emerald-500 border-t-transparent border-r-transparent border-b-transparent";
    case "degraded":
      return "border-l-4 border-l-amber-500 border-t-transparent border-r-transparent border-b-transparent";
    case "down":
      return "border-l-4 border-l-red-500 border-t-transparent border-r-transparent border-b-transparent";
    default:
      return "border-l-4 border-l-gray-600 border-t-transparent border-r-transparent border-b-transparent";
  }
}

function statusDotColor(status: string): string {
  switch (status) {
    case "healthy":
      return "bg-emerald-400 shadow-lg shadow-emerald-500/30";
    case "degraded":
      return "bg-amber-400 shadow-lg shadow-amber-500/30";
    case "down":
      return "bg-red-400 shadow-lg shadow-red-500/30 animate-pulse";
    default:
      return "bg-gray-500";
  }
}

function statusBadgeBg(status: string): string {
  switch (status) {
    case "healthy":
      return "bg-emerald-500/10 border-emerald-500/20";
    case "degraded":
      return "bg-amber-500/10 border-amber-500/20";
    case "down":
      return "bg-red-500/10 border-red-500/20";
    default:
      return "bg-gray-500/10 border-gray-500/20";
  }
}

export default function ServiceCard({ service, health, demoMode = false }: ServiceCardProps) {
  const isHealthy = health.status === "healthy";
  const isDegraded = health.status === "degraded";
  const isDown = health.status === "down";

  return (
    <div className={`relative rounded-xl border border-dashboard-border bg-dashboard-surface p-5 ${statusBorder(health.status)} transition-all duration-300 hover:bg-dashboard-surfaceHover hover:shadow-xl hover:shadow-black/20`}>
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
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl" role="img" aria-label={service.name}>{service.icon}</span>
          <h3 className="text-base font-semibold text-white">{service.name}</h3>
        </div>
        <p className="text-xs text-dashboard-muted leading-relaxed">{service.description}</p>
      </div>

      {/* Health details */}
      <div className="space-y-2">
        {health.latency !== null && health.latency >= 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-dashboard-muted">Response Time</span>
            <span className={`text-sm font-medium ${
              isDown ? "text-dashboard-danger" :
              isDegraded ? "text-dashboard-warning" :
              health.latency > 500 ? "text-dashboard-warning" : "text-white"
            }`}>
              {formatLatency(health.latency)}
            </span>
          </div>
        )}

        {health.error && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-red-400">⚠</span>
            <span className="text-xs text-red-400/80 truncate">{health.error}</span>
          </div>
        )}

        {/* Last checked */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-dashboard-muted">Last Check</span>
          <span className="text-xs text-dashboard-muted/60">
            {health.lastChecked ? new Date(health.lastChecked).toLocaleTimeString() : "—"}
          </span>
        </div>
      </div>

      {/* Demo mode hint */}
      {demoMode && health.status === "down" && (
        <div className="mt-3 pt-3 border-t border-dashboard-border">
          <p className="text-xs text-dashboard-muted/60">
            ℹ️ Services on Cloudflare Workers — using demo data
          </p>
        </div>
      )}
    </div>
  );
}
