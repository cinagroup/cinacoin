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
    <div className="card">
      <h3 className="text-[16px] font-semibold text-ink mb-4">
        API Calls (This Week)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ebebeb" />
          <XAxis dataKey="day" stroke="#888888" fontSize={12} />
          <YAxis stroke="#888888" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #ebebeb",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [value.toLocaleString(), ""]}
          />
          <Bar dataKey="calls" fill="#0070f3" radius={[4, 4, 0, 0]} name="API Calls" />
          <Bar dataKey="errors" fill="#ee0000" radius={[4, 4, 0, 0]} name="Errors" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
