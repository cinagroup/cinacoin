import {
  Link2,
  PenTool,
  Send,
  Image,
  ArrowLeftRight,
  Landmark,
  RefreshCw,
  Globe,
  CreditCard,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { DemoWallet } from '../components/DemoWallet';

const FEATURES = [
  {
    href: '/wallet-connect',
    icon: Link2,
    title: 'Wallet connection.',
    desc: 'MetaMask, Cinacoin, Coinbase.',
  },
  {
    href: '/sign-message',
    icon: PenTool,
    title: 'Message signing.',
    desc: 'Plain text and EIP-712 signatures.',
  },
  {
    href: '/transfer',
    icon: Send,
    title: 'Token transfer.',
    desc: 'Simulated Ethereum transfers.',
  },
  { href: '/nft', icon: Image, title: 'NFT gallery.', desc: 'Multi-chain NFT collection viewer.' },
  {
    href: '/bridge',
    icon: ArrowLeftRight,
    title: 'Cross-chain bridge.',
    desc: 'Transfer assets between chains.',
  },
  {
    href: '/defi',
    icon: Landmark,
    title: 'DeFi interaction.',
    desc: 'Liquidity pools and staking yields.',
  },
  {
    href: '/swap',
    icon: RefreshCw,
    title: 'Token swap.',
    desc: 'Decentralized exchange aggregator.',
  },
  {
    href: '/onramp',
    icon: CreditCard,
    title: 'Buy crypto.',
    desc: 'Fiat on-ramp with multiple providers.',
  },
  {
    href: '/multichain',
    icon: Globe,
    title: 'Multi-chain.',
    desc: 'Switch between 16 supported chains.',
  },
];

export function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
      {/* Hero Section - left-aligned for variety */}
      <div className="max-w-2xl">
        <h1 className="cc-display-xl mb-4">
          Cinacoin <span className="text-[var(--cc-link)]">Demo</span>.
        </h1>
        <p className="cc-body-lg text-[var(--cc-body)]">
          Full-featured demo showcasing the Cinacoin SDK capabilities.
        </p>
      </div>

      {/* Demo Wallet - moved up for immediate interaction */}
      <div>
        <DemoWallet />
      </div>

      {/* Feature Navigation - 2-column on desktop for different rhythm */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURES.map((feature) => (
          <Link
            key={feature.href}
            to={feature.href}
            className="cc-card group hover:border-[var(--cc-hairline-strong)] transition-all"
          >
            <feature.icon
              className="w-6 h-6 mb-3 text-[var(--cc-ink)] group-hover:text-[var(--cc-link)] transition-colors"
              aria-hidden="true"
            />
            <h3 className="cc-display-sm mb-2">{feature.title}</h3>
            <p className="cc-body-sm text-[var(--cc-body)]">{feature.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
