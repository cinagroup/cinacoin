import React from 'react';
import StatusBadge from "./StatusBadge";

type StatusType = "operational" | "degraded" | "outage" | "maintenance";

interface ServiceCardProps {
  name: string;
  status: StatusType;
  uptime: string;
  description: string;
  responseTime?: string;
}

export default React.memo(function ServiceCard({ name, status, uptime, description, responseTime }: ServiceCardProps) {
  return (
    <div 
      className="rounded-[8px] border border-[var(--cc-hairline)] bg-[var(--cc-canvas)] p-5 transition-all duration-200 hover:shadow-[var(--cc-level2)]"
      style={{ boxShadow: 'inset 0 0 0 1px var(--cc-hairline)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="cc-body-sm-strong">{name}</h3>
          <p className="mt-1 cc-body-sm text-[var(--cc-body)]">{description}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-3 flex items-center gap-4 cc-caption text-[var(--cc-muted)]">
        <span>Uptime: <span className="font-mono text-[var(--cc-body)]">{uptime}</span></span>
        {responseTime && (
          <span>Response: <span className="font-mono text-[var(--cc-body)]">{responseTime}</span></span>
        )}
      </div>
    </div>
  );
});
