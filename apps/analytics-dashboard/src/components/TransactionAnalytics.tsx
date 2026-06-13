'use client';

import React, { useMemo } from 'react';

interface TransactionData {
  date: string;
  volume: number;
  count: number;
  gasUsed: number;
  gasCost: number;
}

interface FailedTransaction {
  reason: string;
  count: number;
  percentage: number;
}

const transactionData: TransactionData[] = [
  { date: 'Jun 1', volume: 2450000, count: 12500, gasUsed: 2.1, gasCost: 45 },
  { date: 'Jun 2', volume: 2680000, count: 13200, gasUsed: 2.3, gasCost: 48 },
  { date: 'Jun 3', volume: 2320000, count: 11800, gasUsed: 1.9, gasCost: 42 },
  { date: 'Jun 4', volume: 2890000, count: 14100, gasUsed: 2.5, gasCost: 52 },
  { date: 'Jun 5', volume: 3120000, count: 15200, gasUsed: 2.7, gasCost: 55 },
  { date: 'Jun 6', volume: 2950000, count: 14500, gasUsed: 2.4, gasCost: 50 },
  { date: 'Jun 7', volume: 3340000, count: 16200, gasUsed: 2.8, gasCost: 58 },
  { date: 'Jun 8', volume: 3180000, count: 15600, gasUsed: 2.6, gasCost: 54 },
  { date: 'Jun 9', volume: 3450000, count: 16800, gasUsed: 2.9, gasCost: 60 },
  { date: 'Jun 10', volume: 3280000, count: 16100, gasUsed: 2.7, gasCost: 56 },
];

const failedTransactions: FailedTransaction[] = [
  { reason: 'Insufficient Gas', count: 1250, percentage: 35 },
  { reason: 'Slippage Exceeded', count: 890, percentage: 25 },
  { reason: 'Nonce Too Low', count: 640, percentage: 18 },
  { reason: 'Contract Reverted', count: 420, percentage: 12 },
  { reason: 'Out of Gas', count: 250, percentage: 7 },
  { reason: 'Other', count: 110, percentage: 3 },
];

function VolumeChart({ data }: { data: TransactionData[] }) {
  const width = 600;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVolume = useMemo(() => Math.max(...data.map((d) => d.volume)), [data]);

  const points = useMemo(
    () =>
      data.map((d, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartW;
        const y = padding.top + chartH - (d.volume / maxVolume) * chartH;
        return { x, y, ...d };
      }),
    [data, maxVolume, chartW, chartH]
  );

  const pathD = useMemo(
    () => points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '),
    [points]
  );
  const areaD = useMemo(
    () =>
      `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`,
    [pathD, points, chartH]
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      role="img"
      aria-label={`Transaction volume trend showing daily volume over ${data.length} days`}
    >
      <defs>
        <linearGradient id="volumeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0070f3" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0070f3" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y = padding.top + chartH * (1 - pct);
        const value = (maxVolume * pct) / 1000000;
        return (
          <g key={pct}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="var(--cc-hairline)"
              strokeDasharray="3 3"
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              className="fill-ink-mute"
              style={{ fontSize: 'var(--cc-text-xs)' }}
            >
              {'$'}
              {value.toFixed(1)}M
            </text>
          </g>
        );
      })}

      {/* X-axis labels */}
      {data.map((d, i) => {
        if (i % 2 !== 0) return null;
        const x = padding.left + (i / (data.length - 1)) * chartW;
        return (
          <text
            key={d.date}
            x={x}
            y={height - 8}
            textAnchor="middle"
            className="fill-ink-mute"
            style={{ fontSize: 'var(--cc-text-xs)' }}
          >
            {d.date}
          </text>
        );
      })}

      {/* Area + Line */}
      <path d={areaD} fill="url(#volumeGradient)" />
      <path d={pathD} fill="none" stroke="#0070f3" strokeWidth="2" strokeLinecap="round" />

      {/* Points */}
      {points.map((p) => (
        <circle key={p.date} cx={p.x} cy={p.y} r="4" fill="#0070f3" stroke="white" strokeWidth="2">
          <title>{`${p.date}: $${(p.volume / 1000000).toFixed(2)}M`}</title>
        </circle>
      ))}
    </svg>
  );
}

export default React.memo(function TransactionAnalytics() {
  const totalVolume = useMemo(() => transactionData.reduce((sum, d) => sum + d.volume, 0), []);
  const totalTx = useMemo(() => transactionData.reduce((sum, d) => sum + d.count, 0), []);
  const avgGasCost = useMemo(
    () => transactionData.reduce((sum, d) => sum + d.gasCost, 0) / transactionData.length,
    []
  );
  const totalFailed = useMemo(() => failedTransactions.reduce((sum, f) => sum + f.count, 0), []);

  return (
    <div className="space-y-lg">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm">
        <div className="cc-card p-md">
          <p className="text-caption text-[var(--cc-muted)]">Total volume</p>
          <p className="text-display-sm text-[var(--cc-ink)] mt-1">{`$${(totalVolume / 1000000).toFixed(2)}M`}</p>
        </div>
        <div className="cc-card p-md">
          <p className="text-caption text-[var(--cc-muted)]">Transactions</p>
          <p className="text-display-sm text-[var(--cc-ink)] mt-1">{totalTx.toLocaleString()}</p>
        </div>
        <div className="cc-card p-md">
          <p className="text-caption text-[var(--cc-muted)]">Avg gas cost</p>
          <p className="text-display-sm text-[var(--cc-ink)] mt-1">{`$${avgGasCost.toFixed(2)}`}</p>
        </div>
        <div className="cc-card p-md">
          <p className="text-caption text-[var(--cc-muted)]">Failed</p>
          <p className="text-display-sm text-[var(--cc-error)] mt-1">
            {totalFailed.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Volume Trend Chart */}
      <div className="cc-card p-lg">
        <div className="flex items-baseline justify-between mb-md">
          <h3 className="text-heading-3 text-[var(--cc-ink)]">Transaction volume</h3>
          <span className="text-caption text-[var(--cc-muted)]">Last 10 days</span>
        </div>
        <VolumeChart data={transactionData} />
      </div>

      {/* Gas Statistics */}
      <div className="cc-card p-lg">
        <div className="flex items-baseline justify-between mb-md">
          <h3 className="text-heading-3 text-[var(--cc-ink)]">Gas usage</h3>
          <span className="text-caption text-[var(--cc-muted)]">Recent days</span>
        </div>
        <div className="space-y-sm">
          {transactionData.slice(-5).map((d) => (
            <div
              key={d.date}
              className="flex items-center justify-between p-sm bg-[var(--cc-canvas-soft)] rounded-sm"
            >
              <div>
                <p className="text-body-sm font-medium text-[var(--cc-ink)]">{d.date}</p>
                <p className="text-caption text-[var(--cc-muted)]">
                  {d.count.toLocaleString()} transactions
                </p>
              </div>
              <div className="flex items-center gap-lg">
                <div className="text-right">
                  <p className="text-caption text-[var(--cc-muted)]">Gas Used</p>
                  <p className="text-body-sm font-medium text-[var(--cc-ink)]">{d.gasUsed}M</p>
                </div>
                <div className="text-right">
                  <p className="text-caption text-[var(--cc-muted)]">Avg Cost</p>
                  <p className="text-body-sm font-medium text-[var(--cc-ink)]">{`$${d.gasCost}`}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Failed Transactions Analysis */}
      <div className="cc-card p-lg">
        <div className="flex items-baseline justify-between mb-md">
          <h3 className="text-heading-3 text-[var(--cc-ink)]">Failed transactions</h3>
          <span className="text-caption text-[var(--cc-muted)]">By reason</span>
        </div>
        <div className="space-y-sm">
          {failedTransactions.map((f) => (
            <div key={f.reason}>
              <div className="flex items-center justify-between mb-xs">
                <span className="text-body-sm text-[var(--cc-body)]">{f.reason}</span>
                <div className="flex items-center gap-sm">
                  <span className="text-body-sm text-[var(--cc-muted)]">
                    {f.count.toLocaleString()}
                  </span>
                  <span className="text-body-sm font-medium text-[var(--cc-ink)] w-12 text-right">
                    {f.percentage}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-[var(--cc-canvas-soft-2)] rounded-sm overflow-hidden">
                <div
                  className="h-full bg-[var(--cc-error)] transition-all duration-500"
                  style={{ width: `${f.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Failure Rate */}
        <div className="mt-lg p-md bg-[var(--cc-error-light)] rounded-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm font-medium text-[var(--cc-error)]">
                Overall Failure Rate
              </p>
              <p className="text-caption text-[var(--cc-muted)]">Last 10 days</p>
            </div>
            <p className="text-display-sm text-[var(--cc-error)]">
              {((totalFailed / totalTx) * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
