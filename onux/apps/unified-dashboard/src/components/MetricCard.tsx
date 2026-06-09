"use client";

import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
  loading?: boolean;
}

/**
 * Overview metric card — displays a single KPI with optional trend delta.
 */
export default function MetricCard({
  title,
  value,
  delta,
  icon,
  className,
  loading = false,
}: MetricCardProps) {
  return (
    <div className={cn("cc-card p-5 animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="cc-metric-label truncate">{title}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 bg-[var(--cc-canvas-soft2)] rounded animate-pulse" />
          ) : (
            <p className="cc-metric-value mt-1">{value}</p>
          )}
          {delta && !loading && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  "cc-metric-delta flex items-center gap-0.5",
                  delta.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {delta.isPositive ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
                  </svg>
                )}
                {Math.abs(delta.value)}%
              </span>
              <span className="text-xs text-[var(--cc-muted)]">vs last period</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-[var(--cc-radius-md)] bg-[var(--cc-canvas-soft2)] flex items-center justify-center text-[var(--cc-muted)] flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
