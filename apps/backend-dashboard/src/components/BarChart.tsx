import React from 'react';

interface BarChartProps {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
  ariaLabelledBy?: string;
}

export default React.memo(function BarChart({ data, labels, color = "var(--cc-primary)", height = 120, ariaLabelledBy }: BarChartProps) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);

  return (
    <div
      className="cc-card"
      role="img"
      aria-label={ariaLabelledBy ? undefined : "Bar chart showing data trends"}
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
              title={`${labels[i]}: ${value.toLocaleString()}`}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] text-[var(--cc-ink)] cc-caption px-2 py-1 rounded-[var(--cc-radius-sm)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10" role="tooltip" style={{ boxShadow: 'var(--cc-level1)' }}>
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
            className="flex-1 text-center cc-caption text-[var(--cc-muted)] truncate"
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
});
