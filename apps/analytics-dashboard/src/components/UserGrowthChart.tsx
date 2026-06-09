"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const data = [
  { date: "Jan 1", users: 85000, newUsers: 3200 },
  { date: "Jan 8", users: 89500, newUsers: 4500 },
  { date: "Jan 15", users: 94200, newUsers: 4700 },
  { date: "Jan 22", users: 98800, newUsers: 4600 },
  { date: "Jan 29", users: 103500, newUsers: 4700 },
  { date: "Feb 5", users: 108200, newUsers: 4700 },
  { date: "Feb 12", users: 112000, newUsers: 3800 },
  { date: "Feb 19", users: 115800, newUsers: 3800 },
  { date: "Feb 26", users: 119500, newUsers: 3700 },
  { date: "Mar 5", users: 122000, newUsers: 2500 },
  { date: "Mar 12", users: 125200, newUsers: 3200 },
  { date: "Mar 19", users: 128456, newUsers: 3256 },
];

export default function UserGrowthChart() {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
          />
          <Area
            type="monotone"
            dataKey="users"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorUsers)"
            name="Total Users"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
