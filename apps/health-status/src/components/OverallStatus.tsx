type OverallStatusType = "all-operational" | "partial-outage" | "major-outage" | "maintenance";

interface OverallStatusProps {
  status: OverallStatusType;
}

const config: Record<OverallStatusType, { label: string; color: string; bg: string; icon: string }> = {
  "all-operational": {
    label: "All Systems Operational",
    color: "text-green-400",
    bg: "bg-green-400/10 border-green-400/20",
    icon: "✓",
  },
  "partial-outage": {
    label: "Partial System Outage",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/20",
    icon: "⚠",
  },
  "major-outage": {
    label: "Major System Outage",
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/20",
    icon: "✕",
  },
  maintenance: {
    label: "Scheduled Maintenance",
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
    icon: "🔧",
  },
};

export default function OverallStatus({ status }: OverallStatusProps) {
  const c = config[status];
  return (
    <div className={`rounded-xl border p-6 text-center ${c.bg}`}>
      <div className={`text-4xl ${c.color}`}>{c.icon}</div>
      <h2 className={`mt-2 text-xl font-bold ${c.color}`}>{c.label}</h2>
      <p className="mt-1 text-sm text-gray-400">Last updated: just now</p>
    </div>
  );
}
