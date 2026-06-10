"use client";

import React from "react";

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
}

export default React.memo(function KPICard({ title, value, change, trend }: KPICardProps) {
  const isPositive = trend === "up";
  const isGood = title === "Avg Response Time" ? !isPositive : isPositive;

  return (
    <div className="cc-card p-lg hover:shadow-cinacoin-3 transition-shadow">
      <div className="flex items-center justify-between mb-xs">
        <span className="text-body font-medium text-ink-body">{title}</span>
        <span
          className={`inline-flex items-center gap-xxs text-body-sm font-medium px-xs py-xxs rounded-full ${
            isGood
              ? "badge-success"
              : "badge-error"
          }`}
        >
          {isPositive ? (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          {change}
        </span>
      </div>
      <p className="text-display-md text-ink">{value}</p>
    </div>
  );
});
