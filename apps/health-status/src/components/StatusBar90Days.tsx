type DayStatus = "operational" | "degraded" | "outage" | "maintenance" | "none";

interface StatusBar90DaysProps {
  days: DayStatus[];
  serviceName: string;
}

const dayColors: Record<DayStatus, string> = {
  operational: "bg-green-500",
  degraded: "bg-yellow-500",
  outage: "bg-red-500",
  maintenance: "bg-blue-500",
  none: "bg-gray-700",
};

export default function StatusBar90Days({ days, serviceName }: StatusBar90DaysProps) {
  return (
    <div className="mt-2">
      <div className="flex gap-[2px]" title={serviceName}>
        {days.map((day, i) => (
          <div
            key={i}
            className={`h-8 flex-1 rounded-sm ${dayColors[day]} transition-opacity hover:opacity-75`}
            title={`Day ${i + 1}: ${day}`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-gray-500">
        <span>90 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
