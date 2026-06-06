import React from 'react'

export const SiteFooter: React.FC = () => {
  return (
    <footer className="cc-footer mt-auto">
      <div className="cc-container">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Cinacoin" className="h-6 w-6 rounded-md" />
            <span className="font-semibold text-sm text-[var(--cc-ink)]">Cinacoin</span>
            <span className="text-[var(--cc-muted)] text-xs">v1.0.0</span>
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="https://docs.cinacoin.com" target="_blank" rel="noopener noreferrer" className="cc-footer-link">
              Docs
            </a>
            <a href="https://github.com/cinagroup" target="_blank" rel="noopener noreferrer" className="cc-footer-link">
              GitHub
            </a>
            <a href="https://cinacoin.com" target="_blank" rel="noopener noreferrer" className="cc-footer-link">
              Back to Cinacoin
            </a>
          </div>

          <p className="text-xs text-[var(--cc-muted)]">
            © 2026 Cinacoin. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
