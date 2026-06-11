"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "North America", value: 35, color: "#0070f3" },
  { name: "Europe", value: 28, color: "#7928ca" },
  { name: "Asia Pacific", value: 22, color: "#0091ff" },
  { name: "Latin America", value: 10, color: "#f5a623" },
  { name: "Others", value: 5, color: "#737373" },
];

export default React.memo(function RegionDistribution() {
  return (
    <div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart aria-label="Region distribution chart" role="img">
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--cc-canvas)",
                border: "1px solid var(--cc-hairline)",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.04)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-lg space-y-xs">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-body text-[var(--cc-body)]">{item.name}</span>
            </div>
            <span className="text-body font-medium text-[var(--cc-ink)]">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
});
