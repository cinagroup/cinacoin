import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Wrench } from 'lucide-react';

type OverallStatusType = "all-operational" | "partial-outage" | "major-outage" | "maintenance";

interface OverallStatusProps {
  status: OverallStatusType;
}

const config: Record<OverallStatusType, { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  "all-operational": {
    label: "All Systems Operational",
    color: "text-[var(--color-operational)]",
    bg: "bg-[var(--color-operational)]/10",
    border: "border-[var(--color-operational)]/20",
    icon: CheckCircle,
  },
  "partial-outage": {
    label: "Partial System Outage",
    color: "text-[var(--cc-warning)]",
    bg: "bg-[var(--cc-warning)]/10",
    border: "border-[var(--cc-warning)]/20",
    icon: AlertTriangle,
  },
  "major-outage": {
    label: "Major System Outage",
    color: "text-[var(--cc-error)]",
    bg: "bg-[var(--cc-error)]/10",
    border: "border-[var(--cc-error)]/20",
    icon: XCircle,
  },
  maintenance: {
    label: "Scheduled Maintenance",
    color: "text-[var(--cc-maintenance)]",
    bg: "bg-[var(--cc-maintenance)]/10",
    border: "border-[var(--cc-maintenance)]/20",
    icon: Wrench,
  },
};

export default React.memo(function OverallStatus({ status }: OverallStatusProps) {
  const c = config[status];
  const Icon = c.icon;
  return (
    <div className={`rounded-[8px] border ${c.border} ${c.bg} p-6 text-center`}>
      <Icon className={`mx-auto mb-3 w-12 h-12 ${c.color}`} aria-hidden="true" />
      <h2 className={`text-display-sm font-semibold ${c.color}`}>{c.label}</h2>
      <p className="mt-1 text-body-sm text-[var(--cc-body)]">Last updated: just now</p>
    </div>
  );
});
