const KPIS = [
  { label: 'On-ramp volume', value: '$2.84M', delta: '+12.4%', positive: true, caption: 'Last 30 days' },
  { label: 'Active wallets', value: '18,402', delta: '+6.1%', positive: true, caption: 'Unique, 30d' },
  { label: 'Transactions', value: '142,910', delta: '+9.7%', positive: true, caption: 'Settled, 30d' },
  { label: 'Conversion rate', value: '63.8%', delta: '-1.2%', positive: false, caption: 'Quote → settle' },
];

// Demo daily volume (last 30 days), normalized 0..1 for the bar heights.
const VOLUME = [
  0.42, 0.48, 0.39, 0.55, 0.61, 0.58, 0.5, 0.63, 0.69, 0.64, 0.72, 0.68, 0.6, 0.74,
  0.8, 0.77, 0.7, 0.82, 0.86, 0.79, 0.73, 0.85, 0.9, 0.84, 0.78, 0.88, 0.93, 0.87, 0.81, 0.95,
];

const CHAINS = [
  { name: 'Ethereum', pct: 38 },
  { name: 'Base', pct: 21 },
  { name: 'Solana', pct: 17 },
  { name: 'Arbitrum', pct: 12 },
  { name: 'Polygon', pct: 7 },
  { name: 'Others', pct: 5 },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <header className="cc-navbar">
        <div className="cc-container" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="https://cinacoin.com" className="flex items-center gap-2" style={{ textDecoration: 'none' }} aria-label="Cinacoin home">
            <img src="/logo.png" alt="Cinacoin logo" width={28} height={28} className="rounded-md" style={{ height: 28, width: 28 }} />
            <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px', color: 'var(--cc-ink)' }}>
              Cinacoin <span style={{ color: 'var(--cc-muted)', fontWeight: 400 }}>Analytics</span>
            </span>
          </a>
          <nav className="flex items-center gap-1">
            <a className="cc-navbar-link" href="https://demo.cinacoin.com">Demo</a>
            <a className="cc-navbar-link" href="https://docs.cinacoin.com">Docs</a>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, padding: '48px 0' }}>
        <div className="cc-container" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="cc-caption-mono" style={{ color: 'var(--cc-muted)' }}>OVERVIEW · DEMO DATA</span>
            <h1 className="cc-display-lg" style={{ color: 'var(--cc-ink)' }}>On-ramp analytics.</h1>
            <p className="cc-body-lg" style={{ color: 'var(--cc-body)', maxWidth: 640 }}>
              Fiat-to-crypto conversion performance across chains. Figures below are illustrative demo data.
            </p>
          </div>

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {KPIS.map((k) => (
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
            {/* Volume bars */}
            <div className="cc-card-lg">
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 className="cc-display-sm" style={{ color: 'var(--cc-ink)' }}>On-ramp volume</h2>
                <span className="cc-caption-mono" style={{ color: 'var(--cc-muted)' }}>LAST 30 DAYS</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 200 }}>
                {VOLUME.map((v, i) => (
                  <div
                    key={i}
                    title={`Day ${i + 1}`}
                    style={{
                      flex: 1,
                      height: `${Math.round(v * 100)}%`,
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {CHAINS.map((c) => (
                  <div key={c.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="cc-body-sm" style={{ color: 'var(--cc-ink)' }}>{c.name}</span>
                      <span className="cc-body-sm" style={{ color: 'var(--cc-muted)' }}>{c.pct}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 9999, background: 'var(--cc-canvas-soft-2)', overflow: 'hidden' }}>
                      <div style={{ width: `${c.pct}%`, height: '100%', background: 'var(--cc-primary)', borderRadius: 9999 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="cc-footer">
        <div className="cc-container" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="" width={20} height={20} style={{ height: 20, width: 20 }} className="rounded" />
            <span className="cc-caption" style={{ color: 'var(--cc-muted)' }}>© 2026 Cinacoin · Demo data, illustrative only</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <a className="cc-footer-link" href="https://docs.cinacoin.com">Docs</a>
            <a className="cc-footer-link" href="https://github.com/cinagroup">GitHub</a>
            <a className="cc-footer-link" href="https://cinacoin.com">Back to Cinacoin</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
