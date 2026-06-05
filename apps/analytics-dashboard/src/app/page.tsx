export default function HomePage() {
  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      color: '#1a1a2e'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊 Cinacoin Analytics</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        On-ramp conversion analytics dashboard — powered by Cinacoin
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>📈 API Endpoints</h3>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#555', fontSize: '0.9rem' }}>
            <li><code>/api/analytics/kpi</code> — KPI metrics</li>
            <li><code>/api/analytics/query</code> — Custom queries</li>
            <li><code>/api/funnel/analyze</code> — Funnel analysis</li>
          </ul>
        </div>
        <div style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>🔗 Quick Links</h3>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#555', fontSize: '0.9rem' }}>
            <li><a href="/dashboard" style={{ color: '#3b82f6' }}>Dashboard</a></li>
            <li><a href="https://demo.cinacoin.com" style={{ color: '#3b82f6' }}>Demo App</a></li>
            <li><a href="https://docs.cinacoin.com" style={{ color: '#3b82f6' }}>Documentation</a></li>
          </ul>
        </div>
      </div>

      <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#999' }}>
        Deployed on Cloudflare Workers • Cinacoin © 2026
      </p>
    </div>
  );
}
