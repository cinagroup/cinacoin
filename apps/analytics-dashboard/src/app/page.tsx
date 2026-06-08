'use client';

import { useEffect, useState, useCallback } from 'react';
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

function SkeletonCard() {
  return (
    <div className="v-stat-card animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ height: 12, width: 100, borderRadius: 4, background: 'var(--cc-hairline)' }} />
      <div style={{ height: 28, width: 80, borderRadius: 4, background: 'var(--cc-hairline)' }} />
      <div style={{ height: 16, width: 60, borderRadius: 4, background: 'var(--cc-hairline)' }} />
    </div>
  );
}

export default function HomePage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState('overview');

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`${ANALYTICS_URL}/v1/overview?days=30`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: Overview) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      >
        Skip to analytics content
      </a>

      {/* Sidebar Navigation */}
      <aside className="v-sidebar">
        <div className="v-sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cc-xs)' }}>
            <img src="/analytics/logo.svg" alt="Cinacoin" style={{ width: 24, height: 24 }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--cc-ink)' }}>Analytics</span>
          </div>
        </div>
        <nav className="v-sidebar-nav">
          <div className="v-sidebar-section">Dashboard</div>
          <button
            className="v-sidebar-item"
            data-active={activeNav === 'overview'}
            onClick={() => setActiveNav('overview')}
          >
            Overview
          </button>
          <button
            className="v-sidebar-item"
            data-active={activeNav === 'wallets'}
            onClick={() => setActiveNav('wallets')}
          >
            Wallets
          </button>
          <button
            className="v-sidebar-item"
            data-active={activeNav === 'transactions'}
            onClick={() => setActiveNav('transactions')}
          >
            Transactions
          </button>
          <button
            className="v-sidebar-item"
            data-active={activeNav === 'chains'}
            onClick={() => setActiveNav('chains')}
          >
            Chains
          </button>
          
          <div className="v-sidebar-section" style={{ marginTop: 'var(--cc-md)' }}>Settings</div>
          <button
            className="v-sidebar-item"
            data-active={activeNav === 'api'}
            onClick={() => setActiveNav('api')}
          >
            API Keys
          </button>
          <button
            className="v-sidebar-item"
            data-active={activeNav === 'team'}
            onClick={() => setActiveNav('team')}
          >
            Team
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main id="analytics-content" className="v-main">
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Page Header */}
          <div className="v-page-header">
            <div className="v-page-header__breadcrumb">Dashboard / Overview</div>
            <h1 className="v-page-header__title">Wallet analytics.</h1>
            <p className="v-page-header__desc">
              Wallet activity and transaction performance across chains, aggregated from
              ingested SDK events over the last 30 days.
            </p>
          </div>

          {/* Screen reader live region for analytics status */}
          <div role="status" aria-live="polite" className="sr-only" aria-atomic="true">
            {loading ? 'Loading analytics...' : error ? 'Analytics service is unavailable.' : !hasData ? 'No analytics data available yet.' : 'Analytics data loaded.'}
          </div>

          {loading ? (
            <>
              {/* Skeleton KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
                {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
              {/* Skeleton charts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24 }} className="cc-analytics-grid">
                <div className="v-chart-card animate-pulse" style={{ minHeight: 280 }}>
                  <div style={{ height: 20, width: 120, borderRadius: 4, background: 'var(--cc-hairline)', marginBottom: 24 }} />
                  <div style={{ height: 200, borderRadius: 'var(--v-radius-sm)', background: 'var(--cc-hairline)' }} />
                </div>
                <div className="v-chart-card animate-pulse" style={{ minHeight: 280 }}>
                  <div style={{ height: 20, width: 80, borderRadius: 4, background: 'var(--cc-hairline)', marginBottom: 24 }} />
                  <div style={{ height: 160, borderRadius: 'var(--v-radius-sm)', background: 'var(--cc-hairline)' }} />
                </div>
              </div>
            </>
          ) : error ? (
            <div className="v-chart-card" style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ fontSize: 14, color: 'var(--cc-body)', marginBottom: 16 }}>
                Analytics service is unavailable: {error}
              </p>
              <button onClick={loadData} className="v-btn-secondary">
                Retry
              </button>
            </div>
          ) : !hasData ? (
            <div className="v-chart-card" style={{ color: 'var(--cc-muted)', padding: 48 }}>
              No events recorded yet. Once your apps send SDK analytics events, wallet
              activity and transaction metrics will appear here.
            </div>
          ) : (
            <>
              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
                {kpis.map((k) => (
                  <div key={k.label} className="v-stat-card">
                    <div className="v-stat-card__label">{k.label}</div>
                    <div className="v-stat-card__value">{k.value}</div>
                    <div className={`v-stat-card__delta ${k.positive ? 'v-stat-card__delta--positive' : 'v-stat-card__delta--negative'}`}>
                      {k.delta}
                    </div>
                    <div className="v-stat-card__caption">{k.caption}</div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24, marginBottom: 32 }} className="cc-analytics-grid">
                {/* Daily transactions */}
                <div className="v-chart-card">
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
                    <h2 className="v-chart-card__title" style={{ margin: 0 }}>Transactions</h2>
                    <span style={{ fontFamily: 'var(--v-font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--cc-muted)' }}>Last 30 days</span>
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
                          transition: 'opacity 0.15s ease, transform 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scaleY(1.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scaleY(1)'; }}
                      />
                    ))}
                  </div>
                </div>

                {/* Top chains */}
                <div className="v-chart-card">
                  <h2 className="v-chart-card__title">Top chains</h2>
                  {data && data.chains.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {data.chains.map((c) => {
                        const pct = totalChain > 0 ? Math.round((c.count / totalChain) * 100) : 0;
                        return (
                          <div key={c.chainId} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 14, color: 'var(--cc-ink)' }}>{chainName(c.chainId)}</span>
                              <span style={{ fontSize: 14, color: 'var(--cc-muted)' }}>{pct}%</span>
                            </div>
                            <div style={{ height: 8, borderRadius: 9999, background: 'var(--cc-canvas-soft-2)', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--cc-primary)', borderRadius: 9999 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: 14, color: 'var(--cc-muted)' }}>
                      No chain data yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Sample Data Table */}
              <div className="v-chart-card">
                <h2 className="v-chart-card__title">Recent Transactions</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table className="v-table">
                    <thead>
                      <tr>
                        <th>Hash</th>
                        <th>Chain</th>
                        <th>Status</th>
                        <th>Amount</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontFamily: 'var(--v-font-mono)', fontSize: 13 }}>0x1a2b...3c4d</td>
                        <td>Ethereum</td>
                        <td><span style={{ color: 'var(--cc-success)' }}>Confirmed</span></td>
                        <td>1.5 ETH</td>
                        <td style={{ color: 'var(--cc-muted)' }}>2m ago</td>
                      </tr>
                      <tr>
                        <td style={{ fontFamily: 'var(--v-font-mono)', fontSize: 13 }}>0x5e6f...7g8h</td>
                        <td>Base</td>
                        <td><span style={{ color: 'var(--cc-success)' }}>Confirmed</span></td>
                        <td>500 USDC</td>
                        <td style={{ color: 'var(--cc-muted)' }}>5m ago</td>
                      </tr>
                      <tr>
                        <td style={{ fontFamily: 'var(--v-font-mono)', fontSize: 13 }}>0x9i0j...1k2l</td>
                        <td>Arbitrum</td>
                        <td><span style={{ color: 'var(--cc-warning)' }}>Pending</span></td>
                        <td>0.8 ETH</td>
                        <td style={{ color: 'var(--cc-muted)' }}>12m ago</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
