import React from 'react';

type DayStatus = "operational" | "degraded" | "outage" | "maintenance" | "none";

interface StatusBar90DaysProps {
  days: DayStatus[];
  serviceName: string;
}

const dayColors: Record<DayStatus, string> = {
  operational: "bg-[var(--cc-success)]",
  degraded: "bg-[var(--cc-warning)]",
  outage: "bg-[var(--cc-error)]",
  maintenance: "bg-[var(--cc-link)]",
  none: "bg-[var(--cc-hairline-strong)]",
};

export default React.memo(function StatusBar90Days({ days, serviceName }: StatusBar90DaysProps) {
  return (
    <div className="mt-2" role="group" aria-label={`${serviceName} 90-day status history`}>
      <div className="flex gap-1">
        {days.map((day, i) => (
          <div
            key={i}
            className={`h-8 flex-1 rounded-sm ${dayColors[day]} transition-opacity duration-150 hover:opacity-75`}
            title={`Day ${i + 1}: ${day}`}
            aria-label={`Day ${i + 1}: ${day}`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between cc-caption text-[var(--cc-muted)]">
        <span>90 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
});
