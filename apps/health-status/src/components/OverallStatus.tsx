import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Wrench } from 'lucide-react';

type OverallStatusType = "all-operational" | "partial-outage" | "major-outage" | "maintenance";

interface OverallStatusProps {
  status: OverallStatusType;
}

const config: Record<OverallStatusType, { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  "all-operational": {
    label: "All systems operational.",
    color: "text-[var(--cc-success)]",
    bg: "bg-[var(--cc-success)]/10",
    border: "border-[var(--cc-success)]/20",
    icon: CheckCircle,
  },
  "partial-outage": {
    label: "Partial system outage.",
    color: "text-[var(--cc-warning)]",
    bg: "bg-[var(--cc-warning)]/10",
    border: "border-[var(--cc-warning)]/20",
    icon: AlertTriangle,
  },
  "major-outage": {
    label: "Major system outage.",
    color: "text-[var(--cc-error)]",
    bg: "bg-[var(--cc-error)]/10",
    border: "border-[var(--cc-error)]/20",
    icon: XCircle,
  },
  maintenance: {
    label: "Scheduled maintenance.",
    color: "text-[var(--cc-link)]",
    bg: "bg-[var(--cc-link)]/10",
    border: "border-[var(--cc-link)]/20",
    icon: Wrench,
  },
};

export default React.memo(function OverallStatus({ status }: OverallStatusProps) {
  const c = config[status];
  const Icon = c.icon;
  return (
    <div className={`rounded-[8px] border ${c.border} ${c.bg} p-6 flex items-center gap-4`} role="status" aria-live="polite">
      <Icon className={`shrink-0 w-8 h-8 ${c.color}`} aria-hidden="true" />
      <div>
        <h2 className={`cc-body-sm-strong ${c.color}`}>{c.label}</h2>
        <p className="mt-0.5 cc-caption text-[var(--cc-body)]">Last updated: just now</p>
      </div>
    </div>
  );
});
