interface BarChartProps {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
  ariaLabelledBy?: string;
}

export default function BarChart({ data, labels, color = "#3b82f6", height = 120, ariaLabelledBy }: BarChartProps) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);

  return (
    <div
      className="bg-dashboard-surface rounded-md border border-dashboard-border p-4"
      role="img"
      aria-label="Bar chart"
      aria-labelledby={ariaLabelledBy}
    >
      <div
        className="flex items-end gap-1"
        style={{ height: `${height}px` }}
      >
        {data.map((value, i) => {
          const pct = (value / max) * 100;
          return (
            <div
              key={i}
              className="flex-1 rounded-t transition-all hover:opacity-80 group relative"
              style={{
                height: `${pct}%`,
                backgroundColor: color,
                minWidth: "4px",
              }}
              role="img"
              aria-label={`${labels[i]}: ${value.toLocaleString()}`}
              title={`${labels[i]}: ${value.toLocaleString()}`}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-dashboard-bg text-[var(--cc-ink)] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-2">
        {labels.map((label, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[10px] text-dashboard-muted truncate"
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
