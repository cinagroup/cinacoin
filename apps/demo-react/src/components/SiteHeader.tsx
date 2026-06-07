import React, { useState, lazy, Suspense } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Brand } from '@cinacoin/ui'
import { useWallet, formatAddress } from '../contexts/WalletContext'
const WalletModal = lazy(() => import('./WalletModal'))

export const SiteHeader: React.FC = () => {
  const { connected: isConnected, address, disconnect } = useWallet()
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header className="cc-navbar" role="banner">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" aria-label="Cinacoin home">
            <Brand as="span" />
          </Link>
          
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Primary navigation">
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

          <div>
            {isConnected ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[var(--cc-success)]/10 text-[var(--cc-success)] font-medium border border-[var(--cc-success)]/20" role="status">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--cc-success)] animate-pulse" />
                  Connected
                </span>
                <span className="text-sm font-mono text-[var(--cc-body)] bg-[var(--cc-canvas-soft-2)] px-2.5 py-1 rounded-md border border-[var(--cc-hairline)]">{formatAddress(address)}</span>
                <button
                  onClick={disconnect}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); disconnect(); } }}
                  className="cc-btn-secondary-sm text-xs px-2 py-1 rounded-lg focus-ring"
                  aria-label="Disconnect wallet"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => setWalletModalOpen(true)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setWalletModalOpen(true); } }}
                className="cc-btn-primary-sm text-sm focus-ring"
                aria-label="Connect wallet"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
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
