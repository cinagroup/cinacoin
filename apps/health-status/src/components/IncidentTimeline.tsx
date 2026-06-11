import React from 'react';
import { CheckCircle } from 'lucide-react';

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
  resolved: { text: "text-[var(--cc-success)]", bg: "bg-[var(--cc-success)]/10" },
  investigating: { text: "text-[var(--cc-warning)]", bg: "bg-[var(--cc-warning)]/10" },
  monitoring: { text: "text-[var(--cc-link)]", bg: "bg-[var(--cc-link)]/10" },
  identified: { text: "text-[var(--cc-warning)]", bg: "bg-[var(--cc-warning)]/10" },
};

const severityColors: Record<string, string> = {
  minor: "border-[var(--cc-warning)]/30",
  major: "border-[var(--cc-error)]/30",
  critical: "border-[var(--cc-error)]/50",
};

export default React.memo(function IncidentTimeline({ incidents }: { incidents: Incident[] }) {
  return (
    <div className="space-y-4" role="feed" aria-label="Incident timeline">
      {incidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-[8px] border border-[var(--cc-hairline)] bg-[var(--cc-canvas)]">
          <CheckCircle className="mb-3 w-12 h-12 text-[var(--cc-success)]" aria-hidden="true" />
          <h3 className="cc-body-sm-strong">No incidents reported.</h3>
          <p className="mt-1 cc-body-sm text-[var(--cc-body)]">All systems are running smoothly. Incidents will appear here if any occur.</p>
        </div>
      ) : incidents.map((incident, incidentIdx) => {
        const colors = statusColors[incident.status];
        return (
          <article 
            key={incident.id} 
            className={`rounded-[8px] border ${severityColors[incident.severity]} bg-[var(--cc-canvas)] p-5 transition-all duration-200 hover:shadow-[var(--cc-level1)]`}
            style={{ boxShadow: 'inset 0 0 0 1px var(--cc-hairline)' }}
            aria-labelledby={`incident-${incident.id}-title`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 id={`incident-${incident.id}-title`} className="cc-body-sm-strong">{incident.title}</h3>
                <p className="mt-1 cc-body-sm text-[var(--cc-body)]">{incident.date}</p>
              </div>
              <span className={`rounded-full px-3 py-1 cc-caption-mono capitalize ${colors.text} ${colors.bg}`}>
                {incident.status}
              </span>
            </div>
            <div className="mt-4 space-y-3 border-l-2 border-[var(--cc-hairline)] pl-4" role="list">
              {incident.updates.map((update, idx) => (
                <div key={idx} className="relative pb-3 border-b border-[var(--cc-hairline)] last:border-b-0 last:pb-0" role="listitem">
                  <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-[var(--cc-canvas)] bg-[var(--cc-muted)]" aria-hidden="true" />
                  <p className="cc-body-sm text-[var(--cc-body)]">{update.message}</p>
                  <p className="mt-1 cc-caption text-[var(--cc-muted)]">{update.timestamp}</p>
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
});
