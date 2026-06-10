import React, { useState, lazy, Suspense } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Brand } from '@cinacoin/ui'
import { useWallet, formatAddress } from '../contexts/WalletContext'
const WalletModal = lazy(() => import('./WalletModal'))

export const SiteHeader: React.FC = () => {
  const { connected: isConnected, address, disconnect } = useWallet()
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header className="cc-navbar relative" role="banner">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" aria-label="Cinacoin home">
            <Brand as="span" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1 sm:gap-2" aria-label="Primary navigation">
            <Link
              to="/swap"
              className={`cc-navbar-link focus-ring ${location.pathname === '/swap' ? 'bg-[var(--cc-canvas-soft-2)] text-[var(--cc-ink)] font-medium' : ''}`}
              aria-current={location.pathname === '/swap' ? 'page' : undefined}
            >
              Swap
            </Link>
            <Link
              to="/multichain"
              className={`cc-navbar-link focus-ring ${location.pathname === '/multichain' ? 'bg-[var(--cc-canvas-soft-2)] text-[var(--cc-ink)] font-medium' : ''}`}
              aria-current={location.pathname === '/multichain' ? 'page' : undefined}
            >
              Multi-Chain
            </Link>
            <Link
              to="/auth"
              className={`cc-navbar-link focus-ring ${location.pathname === '/auth' ? 'bg-[var(--cc-canvas-soft-2)] text-[var(--cc-ink)] font-medium' : ''}`}
              aria-current={location.pathname === '/auth' ? 'page' : undefined}
            >
              Auth
            </Link>
          </nav>

          {/* Desktop actions */}
          <div className="hidden sm:block">
            {isConnected ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden sm:inline-flex items-center gap-2 text-[12px] px-3 py-1 rounded-full bg-[var(--cc-success)]/10 text-[var(--cc-success)] font-medium border border-[var(--cc-success)]/20" role="status">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--cc-success)] animate-pulse" />
                  Connected
                </span>
                <span className="text-[14px] font-[var(--font-mono)] text-[var(--cc-body)] bg-[var(--cc-canvas-soft-2)] px-3 py-1 rounded-md border border-[var(--cc-hairline)]">{formatAddress(address)}</span>
                <button
                  onClick={disconnect}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); disconnect(); } }}
                  className="cc-btn-secondary-sm text-[12px] px-2 py-1 rounded-lg focus-ring"
                  aria-label="Disconnect wallet"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => setWalletModalOpen(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setWalletModalOpen(true); } }}
                className="cc-btn-primary-sm text-[14px] focus-ring"
                aria-label="Connect wallet"
              >
                Connect Wallet
              </button>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-1 sm:hidden">
            {isConnected ? (
              <span className="text-[12px] font-[var(--font-mono)] text-[var(--cc-body)] bg-[var(--cc-canvas-soft-2)] px-2 py-1 rounded-md border border-[var(--cc-hairline)]" aria-label="Wallet connected">{formatAddress(address)}</span>
            ) : null}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
              className="p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--cc-muted)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft)] transition-colors"
              aria-expanded={mobileOpen}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav overlay */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 bg-[var(--color-ink)]/60 backdrop-blur-sm z-40 sm:hidden"
              onClick={() => setMobileOpen(false)}
              role="presentation"
              aria-hidden="true"
            />
            <nav className="fixed right-4 top-16 z-50 w-56 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level5)] p-2 sm:hidden" aria-label="Mobile navigation">
              <Link
                to="/swap"
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-[var(--cc-radius-sm)] text-[14px] font-medium transition-colors min-h-[44px] flex items-center ${
                  location.pathname === '/swap'
                    ? "text-[var(--cc-ink)] bg-[var(--cc-canvas-soft-2)]"
                    : "text-[var(--cc-body)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft)]"
                }`}
                aria-current={location.pathname === '/swap' ? 'page' : undefined}
              >
                Swap
              </Link>
              <Link
                to="/multichain"
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-[var(--cc-radius-sm)] text-[14px] font-medium transition-colors min-h-[44px] flex items-center ${
                  location.pathname === '/multichain'
                    ? "text-[var(--cc-ink)] bg-[var(--cc-canvas-soft-2)]"
                    : "text-[var(--cc-body)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft)]"
                }`}
                aria-current={location.pathname === '/multichain' ? 'page' : undefined}
              >
                Multi-Chain
              </Link>
              <Link
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-[var(--cc-radius-sm)] text-[14px] font-medium transition-colors min-h-[44px] flex items-center ${
                  location.pathname === '/auth'
                    ? "text-[var(--cc-ink)] bg-[var(--cc-canvas-soft-2)]"
                    : "text-[var(--cc-body)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft)]"
                }`}
                aria-current={location.pathname === '/auth' ? 'page' : undefined}
              >
                Auth
              </Link>
              <div className="border-t border-[var(--cc-hairline)] my-1" />
              {isConnected ? (
                <button
                  onClick={() => { disconnect(); setMobileOpen(false); }}
                  className="block w-full px-4 py-3 rounded-[var(--cc-radius-sm)] text-[14px] font-medium text-[var(--cc-error)] transition-colors min-h-[44px] flex items-center hover:bg-[var(--cc-canvas-soft)]"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => { setWalletModalOpen(true); setMobileOpen(false); }}
                  className="block w-full px-4 py-3 rounded-[var(--cc-radius-sm)] text-[14px] font-medium text-[var(--cc-link)] transition-colors min-h-[44px] flex items-center hover:bg-[var(--cc-canvas-soft)]"
                >
                  Connect Wallet
                </button>
              )}
            </nav>
          </>
        )}
      </header>

      <Suspense fallback={null}>
        <WalletModal
          isOpen={walletModalOpen}
          onClose={() => setWalletModalOpen(false)}
        />
      </Suspense>
    </>
  )
}

export default SiteHeader
