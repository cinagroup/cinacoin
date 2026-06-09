"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const quotas = [
  {
    name: "Compute",
    used: 32,
    total: 64,
    unit: "vCPUs",
    color: "var(--cc-ink)",
    percentage: 50,
  },
  {
    name: "Memory",
    used: 96,
    total: 192,
    unit: "GB",
    color: "var(--cc-link)",
    percentage: 50,
  },
  {
    name: "Storage",
    used: 2.4,
    total: 10,
    unit: "TB",
    color: "#50e3c2",
    percentage: 24,
  },
  {
    name: "Bandwidth",
    used: 18,
    total: 30,
    unit: "TB/mo",
    color: "#f5a623",
    percentage: 60,
  },
];

export default function QuotaUsage() {
  return (
    <div className="bg-canvas rounded-md shadow-level-2 p-6">
      <h2 className="text-heading-3 text-ink mb-4">Quota Usage</h2>
      <div className="space-y-5">
        {quotas.map((quota, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-body-sm font-medium text-ink">{quota.name}</span>
              <span className="text-body-sm text-body">
                {quota.used} / {quota.total} {quota.unit}
              </span>
            </div>
            <div className="relative h-2 bg-canvas-soft-2 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-slow"
                style={{
                  width: `${quota.percentage}%`,
                  backgroundColor: quota.color,
                }}
              />
            </div>
            <p className="text-caption text-mute mt-1">{quota.percentage}% used</p>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-hairline">
        <div className="flex items-center justify-between mb-2">
          <span className="text-body-sm text-body">Estimated Monthly Cost</span>
          <span className="text-heading-3 text-ink">$677.75</span>
        </div>
        <p className="text-caption text-mute">Based on current resource usage</p>
      </div>
    </div>
  );
}
