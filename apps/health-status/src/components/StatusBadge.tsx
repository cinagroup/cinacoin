type StatusType = "operational" | "degraded" | "outage" | "maintenance";

interface StatusBadgeProps {
  status: StatusType;
}

const statusConfig: Record<StatusType, { label: string; color: string; bg: string; dot: string }> = {
  operational: { label: "Operational", color: "text-[var(--cc-success)]", bg: "bg-[var(--cc-success)]/10", dot: "bg-[var(--cc-success)]" },
  degraded: { label: "Degraded", color: "text-[var(--cc-warning)]", bg: "bg-[var(--cc-warning)]/10", dot: "bg-[var(--cc-warning)]" },
  outage: { label: "Major Outage", color: "text-[var(--cc-error)]", bg: "bg-[var(--cc-error)]/10", dot: "bg-[var(--cc-error)]" },
  maintenance: { label: "Maintenance", color: "text-[var(--cc-maintenance)]", bg: "bg-[var(--cc-maintenance)]/10", dot: "bg-[var(--cc-maintenance)]" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.color} ${config.bg}`}>
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
