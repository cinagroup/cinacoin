'use client';

import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const data = [
  { date: 'Jan 1', users: 85000, newUsers: 3200 },
  { date: 'Jan 8', users: 89500, newUsers: 4500 },
  { date: 'Jan 15', users: 94200, newUsers: 4700 },
  { date: 'Jan 22', users: 98800, newUsers: 4600 },
  { date: 'Jan 29', users: 103500, newUsers: 4700 },
  { date: 'Feb 5', users: 108200, newUsers: 4700 },
  { date: 'Feb 12', users: 112000, newUsers: 3800 },
  { date: 'Feb 19', users: 115800, newUsers: 3800 },
  { date: 'Feb 26', users: 119500, newUsers: 3700 },
  { date: 'Mar 5', users: 122000, newUsers: 2500 },
  { date: 'Mar 12', users: 125200, newUsers: 3200 },
  { date: 'Mar 19', users: 128456, newUsers: 3256 },
];

export default React.memo(function UserGrowthChart() {
  return (
    <div className="h-72">
      <div
        role="img"
        aria-label="User growth chart showing 51% increase from 85,000 to 128,456 users over 12 weeks"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--cc-link)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--cc-link)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--cc-hairline)" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="var(--cc-muted)" />
            <YAxis tick={{ fontSize: 12 }} stroke="var(--cc-muted)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--cc-canvas)',
                border: '1px solid var(--cc-hairline)',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.04)',
              }}
            />
            <Area
              type="monotone"
              dataKey="users"
              stroke="var(--cc-link)"
              strokeWidth={2}
              fill="url(#colorUsers)"
              name="Total Users"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>User Growth Data</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Users</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{d.date}</td>
              <td>{d.users}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
