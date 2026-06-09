"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { hour: "00:00", calls: 85000, errors: 120 },
  { hour: "02:00", calls: 62000, errors: 85 },
  { hour: "04:00", calls: 45000, errors: 62 },
  { hour: "06:00", calls: 78000, errors: 95 },
  { hour: "08:00", calls: 145000, errors: 210 },
  { hour: "10:00", calls: 198000, errors: 285 },
  { hour: "12:00", calls: 210000, errors: 310 },
  { hour: "14:00", calls: 195000, errors: 275 },
  { hour: "16:00", calls: 180000, errors: 250 },
  { hour: "18:00", calls: 165000, errors: 220 },
  { hour: "20:00", calls: 142000, errors: 195 },
  { hour: "22:00", calls: 110000, errors: 155 },
];

export default function APICallsChart() {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ebebeb" />
          <XAxis dataKey="hour" tick={{ fontSize: 12 }} stroke="#888888" />
          <YAxis tick={{ fontSize: 12 }} stroke="#888888" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #ebebeb",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.04)",
            }}
          />
          <Legend />
          <Bar dataKey="calls" fill="#0070f3" radius={[4, 4, 0, 0]} name="API Calls" />
          <Bar dataKey="errors" fill="#ee0000" radius={[4, 4, 0, 0]} name="Errors" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
