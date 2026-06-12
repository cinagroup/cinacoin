"use client";

import React, { useState, useMemo, useCallback } from "react";

type CohortPeriod = "daily" | "weekly" | "monthly";

interface CohortData {
  label: string;
  users: number;
  retention: number[]; // percentages for each subsequent period
}

const cohortData: Record<CohortPeriod, CohortData[]> = {
  daily: [
    { label: "Jun 1", users: 3200, retention: [100, 68, 52, 41, 35, 30, 27] },
    { label: "Jun 2", users: 3450, retention: [100, 71, 55, 44, 37, 32, -1] },
    { label: "Jun 3", users: 2980, retention: [100, 65, 50, 39, 33, -1, -1] },
    { label: "Jun 4", users: 3100, retention: [100, 69, 53, 42, -1, -1, -1] },
    { label: "Jun 5", users: 3650, retention: [100, 72, 56, -1, -1, -1, -1] },
    { label: "Jun 6", users: 3800, retention: [100, 70, -1, -1, -1, -1, -1] },
    { label: "Jun 7", users: 4100, retention: [100, -1, -1, -1, -1, -1, -1] },
  ],
  weekly: [
    { label: "Week 1", users: 22400, retention: [100, 45, 32, 26, 22, 19, 17, 16] },
    { label: "Week 2", users: 24100, retention: [100, 48, 35, 28, 24, 21, 18, -1] },
    { label: "Week 3", users: 21800, retention: [100, 42, 30, 24, 20, 17, -1, -1] },
    { label: "Week 4", users: 25600, retention: [100, 50, 37, 30, 25, -1, -1, -1] },
    { label: "Week 5", users: 23900, retention: [100, 46, 33, 27, -1, -1, -1, -1] },
    { label: "Week 6", users: 26200, retention: [100, 49, 36, -1, -1, -1, -1, -1] },
  ],
  monthly: [
    { label: "Jan", users: 85000, retention: [100, 42, 35, 30, 27, 25] },
    { label: "Feb", users: 92000, retention: [100, 44, 37, 32, 29, -1] },
    { label: "Mar", users: 98500, retention: [100, 46, 39, 34, -1, -1] },
    { label: "Apr", users: 105000, retention: [100, 48, 41, -1, -1, -1] },
    { label: "May", users: 112000, retention: [100, 50, -1, -1, -1, -1] },
  ],
};

const periodLabels: Record<CohortPeriod, string[]> = {
  daily: ["Day 0", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"],
  weekly: ["Week 0", "Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"],
  monthly: ["Month 0", "Month 1", "Month 2", "Month 3", "Month 4", "Month 5"],
};

function RetentionLineChart({ cohorts, labels }: { cohorts: CohortData[]; labels: string[] }) {
  const width = 600;
  const height = 280;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const colors = ["#0070f3", "#7928ca", "#0091ff", "#f5a623", "#059669", "#ee0000", "#737373"];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((pct) => {
        const y = padding.top + chartH - (pct / 100) * chartH;
        return (
          <g key={pct}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="var(--cc-hairline)" strokeDasharray="3 3" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-ink-mute" style={{ fontSize: "var(--cc-text-xs)" }}>
              {pct}%
            </text>
          </g>
        );
      })}

      {/* X-axis labels */}
      {labels.map((label, i) => {
        const x = padding.left + (i / (labels.length - 1)) * chartW;
        return (
          <text key={label} x={x} y={height - 8} textAnchor="middle" className="fill-ink-mute" style={{ fontSize: "var(--cc-text-xs)" }}>
            {label}
          </text>
        );
      })}

      {/* Retention curves */}
      {cohorts.map((cohort, ci) => {
        const points = cohort.retention
          .map((val, i) => {
            if (val < 0) return null; // -1 means no data available
            const x = padding.left + (i / (labels.length - 1)) * chartW;
            const y = padding.top + chartH - (val / 100) * chartH;
            return { x, y };
          })
          .filter(Boolean) as { x: number; y: number }[];

        if (points.length < 2) return null;

        const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

        return (
          <g key={cohort.label}>
            <path d={pathD} fill="none" stroke={colors[ci % colors.length]} strokeWidth="2" strokeLinecap="round" />
            {points.map((p, i) => (
              <circle key={`${cohort.label}-${labels[i]}`} cx={p.x} cy={p.y} r="3" fill={colors[ci % colors.length]}>
                <title>{`${cohort.label} - ${labels[i]}: ${cohort.retention[i]}%`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export default React.memo(function RetentionCurve() {
  const [period, setPeriod] = useState<CohortPeriod>("weekly");
  const cohorts = cohortData[period];
  const labels = periodLabels[period];

  // Compute average retention at each step
  const avgRetention = useMemo(() => {
    const maxLen = Math.max(...cohorts.map((c) => c.retention.filter((v) => v != null).length));
    const sums: number[] = new Array(maxLen).fill(0);
    const counts: number[] = new Array(maxLen).fill(0);
    cohorts.forEach((c) => {
      c.retention.forEach((val, i) => {
        if (val >= 0) { // -1 means no data
          sums[i] += val;
          counts[i] += 1;
        }
      });
    });
    return sums.map((s, i) => (counts[i] > 0 ? Math.round(s / counts[i]) : 0));
  }, [cohorts]);

  return (
    <div className="space-y-lg">
      {/* Period Selector */}
      <div className="flex items-center justify-between flex-wrap gap-sm">
        <div>
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">COHORT</p>
          <h3 className="text-heading-3 text-[var(--cc-ink)]">User retention.</h3>
        </div>
        <div className="flex bg-[var(--cc-canvas-soft-2)] rounded-md p-xxs">
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-sm py-xxs text-body-sm rounded-sm transition-all capitalize ${
                period === p
                  ? "bg-[var(--cc-canvas)] text-[var(--cc-ink)] font-medium shadow-cinacoin-2"
                  : "text-[var(--cc-muted)] hover:text-[var(--cc-ink)]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-sm">
        <div className="cc-card p-sm text-center">
          <p className="text-caption text-[var(--cc-muted)]">Day-1 Retention</p>
          <p className="text-display-sm text-[var(--cc-ink)]">{avgRetention[1] || 0}%</p>
        </div>
        <div className="cc-card p-sm text-center">
          <p className="text-caption text-[var(--cc-muted)]">
            {period === "daily" ? "Day-3" : period === "weekly" ? "Week-3" : "Month-3"} Retention
          </p>
          <p className="text-display-sm text-[var(--cc-ink)]">{avgRetention[3] || 0}%</p>
        </div>
        <div className="cc-card p-sm text-center">
          <p className="text-caption text-[var(--cc-muted)]">Latest Period</p>
          <p className="text-display-sm text-[var(--cc-ink)]">{avgRetention[avgRetention.length - 1] || 0}%</p>
        </div>
      </div>

      {/* Line Chart */}
      <div className="cc-card p-md">
        <RetentionLineChart cohorts={cohorts} labels={labels} />
        <div className="flex flex-wrap gap-sm mt-sm justify-center">
          {cohorts.map((c, i) => (
            <div key={c.label} className="flex items-center gap-xxs">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: ["#0070f3", "#7928ca", "#0091ff", "#f5a623", "#059669", "#ee0000", "#737373"][i % 7],
                }}
              />
              <span className="text-caption text-[var(--cc-muted)]">
                {c.label} ({c.users.toLocaleString()})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap Table */}
      <div>
        <h4 className="text-body font-medium text-[var(--cc-ink)] mb-sm">Retention heatmap.</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-caption">
            <thead>
              <tr>
                <th className="text-left p-xs text-[var(--cc-muted)] font-medium">Cohort</th>
                <th className="text-left p-xs text-[var(--cc-muted)] font-medium">Users</th>
                {labels.map((l) => (
                  <th key={l} className="text-center p-xs text-[var(--cc-muted)] font-medium">
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => (
                <tr key={c.label}>
                  <td className="p-xs text-[var(--cc-body)] font-medium">{c.label}</td>
                  <td className="p-xs text-[var(--cc-muted)]">{c.users.toLocaleString()}</td>
                  {c.retention.map((val, i) => (
                    <td key={labels[i]} className="p-xs text-center">
                      {val >= 0 ? (
                        <span
                          className="inline-block px-xs py-xxs rounded-sm font-medium"
                          style={{
                            backgroundColor: `rgba(0, 112, 243, ${val / 100 * 0.3 + 0.05})`,
                            color: val > 50 ? "var(--cc-ink)" : "var(--cc-body)",
                          }}
                        >
                          {val}%
                        </span>
                      ) : (
                        <span className="text-[var(--cc-muted)]">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
