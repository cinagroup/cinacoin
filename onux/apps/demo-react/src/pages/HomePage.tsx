import React, { useState, lazy, Suspense, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { useWallet, formatAddress } from '../contexts/WalletContext'
import { useChainInfo } from '../hooks/useChainInfo'

const WalletModal = lazy(() => import('../components/WalletModal'))

interface Chain {
  name: string
  color: string
  emoji: string
}

interface Feature {
  icon: string
  title: string
  desc: string
}

const CHAINS: Chain[] = [
  { name: 'Ethereum', color: '#627EEA', emoji: '⟠' },
  { name: 'Solana', color: '#9945FF', emoji: '◎' },
  { name: 'Polygon', color: '#8247E5', emoji: '⬡' },
  { name: 'Arbitrum', color: '#28A0F0', emoji: '🔵' },
  { name: 'Optimism', color: '#FF0420', emoji: '🔴' },
  { name: 'Base', color: '#0052FF', emoji: '🔷' },
  { name: 'BNB Chain', color: '#F3BA2F', emoji: '🟡' },
  { name: 'Avalanche', color: '#E84142', emoji: '🔺' },
  { name: 'Fantom', color: '#1969FF', emoji: '👻' },
  { name: 'Celo', color: '#FCFF52', emoji: '🌿' },
  { name: 'zkSync', color: '#4E529A', emoji: '🟣' },
  { name: 'Linea', color: '#121212', emoji: '📐' },
  { name: 'Scroll', color: '#FFDE59', emoji: '📜' },
  { name: 'Gnosis', color: '#48A9A6', emoji: '🧠' },
  { name: 'Moonbeam', color: '#FF68B1', emoji: '🌙' },
  { name: 'Aptos', color: '#2DD8A3', emoji: '🅰️' },
]

const FEATURES: Feature[] = [
  { icon: '🔗', title: 'Universal connector', desc: 'One API for 30+ wallets. MetaMask, WalletConnect, Coinbase, Rainbow, Phantom, and more.' },
  { icon: '🌐', title: 'Multi-chain support', desc: '16 chains supported out of the box. EVM, Solana, Aptos — all unified under one interface.' },
  { icon: '🔐', title: 'SIWE auth', desc: 'Sign-In with Ethereum for secure, passwordless authentication. One click login, fully on-chain.' },
  { icon: '🔄', title: 'Swap integration', desc: 'Built-in token swap UI with multi-chain routing. Best rates across all supported DEXes.' },
  { icon: '📱', title: 'Mobile ready', desc: 'Responsive design that works perfectly on any device. Deep linking for native wallet apps.' },
  { icon: '🧩', title: 'Plug & play', desc: 'Install, configure, connect. Under 5 minutes to full wallet integration in any React app.' },
]

const HomePage: React.FC = () => {
  const { connected: isConnected, address, chainId, disconnect } = useWallet()
  const chainInfo = useChainInfo(chainId || null, address || null)
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [selectedChain, setSelectedChain] = useState('Ethereum')

  // Lock body scroll when wallet modal is open
  useEffect(() => {
    if (walletModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [walletModalOpen])

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cc-canvas-soft)]">
      <SiteHeader />

      <Suspense fallback={null}>
        <WalletModal
          isOpen={walletModalOpen}
          onClose={() => setWalletModalOpen(false)}
        />
      </Suspense>

      <main id="main-content" role="main">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32" aria-label="Hero">
        {/* Mesh gradient background — the ONLY decorative chrome per DESIGN.md */}
        <div className="absolute inset-0 cc-mesh-gradient" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] text-[var(--cc-link)] cc-caption-mono mb-6">
              ✨ Open source • 64 packages • Zero cost
            </span>
          </div>
          {/* display-xl: 48px/600/48px/-2.4px, sentence-case period-terminated */}
          <h1 className="cc-display-xl mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Connect any wallet,
            <br />
            <span>on any chain.</span>
          </h1>
          <p className="cc-body-lg text-[var(--cc-muted)] mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            One SDK, infinite possibilities. Unify wallet connections, multi-chain swaps,
            and SIWE authentication in your app — in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={() => setWalletModalOpen(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setWalletModalOpen(true); } }}
              className="cc-btn-primary px-8 w-full sm:w-auto focus-ring"
              aria-label={isConnected ? 'Reconnect wallet' : 'Connect wallet'}
            >
              {isConnected ? 'Reconnect wallet' : 'Connect wallet'}
            </button>
            <Link
              to="/swap"
              className="cc-btn-secondary px-8 w-full sm:w-auto focus-ring"
              aria-label="Try the swap demo"
            >
              Try swap demo →
            </Link>
          </div>
        </div>
      </section>

      {/* Connected State */}
      {isConnected && (
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 animate-slide-up" aria-label="Connected wallet info">
          <div className="cc-card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--cc-canvas-soft-2)] flex items-center justify-center text-lg border border-[var(--cc-hairline)]" aria-hidden="true">
                  👤
                </div>
                <div>
                  <p className="font-mono text-[var(--cc-ink)] cc-body-md-strong">{formatAddress(address)}</p>
                  <p className="cc-body-sm text-[var(--cc-muted)]">
                    {chainInfo.chainName}
                    {chainInfo.loading ? ' ⏳' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-sm border-l border-[var(--cc-hairline)] pl-4">
                  {chainInfo.blockNumber && (
                    <div>
                      <p className="text-[var(--cc-muted)] text-xs cc-caption">Block</p>
                      <p className="font-mono font-medium text-[var(--cc-link)]">#{chainInfo.blockNumber}</p>
                    </div>
                  )}
                  {chainInfo.balanceEth && (
                    <div>
                      <p className="text-[var(--cc-muted)] text-xs cc-caption">Balance</p>
                      <p className="font-mono font-medium text-[var(--cc-success)]">{chainInfo.balanceEth} ETH</p>
                    </div>
                  )}
                  {chainInfo.error && (
                    <p className="text-xs text-[var(--cc-error)] font-medium" role="alert">{chainInfo.error}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <label htmlFor="chain-select" className="text-sm text-[var(--cc-muted)] cc-body-sm">Chain:</label>
                <select
                  id="chain-select"
                  value={selectedChain}
                  onChange={(e) => setSelectedChain(e.target.value)}
                  className="cc-form-input !h-9 !w-auto text-sm"
                  aria-label="Select chain"
                >
                  {CHAINS.map(c => (
                    <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>
                  ))}
                </select>
                <button
                  onClick={disconnect}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); disconnect(); } }}
                  className="cc-btn-secondary-sm text-sm !h-9 px-4 focus-ring"
                  aria-label="Disconnect wallet"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Bar */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12" aria-label="Statistics">
        <div className="cc-card">
          <div className="flex flex-wrap items-center justify-around gap-6 text-center">
            {[
              { label: 'Packages', value: '64' },
              { label: 'Chains', value: '16' },
              { label: 'Wallets', value: '30+' },
              { label: 'Cost', value: '$0' },
              { label: 'Open source', value: '100%' },
            ].map((stat) => (
              <div key={stat.label} className="min-w-[120px]">
                <p className="cc-display-md text-[var(--cc-ink)]">{stat.value}</p>
                <p className="cc-caption-mono text-[var(--cc-muted)] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16" aria-label="Features">
        <div className="text-center mb-12">
          {/* display-lg: 32px/600/40px/-1.28px, sentence-case period-terminated */}
          <h2 className="cc-display-lg mb-4">Everything you need.</h2>
          <p className="cc-body-md text-[var(--cc-muted)] max-w-xl mx-auto">
            A complete wallet connection toolkit, open source and free.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <article
              key={feature.title}
              className="cc-card animate-fade-in-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="text-3xl mb-4" aria-hidden="true">{feature.icon}</div>
              <h3 className="cc-display-sm mb-2">{feature.title}</h3>
              <p className="cc-body-sm text-[var(--cc-muted)] leading-relaxed">{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Chain Showcase */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 mb-16" aria-label="Supported chains">
        <div className="text-center mb-12">
          <h2 className="cc-display-lg mb-4">16 chains supported.</h2>
          <p className="cc-body-md text-[var(--cc-muted)] max-w-xl mx-auto">
            From Ethereum to Solana, EVM to non-EVM — connect to any chain seamlessly.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {CHAINS.map((chain, i) => (
            <div
              key={chain.name}
              className="cc-card !p-4 text-center cursor-pointer animate-fade-in-up group focus-ring"
              style={{ animationDelay: `${i * 0.04}s` }}
              tabIndex={0}
              role="listitem"
              aria-label={`${chain.name} blockchain`}
            >
              <div
                className="w-12 h-12 rounded-md mx-auto mb-3 flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: chain.color + '15' }}
                aria-hidden="true"
              >
                {chain.emoji}
              </div>
              <p className="cc-body-sm-strong text-[var(--cc-body)]">{chain.name}</p>
            </div>
          ))}
        </div>
      </section>

      </main>

      <SiteFooter />
    </div>
  )
}

export default HomePage
