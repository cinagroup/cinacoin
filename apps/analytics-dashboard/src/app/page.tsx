'use client';

import { useEffect, useState } from 'react';
import { SiteHeader, SiteFooter } from '@cinacoin/ui';

// Analytics ingestion + query Worker (packages/analytics-server). The
// dashboard is a static export, so it queries this Worker directly from the
// browser rather than via in-app API routes.
const ANALYTICS_URL =
  process.env.NEXT_PUBLIC_ANALYTICS_URL ||
  'https://analytics-api.cinacoin.com';

interface Overview {
  period: { days: number; from: number; to: number };
  kpis: {
    activeWallets: { value: number; deltaPct: number };
    transactions: { value: number; deltaPct: number };
    conversionRate: { value: number; deltaPct: number };
  };
  dailyTransactions: { date: string; count: number }[];
  chains: { chainId: string; count: number }[];
}

// Friendly chain names for common chainIds; falls back to the raw id.
const CHAIN_NAMES: Record<string, string> = {
  '1': 'Ethereum',
  '8453': 'Base',
  '42161': 'Arbitrum',
  '137': 'Polygon',
  '10': 'Optimism',
  '56': 'BNB Chain',
  '43114': 'Avalanche',
};

function chainName(id: string): string {
  return CHAIN_NAMES[id] ?? `Chain ${id}`;
}

function fmtInt(n: number): string {
  return n.toLocaleString();
}

function fmtDelta(pct: number): string {
  const r = Math.round(pct * 10) / 10;
  return `${r >= 0 ? '+' : ''}${r}%`;
}

export default function HomePage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${ANALYTICS_URL}/v1/overview?days=30`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: Overview) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = data
    ? [
        {
          label: 'Active wallets',
          value: fmtInt(data.kpis.activeWallets.value),
          delta: fmtDelta(data.kpis.activeWallets.deltaPct),
          positive: data.kpis.activeWallets.deltaPct >= 0,
          caption: 'Unique, 30d',
        },
        {
          label: 'Transactions',
          value: fmtInt(data.kpis.transactions.value),
          delta: fmtDelta(data.kpis.transactions.deltaPct),
          positive: data.kpis.transactions.deltaPct >= 0,
          caption: 'Confirmed, 30d',
        },
        {
          label: 'Conversion rate',
          value: `${data.kpis.conversionRate.value}%`,
          delta: fmtDelta(data.kpis.conversionRate.deltaPct),
          positive: data.kpis.conversionRate.deltaPct >= 0,
          caption: 'Confirmed / attempted',
        },
      ]
    : [];

  const dailyCounts = data?.dailyTransactions.map((d) => d.count) ?? [];
  const maxCount = Math.max(1, ...dailyCounts);
  const totalChain = data?.chains.reduce((s, c) => s + c.count, 0) ?? 0;
  const hasData =
    data != null &&
    (data.kpis.transactions.value > 0 ||
      data.kpis.activeWallets.value > 0 ||
      dailyCounts.some((c) => c > 0));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Skip to content link for accessibility */}
      <a
        href="#analytics-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--cc-primary)] focus:text-[var(--cc-on-primary)] focus:rounded-[var(--cc-radius-sm)]"
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 50 }}
      >
        Skip to analytics content
      </a>

      <SiteHeader
        logoSrc="/analytics/logo.svg"
        sublabel="Analytics"
        links={[
          { label: 'Demo', href: 'https://cinacoin.com/demo' },
          { label: 'Docs', href: 'https://cinacoin.com/docs' },
        ]}
      />

      <main id="analytics-content" style={{ flex: 1, padding: '48px 0' }}>
        <div className="cc-container" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="cc-caption-mono" style={{ color: 'var(--cc-muted)' }}>Overview</span>
            <h1 className="cc-display-lg" style={{ color: 'var(--cc-ink)' }}>Wallet analytics.</h1>
            <p className="cc-body-lg" style={{ color: 'var(--cc-body)', maxWidth: 640 }}>
              Wallet activity and transaction performance across chains, aggregated from
              ingested SDK events over the last 30 days.
            </p>
          </div>

          {/* Screen reader live region for analytics status */}
          <div role="status" aria-live="polite" className="sr-only" aria-atomic="true">
            {loading ? 'Loading analytics...' : error ? 'Analytics service is unavailable.' : !hasData ? 'No analytics data available yet.' : 'Analytics data loaded.'}
          </div>

          {loading ? (
            <div className="cc-card" style={{ color: 'var(--cc-muted)' }}>Loading analytics…</div>
          ) : error ? (
            <div className="cc-card" style={{ color: 'var(--cc-muted)' }}>
              Analytics service is unavailable right now. Try again shortly.
            </div>
          ) : !hasData ? (
            <div className="cc-card" style={{ color: 'var(--cc-muted)' }}>
              No events recorded yet. Once your apps send SDK analytics events, wallet
              activity and transaction metrics will appear here.
            </div>
          ) : (
            <>
              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                {kpis.map((k) => (
                  <div key={k.label} className="cc-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="cc-caption-mono" style={{ color: 'var(--cc-muted)' }}>{k.label}</span>
                      <span
                        className="cc-badge"
                        style={{
                          color: k.positive ? 'var(--cc-success)' : 'var(--cc-error)',
                          background: 'var(--cc-canvas-soft-2)',
                        }}
                      >
                        {k.delta}
                      </span>
                    </div>
                    <span className="cc-display-md" style={{ color: 'var(--cc-ink)' }}>{k.value}</span>
                    <span className="cc-caption" style={{ color: 'var(--cc-muted)' }}>{k.caption}</span>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24 }} className="cc-analytics-grid">
                {/* Daily transactions */}
                <div className="cc-card-lg">
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h2 className="cc-display-sm" style={{ color: 'var(--cc-ink)' }}>Transactions</h2>
                    <span className="cc-caption-mono" style={{ color: 'var(--cc-muted)' }}>Last 30 days</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 200 }}>
                    {dailyCounts.map((count, i) => (
                      <div
                        key={i}
                        title={`${data?.dailyTransactions[i]?.date ?? ''}: ${count}`}
                        style={{
                          flex: 1,
                          height: `${Math.max(2, Math.round((count / maxCount) * 100))}%`,
                          borderRadius: '4px 4px 0 0',
                          background: 'linear-gradient(180deg, var(--cc-gradient-develop-start), var(--cc-gradient-develop-end))',
                          opacity: 0.85,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Top chains */}
                <div className="cc-card-lg">
                  <h2 className="cc-display-sm" style={{ color: 'var(--cc-ink)', marginBottom: 24 }}>Top chains</h2>
                  {data && data.chains.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {data.chains.map((c) => {
                        const pct = totalChain > 0 ? Math.round((c.count / totalChain) * 100) : 0;
                        return (
                          <div key={c.chainId} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span className="cc-body-sm" style={{ color: 'var(--cc-ink)' }}>{chainName(c.chainId)}</span>
                              <span className="cc-body-sm" style={{ color: 'var(--cc-muted)' }}>{pct}%</span>
                            </div>
                            <div style={{ height: 8, borderRadius: 9999, background: 'var(--cc-canvas-soft-2)', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--cc-primary)', borderRadius: 9999 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="cc-body-sm" style={{ color: 'var(--cc-muted)' }}>
                      No chain data yet.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <SiteFooter
        logoSrc="/analytics/logo.svg"
        tagline="Wallet and transaction analytics, aggregated from ingested SDK events."
        columns={[
          {
            heading: 'Analytics',
            links: [
              { label: 'Overview', href: 'https://cinacoin.com/analytics' },
              { label: 'Demo', href: 'https://cinacoin.com/demo' },
            ],
          },
          {
            heading: 'Developers',
            links: [
              { label: 'Docs', href: 'https://cinacoin.com/docs' },
              { label: 'GitHub', href: 'https://github.com/cinagroup' },
            ],
          },
          {
            heading: 'Company',
            links: [{ label: 'Back to Cinacoin', href: 'https://cinacoin.com' }],
          },
        ]}
      />
    </div>
  );
}
