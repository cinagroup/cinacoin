"use client";

import { useState, useMemo } from "react";

type CohortPeriod = "daily" | "weekly" | "monthly";

interface CohortData {
  label: string;
  users: number;
  retention: number[]; // percentages for each subsequent period
}

const cohortData: Record<CohortPeriod, CohortData[]> = {
  daily: [
    { label: "Jun 1", users: 3200, retention: [100, 68, 52, 41, 35, 30, 27] },
    { label: "Jun 2", users: 3450, retention: [100, 71, 55, 44, 37, 32, null as unknown as number] },
    { label: "Jun 3", users: 2980, retention: [100, 65, 50, 39, 33, null as unknown as number, null as unknown as number] },
    { label: "Jun 4", users: 3100, retention: [100, 69, 53, 42, null as unknown as number, null as unknown as number, null as unknown as number] },
    { label: "Jun 5", users: 3650, retention: [100, 72, 56, null as unknown as number, null as unknown as number, null as unknown as number, null as unknown as number] },
    { label: "Jun 6", users: 3800, retention: [100, 70, null as unknown as number, null as unknown as number, null as unknown as number, null as unknown as number, null as unknown as number] },
    { label: "Jun 7", users: 4100, retention: [100, null as unknown as number, null as unknown as number, null as unknown as number, null as unknown as number, null as unknown as number, null as unknown as number] },
  ],
  weekly: [
    { label: "Week 1", users: 22400, retention: [100, 45, 32, 26, 22, 19, 17, 16] },
    { label: "Week 2", users: 24100, retention: [100, 48, 35, 28, 24, 21, 18, null as unknown as number] },
    { label: "Week 3", users: 21800, retention: [100, 42, 30, 24, 20, 17, null as unknown as number, null as unknown as number] },
    { label: "Week 4", users: 25600, retention: [100, 50, 37, 30, 25, null as unknown as number, null as unknown as number, null as unknown as number] },
    { label: "Week 5", users: 23900, retention: [100, 46, 33, 27, null as unknown as number, null as unknown as number, null as unknown as number, null as unknown as number] },
    { label: "Week 6", users: 26200, retention: [100, 49, 36, null as unknown as number, null as unknown as number, null as unknown as number, null as unknown as number, null as unknown as number] },
  ],
  monthly: [
    { label: "Jan", users: 85000, retention: [100, 42, 35, 30, 27, 25] },
    { label: "Feb", users: 92000, retention: [100, 44, 37, 32, 29, null as unknown as number] },
    { label: "Mar", users: 98500, retention: [100, 46, 39, 34, null as unknown as number, null as unknown as number] },
    { label: "Apr", users: 105000, retention: [100, 48, 41, null as unknown as number, null as unknown as number, null as unknown as number] },
    { label: "May", users: 112000, retention: [100, 50, null as unknown as number, null as unknown as number, null as unknown as number, null as unknown as number] },
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
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#ebebeb" strokeDasharray="3 3" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-ink-mute" style={{ fontSize: "10px" }}>
              {pct}%
            </text>
          </g>
        );
      })}

      {/* X-axis labels */}
      {labels.map((label, i) => {
        const x = padding.left + (i / (labels.length - 1)) * chartW;
        return (
          <text key={i} x={x} y={height - 8} textAnchor="middle" className="fill-ink-mute" style={{ fontSize: "10px" }}>
            {label}
          </text>
        );
      })}

      {/* Retention curves */}
      {cohorts.map((cohort, ci) => {
        const points = cohort.retention
          .map((val, i) => {
            if (val == null) return null;
            const x = padding.left + (i / (labels.length - 1)) * chartW;
            const y = padding.top + chartH - (val / 100) * chartH;
            return { x, y };
          })
          .filter(Boolean) as { x: number; y: number }[];

        if (points.length < 2) return null;

        const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

        return (
          <g key={ci}>
            <path d={pathD} fill="none" stroke={colors[ci % colors.length]} strokeWidth="2" strokeLinecap="round" />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="3" fill={colors[ci % colors.length]}>
                <title>{`${cohort.label} - ${labels[i]}: ${cohort.retention[i]}%`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export default function RetentionCurve() {
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
        if (val != null) {
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
        <h3 className="text-heading-3 text-ink">User Retention</h3>
        <div className="flex bg-canvas-soft-2 rounded-md p-xxs">
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-sm py-xxs text-body-sm rounded-sm transition-all capitalize ${
                period === p
                  ? "bg-canvas text-ink font-medium shadow-cinacoin-2"
                  : "text-ink-mute hover:text-ink"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-sm">
        <div className="card p-sm text-center">
          <p className="text-caption text-ink-mute">Day-1 Retention</p>
          <p className="text-display-sm text-ink">{avgRetention[1] || 0}%</p>
        </div>
        <div className="card p-sm text-center">
          <p className="text-caption text-ink-mute">
            {period === "daily" ? "Day-3" : period === "weekly" ? "Week-3" : "Month-3"} Retention
          </p>
          <p className="text-display-sm text-ink">{avgRetention[3] || 0}%</p>
        </div>
        <div className="card p-sm text-center">
          <p className="text-caption text-ink-mute">Latest Period</p>
          <p className="text-display-sm text-ink">{avgRetention[avgRetention.length - 1] || 0}%</p>
        </div>
      </div>

      {/* Line Chart */}
      <div className="card p-md">
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
              <span className="text-caption text-ink-mute">
                {c.label} ({c.users.toLocaleString()})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap Table */}
      <div>
        <h4 className="text-body font-medium text-ink mb-sm">Retention Heatmap</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-caption">
            <thead>
              <tr>
                <th className="text-left p-xs text-ink-mute font-medium">Cohort</th>
                <th className="text-left p-xs text-ink-mute font-medium">Users</th>
                {labels.map((l) => (
                  <th key={l} className="text-center p-xs text-ink-mute font-medium">
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => (
                <tr key={c.label}>
                  <td className="p-xs text-ink-body font-medium">{c.label}</td>
                  <td className="p-xs text-ink-mute">{c.users.toLocaleString()}</td>
                  {c.retention.map((val, i) => (
                    <td key={i} className="p-xs text-center">
                      {val != null ? (
                        <span
                          className="inline-block px-xs py-xxs rounded-sm font-medium"
                          style={{
                            backgroundColor: `rgba(0, 112, 243, ${val / 100 * 0.3 + 0.05})`,
                            color: val > 50 ? "#171717" : "#4d4d4d",
                          }}
                        >
                          {val}%
                        </span>
                      ) : (
                        <span className="text-ink-mute">-</span>
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
}
