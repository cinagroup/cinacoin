interface MetricBoxProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: "up" | "down" | "stable";
  color?: string;
}

export default function MetricBox({ label, value, icon, trend, color = "text-[var(--cc-ink)]" }: MetricBoxProps) {
  return (
    <div className="cc-card p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <span className="cc-caption text-[var(--cc-muted)]">{label}</span>
        {icon && <span className="text-base sm:text-lg">{icon}</span>}
      </div>
      <div className="flex items-end gap-1 sm:gap-2">
        <span className={`text-lg sm:text-2xl font-semibold ${color} break-all`}>{value}</span>
        {trend && (
          <span className={`text-xs mb-1 ${
            trend === "up" ? "text-[var(--cc-success)]" :
            trend === "down" ? "text-[var(--cc-error)]" : "text-[var(--cc-muted)]"
          }`}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          </span>
        )}
      </div>
    </div>
  );
}
