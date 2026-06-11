import React from 'react'
import { Link2, PenTool, Send, Image, ArrowLeftRight, Landmark, RefreshCw, Globe } from 'lucide-react'
import { DemoWallet } from '../components/DemoWallet'
import { AddressDisplay } from '../components/Others'

export function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">DEMO APPLICATION</p>
        <h1 className="cc-display-xl mb-4">
          Cinacoin <span className="text-[var(--cc-link)]">Demo</span>
        </h1>
        <p className="cc-body-lg text-[var(--cc-body)] max-w-2xl mx-auto">
          全功能演示应用，展示 Cinacoin SDK 的所有能力。
        </p>
      </div>

      {/* Feature Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <a href="/wallet-connect" className="cc-card p-6 hover:bg-[var(--cc-canvas-soft)] transition-colors">
          <Link2 className="w-6 h-6 mb-3 text-[var(--cc-ink)]" />
          <h3 className="cc-title-sm mb-2">钱包连接</h3>
          <p className="cc-body-xs text-[var(--cc-body)]">
            支持 MetaMask / WalletConnect / Coinbase
          </p>
        </a>
        <a href="/sign-message" className="cc-card p-6 hover:bg-[var(--cc-canvas-soft)] transition-colors">
          <PenTool className="w-6 h-6 mb-3 text-[var(--cc-ink)]" />
          <h3 className="cc-title-sm mb-2">签名</h3>
          <p className="cc-body-xs text-[var(--cc-body)]">
            普通消息 / EIP-712 签名
          </p>
        </a>
        <a href="/transfer" className="cc-card p-6 hover:bg-[var(--cc-canvas-soft)] transition-colors">
          <Send className="w-6 h-6 mb-3 text-[var(--cc-ink)]" />
          <h3 className="cc-title-sm mb-2">转账</h3>
          <p className="cc-body-xs text-[var(--cc-body)]">
            以太坊转账模拟
          </p>
        </a>
        <a href="/nft" className="cc-card p-6 hover:bg-[var(--cc-canvas-soft)] transition-colors">
          <Image className="w-6 h-6 mb-3 text-[var(--cc-ink)]" />
          <h3 className="cc-title-sm mb-2">NFT</h3>
          <p className="cc-body-xs text-[var(--cc-body)]">
            NFT 资产展示
          </p>
        </a>
        <a href="/bridge" className="cc-card p-6 hover:bg-[var(--cc-canvas-soft)] transition-colors">
          <ArrowLeftRight className="w-6 h-6 mb-3 text-[var(--cc-ink)]" />
          <h3 className="cc-title-sm mb-2">跨链桥接</h3>
          <p className="cc-body-xs text-[var(--cc-body)]">
            跨链资金转移
          </p>
        </a>
        <a href="/defi" className="cc-card p-6 hover:bg-[var(--cc-canvas-soft)] transition-colors">
          <Landmark className="w-6 h-6 mb-3 text-[var(--cc-ink)]" />
          <h3 className="cc-title-sm mb-2">DeFi</h3>
          <p className="cc-body-xs text-[var(--cc-body)]">
            流动性池和收益
          </p>
        </a>
        <a href="/swap" className="cc-card p-6 hover:bg-[var(--cc-canvas-soft)] transition-colors">
          <RefreshCw className="w-6 h-6 mb-3 text-[var(--cc-ink)]" />
          <h3 className="cc-title-sm mb-2">Swap</h3>
          <p className="cc-body-xs text-[var(--cc-body)]">
            去中心化交易所
          </p>
        </a>
        <a href="/multichain" className="cc-card p-6 hover:bg-[var(--cc-canvas-soft)] transition-colors">
          <Globe className="w-6 h-6 mb-3 text-[var(--cc-ink)]" />
          <h3 className="cc-title-sm mb-2">多链</h3>
          <p className="cc-body-xs text-[var(--cc-body)]">
            多链间切换
          </p>
        </a>
      </div>

      {/* Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DemoWallet />
      </div>
    </div>
  )
}
