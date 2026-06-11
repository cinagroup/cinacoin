"use client";

import { Users, Plug, Coins, Zap } from 'lucide-react';

const stats = [
  {
    title: "Total users.",
    value: "128,430",
    change: "+12.5%",
    positive: true,
    icon: Users,
  },
  {
    title: "API calls (24h).",
    value: "2,847,392",
    change: "+8.2%",
    positive: true,
    icon: Plug,
  },
  {
    title: "Transactions.",
    value: "45,892",
    change: "+23.1%",
    positive: true,
    icon: Coins,
  },
  {
    title: "Avg response time.",
    value: "142ms",
    change: "-5.3%",
    positive: true,
    icon: Zap,
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.title} className="cc-card">
          <div className="flex items-center justify-between">
            <p className="cc-caption text-[var(--cc-muted)]">{stat.title}</p>
            <stat.icon className="w-5 h-5 text-[var(--cc-muted)]" />
          </div>
          <p className="cc-display-sm text-[var(--cc-ink)] mt-2">{stat.value}</p>
          <div className="flex items-center mt-2">
            <span
              className={`cc-body-sm font-medium ${
                stat.positive ? "text-[var(--cc-link)]" : "text-[var(--cc-error)]"
              }`}
            >
              {stat.change}
            </span>
            <span className="cc-body-sm text-[var(--cc-muted)] ml-2">vs last week</span>
          </div>
        </div>
      ))}
    </div>
  );
}
