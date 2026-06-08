"use client";

export default function NotFound() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--vercel-canvas-soft)', color: 'var(--vercel-ink)' }}>
      {/* Vercel-style Header */}
      <header className="vercel-header" aria-label="Site header">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between h-full">
          <a href="/" className="flex items-center gap-2 no-underline">
            <img src="/logo.png" alt="Cinacoin" className="h-6 w-auto" />
            <span className="vercel-body-sm font-medium" style={{ color: 'var(--vercel-ink)' }}>Wallet Explorer</span>
          </a>
          <nav className="flex items-center gap-3">
            <a href="https://docs.cinacoin.com" className="vercel-body-sm hidden md:inline-block no-underline" style={{ color: 'var(--vercel-body)' }}>Docs</a>
            <a href="https://cinacoin.com" className="vercel-btn-secondary" style={{ height: '32px', fontSize: '13px', padding: '0 12px' }}>← Back</a>
          </nav>
        </div>
      </header>
      
      <main className="max-w-[1400px] mx-auto px-6 py-24">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="vercel-display-xl mb-4" style={{ color: 'var(--vercel-ink)' }}>404</h1>
          <p className="vercel-body-lg mb-8 max-w-md" style={{ color: 'var(--vercel-body)' }}>
            Page not found. The wallet explorer you&apos;re looking for doesn&apos;t exist.
          </p>
          <a
            href="/"
            className="vercel-btn-primary"
          >
            Back to Wallet Explorer
          </a>
        </div>
      </main>
      
      {/* Vercel-style Footer */}
      <footer style={{ background: 'var(--vercel-canvas)', borderTop: '1px solid var(--vercel-hairline)', padding: '64px 24px' }}>
        <div className="max-w-[1400px] mx-auto flex flex-wrap gap-12 justify-between">
          <div className="max-w-[280px] flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Cinacoin" className="h-5 w-auto" />
              <span className="vercel-body-sm font-medium" style={{ color: 'var(--vercel-ink)' }}>Cinacoin</span>
            </div>
            <p className="vercel-body-sm" style={{ color: 'var(--vercel-mute)' }}>
              Discover 100+ wallets for every chain and platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-12">
            <div>
              <p className="vercel-caption-mono mb-3" style={{ color: 'var(--vercel-mute)' }}>EXPLORER</p>
              <a href="/" className="block vercel-body-sm py-1 no-underline" style={{ color: 'var(--vercel-body)' }}>All wallets</a>
              <a href="https://docs.cinacoin.com" className="block vercel-body-sm py-1 no-underline" style={{ color: 'var(--vercel-body)' }}>Docs</a>
            </div>
            <div>
              <p className="vercel-caption-mono mb-3" style={{ color: 'var(--vercel-mute)' }}>DEVELOPERS</p>
              <a href="https://github.com/cinagroup" className="block vercel-body-sm py-1 no-underline" style={{ color: 'var(--vercel-body)' }}>GitHub</a>
              <a href="https://demo.cinacoin.com" className="block vercel-body-sm py-1 no-underline" style={{ color: 'var(--vercel-body)' }}>Demo</a>
            </div>
            <div>
              <p className="vercel-caption-mono mb-3" style={{ color: 'var(--vercel-mute)' }}>COMPANY</p>
              <a href="https://cinacoin.com" className="block vercel-body-sm py-1 no-underline" style={{ color: 'var(--vercel-body)' }}>Back to Cinacoin</a>
            </div>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto mt-12 pt-6" style={{ borderTop: '1px solid var(--vercel-hairline)' }}>
          <p className="vercel-caption" style={{ color: 'var(--vercel-mute)' }}>
            © {new Date().getFullYear()} Cinacoin. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
