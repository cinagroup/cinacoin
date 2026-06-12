"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Mon", calls: 2400000, errors: 12000 },
  { day: "Tue", calls: 2800000, errors: 14000 },
  { day: "Wed", calls: 3100000, errors: 11000 },
  { day: "Thu", calls: 2900000, errors: 15000 },
  { day: "Fri", calls: 3200000, errors: 13000 },
  { day: "Sat", calls: 1800000, errors: 8000 },
  { day: "Sun", calls: 1600000, errors: 7000 },
];

export function ApiCallsChart() {
  return (
    <div className="cc-card" aria-label="API calls chart showing weekly data">
      <h3 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">
        API calls this week.
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--cc-hairline)" />
          <XAxis dataKey="day" stroke="var(--cc-muted)" fontSize={12} />
          <YAxis stroke="var(--cc-muted)" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--cc-canvas)",
              border: "1px solid var(--cc-hairline)",
              borderRadius: "var(--cc-radius-md)",
              boxShadow: "var(--cc-level2)",
            }}
            labelStyle={{ color: "var(--cc-ink)", fontWeight: 600 }}
            itemStyle={{ color: "var(--cc-body)" }}
            formatter={(value: number) => [value.toLocaleString(), ""]}
          />
          <Bar dataKey="calls" fill="var(--cc-primary)" radius={[4, 4, 0, 0]} name="API Calls" />
          <Bar dataKey="errors" fill="var(--cc-error)" radius={[4, 4, 0, 0]} name="Errors" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
