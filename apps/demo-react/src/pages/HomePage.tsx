import React from 'react'
import { Link } from 'react-router-dom'
import { Link2, PenTool, Send, Image, ArrowLeftRight, Landmark, RefreshCw, Globe } from 'lucide-react'
import { DemoWallet } from '../components/DemoWallet'

const FEATURES = [
  { href: '/wallet-connect', icon: Link2, title: 'Wallet connection.', desc: 'MetaMask, WalletConnect, Coinbase.' },
  { href: '/sign-message', icon: PenTool, title: 'Message signing.', desc: 'Plain text and EIP-712 signatures.' },
  { href: '/transfer', icon: Send, title: 'Token transfer.', desc: 'Simulated Ethereum transfers.' },
  { href: '/nft', icon: Image, title: 'NFT gallery.', desc: 'Multi-chain NFT collection viewer.' },
  { href: '/bridge', icon: ArrowLeftRight, title: 'Cross-chain bridge.', desc: 'Transfer assets between chains.' },
  { href: '/defi', icon: Landmark, title: 'DeFi interaction.', desc: 'Liquidity pools and staking yields.' },
  { href: '/swap', icon: RefreshCw, title: 'Token swap.', desc: 'Decentralized exchange aggregator.' },
  { href: '/multichain', icon: Globe, title: 'Multi-chain.', desc: 'Switch between 16 supported chains.' },
]

export function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <p className="cc-caption-mono text-[var(--cc-muted)] mb-3">DEMO APPLICATION</p>
        <h1 className="cc-display-xl mb-4">
          CinaCoin <span className="text-[var(--cc-link)]">Demo</span>.
        </h1>
        <p className="cc-body-lg text-[var(--cc-body)] max-w-2xl mx-auto">
          Full-featured demo showcasing the CinaCoin SDK capabilities.
        </p>
      </div>

      {/* Feature Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map((feature) => (
          <Link
            key={feature.href}
            to={feature.href}
            className="cc-card group hover:border-[var(--cc-hairline-strong)] transition-all"
          >
            <feature.icon className="w-6 h-6 mb-3 text-[var(--cc-ink)] group-hover:text-[var(--cc-link)] transition-colors" aria-hidden="true" />
            <h3 className="cc-display-sm mb-2">{feature.title}</h3>
            <p className="cc-body-sm text-[var(--cc-body)]">{feature.desc}</p>
          </Link>
        ))}
      </div>

      {/* Demo Wallet */}
      <div>
        <DemoWallet />
      </div>
    </div>
  )
}
