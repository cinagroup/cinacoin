"use client";

import React, { useState, useMemo, useCallback } from "react";

interface ChainData {
  name: string;
  value: number;
  color: string;
  txCount: number;
}

const dataByPeriod: Record<string, ChainData[]> = {
  "24h": [
    { name: "Ethereum", value: 32, color: "#627eea", txCount: 45200 },
    { name: "Polygon", value: 24, color: "#8247e5", txCount: 33960 },
    { name: "Arbitrum", value: 18, color: "#28a0f0", txCount: 25470 },
    { name: "Optimism", value: 12, color: "#ff0420", txCount: 16980 },
    { name: "Base", value: 8, color: "#0052ff", txCount: 11320 },
    { name: "Others", value: 6, color: "#737373", txCount: 8490 },
  ],
  "7d": [
    { name: "Ethereum", value: 28, color: "#627eea", txCount: 312500 },
    { name: "Polygon", value: 26, color: "#8247e5", txCount: 290200 },
    { name: "Arbitrum", value: 20, color: "#28a0f0", txCount: 222600 },
    { name: "Optimism", value: 11, color: "#ff0420", txCount: 122700 },
    { name: "Base", value: 10, color: "#0052ff", txCount: 111300 },
    { name: "Others", value: 5, color: "#737373", txCount: 55600 },
  ],
  "30d": [
    { name: "Ethereum", value: 25, color: "#627eea", txCount: 1280000 },
    { name: "Polygon", value: 28, color: "#8247e5", txCount: 1432000 },
    { name: "Arbitrum", value: 22, color: "#28a0f0", txCount: 1124000 },
    { name: "Optimism", value: 10, color: "#ff0420", txCount: 511000 },
    { name: "Base", value: 11, color: "#0052ff", txCount: 562000 },
    { name: "Others", value: 4, color: "#737373", txCount: 204400 },
  ],
};

function DonutChart({ data, size = 200 }: { data: ChainData[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR * 0.62;

  const arcs = useMemo(() => {
    let cumulative = 0;
    return data.map((d) => {
      const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
      cumulative += d.value;
      const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;

      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
      const x1Outer = cx + outerR * Math.cos(startAngle);
      const y1Outer = cy + outerR * Math.sin(startAngle);
      const x2Outer = cx + outerR * Math.cos(endAngle);
      const y2Outer = cy + outerR * Math.sin(endAngle);
      const x1Inner = cx + innerR * Math.cos(endAngle);
      const y1Inner = cy + innerR * Math.sin(endAngle);
      const x2Inner = cx + innerR * Math.cos(startAngle);
      const y2Inner = cy + innerR * Math.sin(startAngle);

      const path = [
        `M ${x1Outer} ${y1Outer}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
        `L ${x1Inner} ${y1Inner}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}`,
        "Z",
      ].join(" ");

      return { path, color: d.color, name: d.name, value: d.value };
    });
  }, [data, total, cx, cy, outerR, innerR]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {arcs.map((arc, i) => (
        <path
          key={i}
          d={arc.path}
          fill={arc.color}
          stroke="white"
          strokeWidth="2"
          className="transition-opacity duration-200 hover:opacity-80 cursor-pointer"
        >
          <title>{`${arc.name}: ${arc.value}%`}</title>
        </path>
      ))}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        className="fill-ink"
        style={{ fontSize: "var(--cc-text-lg)", fontWeight: "var(--weight-semibold)" }}
      >
        {total}%
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        className="fill-ink-mute"
        style={{ fontSize: "var(--cc-text-xs)" }}
      >
        Total Share
      </text>
    </svg>
  );
}

export default React.memo(function ChainDistribution() {
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("7d");
  const data = dataByPeriod[period];

  return (
    <div className="space-y-lg">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-mute mb-2">NETWORKS</p>
          <h3 className="text-heading-3 text-ink">Chain Distribution</h3>
        </div>
        <div className="flex bg-canvas-soft-2 rounded-md p-xxs">
          {(["24h", "7d", "30d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-sm py-xxs text-body-sm rounded-sm transition-all ${
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

      {/* Chart + Legend */}
      <div className="flex flex-col md:flex-row items-center gap-lg">
        <div className="flex-shrink-0">
          <DonutChart data={data} size={220} />
        </div>
        <div className="flex-1 w-full space-y-xs">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-xs">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-body-sm text-ink-body">{item.name}</span>
              </div>
              <div className="flex items-center gap-md">
                <span className="text-body-sm text-ink-mute">
                  {item.txCount.toLocaleString()} tx
                </span>
                <span className="text-body-sm font-medium text-ink w-10 text-right">
                  {item.value}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bar Comparison */}
      <div>
        <h4 className="text-body font-medium text-ink mb-sm">Transaction Volume</h4>
        <div className="space-y-xs">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-sm">
              <span className="text-caption text-ink-mute w-20 flex-shrink-0">{item.name}</span>
              <div className="flex-1 h-6 bg-canvas-soft-2 rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md flex items-center px-xs transition-all duration-500"
                  style={{
                    width: `${item.value}%`,
                    backgroundColor: item.color,
                    minWidth: "40px",
                  }}
                >
                  <span className="text-caption font-medium text-[var(--color-on-primary)]">
                    {item.txCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
