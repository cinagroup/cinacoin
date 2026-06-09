type DayStatus = "operational" | "degraded" | "outage" | "maintenance" | "none";

interface StatusBar90DaysProps {
  days: DayStatus[];
  serviceName: string;
}

const dayColors: Record<DayStatus, string> = {
  operational: "bg-[var(--color-operational)]",
  degraded: "bg-[var(--color-degraded)]",
  outage: "bg-[var(--color-outage)]",
  maintenance: "bg-[var(--color-maintenance)]",
  none: "bg-[var(--cc-hairline-strong)]",
};

export default function StatusBar90Days({ days, serviceName }: StatusBar90DaysProps) {
  return (
    <div className="mt-2">
      <div className="flex gap-[2px]" title={serviceName}>
        {days.map((day, i) => (
          <div
            key={i}
            className={`h-8 flex-1 rounded-sm ${dayColors[day]} transition-opacity duration-150 hover:opacity-75`}
            title={`Day ${i + 1}: ${day}`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-[var(--cc-muted)]">
        <span>90 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
