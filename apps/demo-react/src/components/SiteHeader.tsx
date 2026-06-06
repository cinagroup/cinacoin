import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWallet, formatAddress } from '../contexts/WalletContext'
import WalletModal from './WalletModal'

export const SiteHeader: React.FC = () => {
  const { connected: isConnected, address, disconnect } = useWallet()
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      <header className="cc-navbar">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Cinacoin" className="h-7 w-7 rounded-md" />
            <span className="font-semibold text-lg tracking-tight text-[var(--cc-ink)]">Cinacoin</span>
          </Link>
          
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link 
              to="/swap" 
              className={`cc-navbar-link ${location.pathname === '/swap' ? 'bg-[var(--cc-canvas-soft-2)] text-[var(--cc-ink)] font-medium' : ''}`}
            >
              Swap
            </Link>
            <Link 
              to="/multichain" 
              className={`cc-navbar-link ${location.pathname === '/multichain' ? 'bg-[var(--cc-canvas-soft-2)] text-[var(--cc-ink)] font-medium' : ''}`}
            >
              Multi-Chain
            </Link>
            <Link 
              to="/auth" 
              className={`cc-navbar-link ${location.pathname === '/auth' ? 'bg-[var(--cc-canvas-soft-2)] text-[var(--cc-ink)] font-medium' : ''}`}
            >
              Auth
            </Link>
          </nav>

          <div>
            {isConnected ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[var(--cc-success)]/10 text-[var(--cc-success)] font-medium border border-[var(--cc-success)]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--cc-success)] animate-pulse" />
                  Connected
                </span>
                <span className="text-sm font-mono text-[var(--cc-body)] bg-[var(--cc-canvas-soft-2)] px-2.5 py-1 rounded-md border border-[var(--cc-hairline)]">{formatAddress(address)}</span>
                <button
                  onClick={disconnect}
                  className="cc-btn-secondary-sm text-xs px-2 py-1 rounded-lg"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => setWalletModalOpen(true)}
                className="cc-btn-primary-sm text-sm"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
    </>
  )
}

export default SiteHeader
