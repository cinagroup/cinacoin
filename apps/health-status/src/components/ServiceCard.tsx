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
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 transition-colors hover:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">{name}</h3>
          <p className="mt-0.5 text-sm text-gray-400">{description}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        <span>Uptime:</span>
        <span className="font-mono text-gray-300">{uptime}</span>
      </div>
    </div>
  );
}
