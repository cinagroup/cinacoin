"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
}

export default React.memo(function KPICard({ title, value, change, trend }: KPICardProps) {
  const isPositive = trend === "up";
  const isGood = title.toLowerCase().includes("response time") ? !isPositive : isPositive;

  return (
    <div className="cc-card p-lg hover:shadow-cinacoin-3 transition-shadow" role="region" aria-label={`${title} metric`}>
      <div className="flex items-center justify-between mb-xs">
        <span className="text-body font-medium text-[var(--cc-body)]">{title}</span>
        <span
          className={`inline-flex items-center gap-xxs text-body-sm font-medium px-xs py-xxs rounded-sm ${
            isGood
              ? "badge-success"
              : "badge-error"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {change}
        </span>
      </div>
      <p className="text-display-md text-[var(--cc-ink)]">{value}</p>
    </div>
  );
});
