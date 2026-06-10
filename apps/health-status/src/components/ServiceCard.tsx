import StatusBadge from "./StatusBadge";

type StatusType = "operational" | "degraded" | "outage" | "maintenance";

interface ServiceCardProps {
  name: string;
  status: StatusType;
  uptime: string;
  description: string;
}

export default function ServiceCard({ name, status, uptime, description }: ServiceCardProps) {
  return (
    <div 
      className="rounded-[8px] border border-[var(--cc-hairline)] bg-[var(--cc-canvas)] p-5 transition-all duration-200 hover:shadow-[var(--cc-level2)]"
      style={{ boxShadow: 'inset 0 0 0 1px var(--cc-hairline)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[var(--cc-ink)]">{name}</h3>
          <p className="mt-0.5 text-[14px] text-[var(--cc-body)]">{description}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-3 flex items-center gap-2 text-[12px] text-[var(--cc-muted)]">
        <span>Uptime:</span>
        <span className="text-code text-[var(--cc-body)]">{uptime}</span>
      </div>
    </div>
  );
}
