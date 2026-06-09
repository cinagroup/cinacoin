"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { month: "Jan", users: 42000, active: 31000 },
  { month: "Feb", users: 48000, active: 35000 },
  { month: "Mar", users: 55000, active: 41000 },
  { month: "Apr", users: 63000, active: 47000 },
  { month: "May", users: 72000, active: 55000 },
  { month: "Jun", users: 85000, active: 64000 },
  { month: "Jul", users: 95000, active: 72000 },
  { month: "Aug", users: 105000, active: 81000 },
  { month: "Sep", users: 112000, active: 88000 },
  { month: "Oct", users: 118000, active: 93000 },
  { month: "Nov", users: 124000, active: 98000 },
  { month: "Dec", users: 128430, active: 102000 },
];

export function UserGrowthChart() {
  return (
    <div className="card">
      <h3 className="text-[16px] font-semibold text-ink mb-4">
        User Growth
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ebebeb" />
          <XAxis dataKey="month" stroke="#888888" fontSize={12} />
          <YAxis stroke="#888888" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #ebebeb",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="users"
            stroke="#0070f3"
            strokeWidth={2}
            dot={false}
            name="Total Users"
          />
          <Line
            type="monotone"
            dataKey="active"
            stroke="#50e3c2"
            strokeWidth={2}
            dot={false}
            name="Active Users"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
