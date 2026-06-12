"use client";

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
    color: "var(--cc-cyan)",
    percentage: 24,
  },
  {
    name: "Bandwidth",
    used: 18,
    total: 30,
    unit: "TB/mo",
    color: "var(--cc-warning)",
    percentage: 60,
  },
];

export default function QuotaUsage() {
  return (
    <div className="bg-[var(--cc-canvas)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level2)] p-6">
      <p className="cc-caption-mono text-[var(--cc-muted)] mb-2">QUOTAS</p>
      <h2 className="cc-body-md-strong text-[var(--cc-ink)] mb-4">Quota usage.</h2>
      <div className="space-y-5">
        {quotas.map((quota) => (
          <div key={quota.name}>
            <div className="flex items-center justify-between mb-2">
              <span className="cc-body-sm-strong text-[var(--cc-ink)]">{quota.name}</span>
              <span className="cc-body-sm text-[var(--cc-body)]">
                {quota.used} / {quota.total} {quota.unit}
              </span>
            </div>
            <div className="relative h-2 bg-[var(--cc-canvas-soft-2)] rounded-full overflow-hidden" role="progressbar" aria-valuenow={quota.percentage} aria-valuemin={0} aria-valuemax={100} aria-label={`${quota.name}: ${quota.percentage}% used`}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all"
                style={{
                  width: `${quota.percentage}%`,
                  backgroundColor: quota.color,
                }}
              />
            </div>
            <p className="cc-caption text-[var(--cc-muted)] mt-1">{quota.percentage}% used</p>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-[var(--cc-hairline)]">
        <div className="flex items-center justify-between mb-2">
          <span className="cc-body-sm text-[var(--cc-body)]">Estimated monthly cost.</span>
          <span className="cc-display-sm text-[var(--cc-ink)]">$677.75</span>
        </div>
        <p className="cc-caption text-[var(--cc-muted)]">Based on current resource usage.</p>
      </div>
    </div>
  );
}
