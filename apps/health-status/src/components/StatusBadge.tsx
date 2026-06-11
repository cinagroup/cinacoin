import React from 'react';

type StatusType = "operational" | "degraded" | "outage" | "maintenance";

interface StatusBadgeProps {
  status: StatusType;
}

const statusConfig: Record<StatusType, { label: string; color: string; bg: string; dot: string }> = {
  operational: { label: "Operational", color: "text-[var(--cc-success)]", bg: "bg-[var(--cc-success)]/10", dot: "bg-[var(--cc-success)]" },
  degraded: { label: "Degraded", color: "text-[var(--cc-warning)]", bg: "bg-[var(--cc-warning)]/10", dot: "bg-[var(--cc-warning)]" },
  outage: { label: "Major outage", color: "text-[var(--cc-error)]", bg: "bg-[var(--cc-error)]/10", dot: "bg-[var(--cc-error)]" },
  maintenance: { label: "Maintenance", color: "text-[var(--cc-link)]", bg: "bg-[var(--cc-link)]/10", dot: "bg-[var(--cc-link)]" },
};

export default React.memo(function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 cc-caption-mono ${config.color} ${config.bg}`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} aria-hidden="true" />
      {config.label}
    </span>
  );
});
