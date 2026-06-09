type IncidentStatus = "resolved" | "investigating" | "monitoring" | "identified";

interface IncidentUpdate {
  status: IncidentStatus;
  message: string;
  timestamp: string;
}

interface Incident {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: "minor" | "major" | "critical";
  date: string;
  updates: IncidentUpdate[];
}

const statusColors: Record<IncidentStatus, string> = {
  resolved: "text-green-400 bg-green-400/10",
  investigating: "text-orange-400 bg-orange-400/10",
  monitoring: "text-blue-400 bg-blue-400/10",
  identified: "text-yellow-400 bg-yellow-400/10",
};

const severityColors: Record<string, string> = {
  minor: "border-yellow-500/30",
  major: "border-orange-500/30",
  critical: "border-red-500/30",
};

export default function IncidentTimeline({ incidents }: { incidents: Incident[] }) {
  return (
    <div className="space-y-4">
      {incidents.map((incident) => (
        <div key={incident.id} className={`rounded-xl border ${severityColors[incident.severity]} bg-gray-900/50 p-5`}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-white">{incident.title}</h3>
              <p className="mt-0.5 text-sm text-gray-400">{incident.date}</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[incident.status]}`}>
              {incident.status}
            </span>
          </div>
          <div className="mt-4 space-y-3 border-l-2 border-gray-700 pl-4">
            {incident.updates.map((update, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-gray-900 bg-gray-500" />
                <p className="text-sm text-gray-300">{update.message}</p>
                <p className="mt-0.5 text-xs text-gray-500">{update.timestamp}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
