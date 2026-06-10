type StatusType = "operational" | "degraded" | "outage" | "maintenance";

interface StatusBadgeProps {
  status: StatusType;
}

const statusConfig: Record<StatusType, { label: string; color: string; bg: string; dot: string }> = {
  operational: { label: "Operational", color: "text-[var(--color-operational)]", bg: "bg-[var(--color-operational)]/10", dot: "bg-[var(--color-operational)]" },
  degraded: { label: "Degraded", color: "text-[var(--color-degraded)]", bg: "bg-[var(--color-degraded)]/10", dot: "bg-[var(--color-degraded)]" },
  outage: { label: "Major Outage", color: "text-[var(--color-outage)]", bg: "bg-[var(--color-outage)]/10", dot: "bg-[var(--color-outage)]" },
  maintenance: { label: "Maintenance", color: "text-[var(--color-maintenance)]", bg: "bg-[var(--color-maintenance)]/10", dot: "bg-[var(--color-maintenance)]" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium ${config.color} ${config.bg}`}>
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
