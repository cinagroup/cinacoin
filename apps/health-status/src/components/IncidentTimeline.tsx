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

const statusColors: Record<IncidentStatus, { text: string; bg: string }> = {
  resolved: { text: "text-[var(--color-operational)]", bg: "bg-[var(--color-operational)]/10" },
  investigating: { text: "text-[var(--cc-warning)]", bg: "bg-[var(--cc-warning)]/10" },
  monitoring: { text: "text-[var(--cc-link)]", bg: "bg-[var(--cc-link)]/10" },
  identified: { text: "text-[var(--cc-warning)]", bg: "bg-[var(--cc-warning)]/10" },
};

const severityColors: Record<string, string> = {
  minor: "border-[var(--cc-warning)]/30",
  major: "border-[var(--cc-error)]/30",
  critical: "border-[var(--cc-error)]/50",
};

export default function IncidentTimeline({ incidents }: { incidents: Incident[] }) {
  return (
    <div className="space-y-4">
      {incidents.map((incident) => {
        const colors = statusColors[incident.status];
        return (
          <div 
            key={incident.id} 
            className={`rounded-[8px] border ${severityColors[incident.severity]} bg-[var(--cc-canvas)] p-5 transition-all duration-200 hover:shadow-[var(--cc-level1)]`}
            style={{ boxShadow: 'inset 0 0 0 1px var(--cc-hairline)' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-[var(--cc-ink)]">{incident.title}</h3>
                <p className="mt-0.5 text-[14px] text-[var(--cc-body)]">{incident.date}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium capitalize ${colors.text} ${colors.bg}`}>
                {incident.status}
              </span>
            </div>
            <div className="mt-4 space-y-3 border-l-2 border-[var(--cc-hairline)] pl-4">
              {incident.updates.map((update, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-[var(--cc-canvas)] bg-[var(--cc-muted)]" />
                  <p className="text-[14px] text-[var(--cc-body)]">{update.message}</p>
                  <p className="mt-0.5 text-[12px] text-[var(--cc-muted)]">{update.timestamp}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
