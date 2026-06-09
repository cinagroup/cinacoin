type StatusType = "operational" | "degraded" | "outage" | "maintenance";

interface StatusBadgeProps {
  status: StatusType;
}

const statusConfig: Record<StatusType, { label: string; color: string; bg: string }> = {
  operational: { label: "Operational", color: "text-green-400", bg: "bg-green-400/10" },
  degraded: { label: "Degraded", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  outage: { label: "Major Outage", color: "text-red-400", bg: "bg-red-400/10" },
  maintenance: { label: "Maintenance", color: "text-blue-400", bg: "bg-blue-400/10" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.color} ${config.bg}`}>
      <span className={`h-2 w-2 rounded-full ${config.color.replace("text-", "bg-")}`} />
      {config.label}
    </span>
  );
}
