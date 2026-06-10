interface MetricBoxProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: "up" | "down" | "stable";
  color?: string;
}

export default function MetricBox({ label, value, icon, trend, color = "text-[var(--cc-ink)]" }: MetricBoxProps) {
  const trendLabel = trend === "up" ? "increasing" : trend === "down" ? "decreasing" : "stable";
  const labelId = `metric-label-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="cc-card p-3 sm:p-4" role="status" aria-labelledby={labelId}>
      <span className="sr-only">{`${label}: ${value}`}</span>
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <span id={labelId} className="cc-caption text-[var(--cc-muted)]">{label}</span>
        {icon && <span className="cc-display-sm" aria-hidden="true">{icon}</span>}
      </div>
      <div className="flex items-end gap-1 sm:gap-2">
        <span className={`cc-display-sm ${color} break-all`}>{value}</span>
        {trend && (
          <span className={`text-caption mb-1 ${
            trend === "up" ? "text-[var(--cc-success)]" :
            trend === "down" ? "text-[var(--cc-error)]" : "text-[var(--cc-muted)]"
          }`} aria-label={`Trend: ${trendLabel}`}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          </span>
        )}
      </div>
    </div>
  );
}
