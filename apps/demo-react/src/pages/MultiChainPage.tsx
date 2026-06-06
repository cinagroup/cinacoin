import React, { useState } from 'react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

const CHAINS = [
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', color: '#627EEA', icon: 'Ξ', wallets: ['MetaMask', 'WalletConnect', 'Coinbase'], txs: '1.2M', tvl: '$45B' },
  { id: 'arb', name: 'Arbitrum', symbol: 'ARB', color: '#28A0F0', icon: 'λ', wallets: ['MetaMask', 'Rabby'], txs: '3.8M', tvl: '$12B' },
  { id: 'base', name: 'Base', symbol: 'BASE', color: '#0052FF', icon: 'B', wallets: ['Coinbase', 'MetaMask'], txs: '5.1M', tvl: '$8B' },
  { id: 'polygon', name: 'Polygon', symbol: 'POL', color: '#8247E5', icon: '⬡', wallets: ['MetaMask', 'WalletConnect'], txs: '4.2M', tvl: '$5B' },
  { id: 'op', name: 'Optimism', symbol: 'OP', color: '#FF0420', icon: 'O', wallets: ['MetaMask', 'Coinbase'], txs: '2.1M', tvl: '$3B' },
  { id: 'bsc', name: 'BNB Chain', symbol: 'BNB', color: '#F0B90B', icon: 'B', wallets: ['MetaMask', 'Trust Wallet'], txs: '6.3M', tvl: '$7B' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#9945FF', icon: '◎', wallets: ['Phantom', 'Solflare', 'Backpack'], txs: '8.5M', tvl: '$15B' },
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A', icon: '₿', wallets: ['Xverse', 'Leather', 'Unisat'], txs: '320K', tvl: '$120B' },
  { id: 'ton', name: 'TON', symbol: 'TON', color: '#0098EA', icon: 'T', wallets: ['Tonkeeper', 'OpenMask'], txs: '2.3M', tvl: '$1.5B' },
  { id: 'tron', name: 'TRON', symbol: 'TRX', color: '#FF0013', icon: 'T', wallets: ['TronLink', 'TronPay'], txs: '4.8M', tvl: '$8B' },
  { id: 'cosmos', name: 'Cosmos', symbol: 'ATOM', color: '#2E3148', icon: 'C', wallets: ['Keplr', 'Leap'], txs: '1.1M', tvl: '$2.5B' },
  { id: 'sui', name: 'Sui', symbol: 'SUI', color: '#4DA2FF', icon: 'S', wallets: ['Sui Wallet', 'Ethos', 'Suiet'], txs: '3.2M', tvl: '$1.2B' },
  { id: 'starknet', name: 'Starknet', symbol: 'STRK', color: '#EF6D39', icon: 'S', wallets: ['Argent X', 'Braavos'], txs: '890K', tvl: '$450M' },
  { id: 'near', name: 'NEAR', symbol: 'NEAR', color: '#00C08B', icon: 'N', wallets: ['NEAR Wallet', 'Here Wallet'], txs: '1.5M', tvl: '$800M' },
  { id: 'hedera', name: 'Hedera', symbol: 'HBAR', color: '#161E3B', icon: 'H', wallets: ['HashPack', 'Blade'], txs: '920K', py: '1' },
  { id: 'xrpl', name: 'XRPL', symbol: 'XRP', color: '#23292F', icon: 'X', wallets: ['Xaman', 'Fireblocks'], txs: '650K', tvl: '$200M' },
];

export default function MultiChainPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const chain = CHAINS.find(c => c.id === selected);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
      <SiteHeader />

      <section className="max-w-5xl mx-auto w-full pt-12 pb-24 px-4 flex-1">
        <div className="text-center mb-10">
          <h1 className="cc-display-lg text-[var(--cc-ink)] mb-3">16 chains, one SDK</h1>
          <p className="cc-body-md text-[var(--cc-muted)] max-w-lg mx-auto">EVM · Solana · Bitcoin · Layer 2s — unified API, zero fragmentation</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {CHAINS.map(c => (
            <button
              key={c.id}
              onClick={() => setSelected(selected === c.id ? null : c.id)}
              className={`cc-card !p-4 text-left transition-all border ${
                selected === c.id
                  ? 'border-[var(--cc-link)] shadow-[var(--cc-level3)] ring-2 ring-[var(--cc-link)]/10'
                  : 'border-[var(--cc-hairline)] hover:border-[var(--cc-muted)]'
              }`}
              aria-label={`Select ${c.name} chain`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-[var(--cc-ink)]" style={{ backgroundColor: c.color + '20' }}>{c.icon}</span>
                <span className="font-semibold text-sm text-[var(--cc-ink)]">{c.name}</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {c.wallets.slice(0, 3).map(w => (
                  <span key={w} className="cc-badge !bg-[var(--cc-canvas-soft-2)] text-[10px] py-0.5 px-1.5">{w}</span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {chain && (
          <div className="cc-card-lg mb-8 animate-slide-up border border-[var(--cc-link)]/10">
            <div className="flex items-center gap-4 mb-4">
              <span className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-semibold text-[var(--cc-ink)]" style={{ backgroundColor: chain.color + '20' }}>{chain.icon}</span>
              <div>
                <h2 className="cc-display-sm text-[var(--cc-ink)]">{chain.name}</h2>
                <p className="cc-body-sm text-[var(--cc-muted)] mt-0.5">{chain.wallets.join(' · ')}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[var(--cc-canvas-soft-2)] rounded-lg p-3.5 text-center border border-[var(--cc-hairline)]">
                <div className="cc-display-sm text-[var(--cc-link)]">{chain.txs}</div>
                <div className="cc-caption-mono text-[var(--cc-muted)] mt-1">TXs/day</div>
              </div>
              <div className="bg-[var(--cc-canvas-soft-2)] rounded-lg p-3.5 text-center border border-[var(--cc-hairline)]">
                <div className="cc-display-sm text-[var(--cc-link)]">{chain.tvl || 'N/A'}</div>
                <div className="cc-caption-mono text-[var(--cc-muted)] mt-1">TVL</div>
              </div>
              <div className="bg-[var(--cc-canvas-soft-2)] rounded-lg p-3.5 text-center border border-[var(--cc-hairline)] flex flex-col justify-center items-center">
                <div className="flex items-center gap-1.5 justify-center">
                  <span className="w-2 h-2 bg-[var(--cc-success)] rounded-full animate-pulse" />
                  <span className="text-[var(--cc-success)] text-sm font-semibold">Active</span>
                </div>
                <div className="cc-caption-mono text-[var(--cc-muted)] mt-1">Status</div>
              </div>
            </div>
            <button className="cc-btn-primary w-full text-base font-semibold">Connect {chain.name}</button>
          </div>
        )}

        {/* Cross-Chain Flow */}
        <div className="cc-card mb-8">
          <h2 className="cc-display-sm mb-4">Cross-chain bridge</h2>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] rounded-lg px-6 py-4 text-center min-w-[120px]">
              <span className="text-2xl">Ξ</span>
              <p className="text-sm font-semibold mt-1">Ethereum</p>
            </div>
            <span className="text-2xl text-[var(--cc-muted)]">→</span>
            <div className="bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] rounded-lg px-6 py-4 text-center min-w-[120px]">
              <span className="text-2xl">🌉</span>
              <p className="text-sm font-semibold mt-1">Relay</p>
              <p className="text-xs text-[var(--cc-muted)] cc-caption">Cinacoin</p>
            </div>
            <span className="text-2xl text-[var(--cc-muted)]">→</span>
            <div className="bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] rounded-lg px-6 py-4 text-center min-w-[120px]">
              <span className="text-2xl">◎</span>
              <p className="text-sm font-semibold mt-1">Solana</p>
            </div>
            <span className="text-2xl text-[var(--cc-muted)]">→</span>
            <div className="bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] rounded-lg px-6 py-4 text-center min-w-[120px]">
              <span className="text-2xl">₿</span>
              <p className="text-sm font-semibold mt-1">Bitcoin</p>
            </div>
          </div>
        </div>

        {/* Unified API */}
        <div className="cc-card mb-8">
          <h2 className="cc-display-sm mb-4">Unified API</h2>
          <pre className="cc-code-block">
{`import { Cinacoin } from '@cinacoin/core-sdk';

const cc = new Cinacoin({ projectId: 'YOUR_PROJECT_ID' });

// Connect to any chain with the same API
const eth = await cc.connect('ethereum', 'metamask');
const sol = await cc.connect('solana', 'phantom');
const btc = await cc.connect('bitcoin', 'xverse');`}</pre>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { l: 'Chains', v: '16', c: 'text-[var(--cc-link)]' },
            { l: 'Wallets', v: '30+', c: 'text-[var(--cc-link)]' },
            { l: 'Adapters', v: '11', c: 'text-[var(--cc-link)]' },
            { l: 'Latency', v: '<50ms', c: 'text-[var(--cc-success)]' }
          ].map(s => (
            <div key={s.l} className="cc-card !p-6 text-center border border-[var(--cc-hairline)]">
              <div className={`cc-display-md ${s.c} mb-1`}>{s.v}</div>
              <div className="cc-caption-mono text-[var(--cc-muted)]">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
