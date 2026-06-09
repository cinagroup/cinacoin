"use client";

import { cn } from "@/lib/utils";

export type TimeRange = "1h" | "24h" | "7d" | "30d" | "90d";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

const RANGES: { key: TimeRange; label: string }[] = [
  { key: "1h", label: "1H" },
  { key: "24h", label: "24H" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
];

/**
 * Time range selector for metric charts.
 */
export default function TimeRangeSelector({
  value,
  onChange,
  className,
}: TimeRangeSelectorProps) {
  return (
    <div className={cn("inline-flex items-center gap-0.5 p-0.5 bg-[var(--cc-canvas-soft2)] rounded-[var(--cc-radius-md)]", className)}>
      {RANGES.map((range) => (
        <button
          key={range.key}
          onClick={() => onChange(range.key)}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-[var(--cc-radius-sm)] transition-colors",
            value === range.key
              ? "bg-[var(--cc-canvas)] text-[var(--cc-ink)] shadow-sm"
              : "text-[var(--cc-muted)] hover:text-[var(--cc-ink-soft)]"
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
