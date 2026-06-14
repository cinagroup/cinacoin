'use client'

import { useState } from 'react'
import { useCinacoinWallet } from '@cinacoin/appkit-config/react'

/**
 * On-Ramp Widget — demonstrates fiat-to-crypto purchase
 * Uses Reown AppKit's built-in on-ramp providers
 */
export function OnRampWidget() {
  const { isConnected, address } = useCinacoinWallet()
  const [fiatAmount, setFiatAmount] = useState('100')
  const [fiatCurrency, setFiatCurrency] = useState('USD')
  const [cryptoToken, setCryptoToken] = useState('ETH')

  const providers = [
    { id: 'stripe', name: 'Stripe', fee: '1.5%' },
    { id: 'moonpay', name: 'MoonPay', fee: '2.5%' },
    { id: 'ramp', name: 'Ramp', fee: '1.2%' },
    { id: 'coinbase-pay', name: 'Coinbase Pay', fee: '1.8%' },
  ]

  if (!isConnected) {
    return (
      <div className="cc-card">
        <h3 className="cc-display-sm mb-4">Buy Crypto</h3>
        <p className="cc-body-sm text-[var(--cc-muted)]">Connect your wallet to buy crypto</p>
      </div>
    )
  }

  return (
    <div className="cc-card space-y-4">
      <h3 className="cc-display-sm">Buy Crypto</h3>
      <p className="cc-caption font-[var(--font-mono)] text-[var(--cc-body)]">
        To: {address?.slice(0, 8)}...{address?.slice(-4)}
      </p>

      <div className="space-y-4">
        {/* Amount field */}
        <div className="space-y-2">
          <label className="cc-caption text-[var(--cc-muted)]">Amount</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={fiatAmount}
              onChange={(e) => setFiatAmount(e.target.value)}
              className="flex-1 cc-form-input focus-ring"
            />
            <select
              value={fiatCurrency}
              onChange={(e) => setFiatCurrency(e.target.value)}
              className="cc-form-input cursor-pointer focus-ring"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        {/* Receive token */}
        <div className="space-y-2">
          <label className="cc-caption text-[var(--cc-muted)]">Receive</label>
          <select
            value={cryptoToken}
            onChange={(e) => setCryptoToken(e.target.value)}
            className="cc-form-input w-full cursor-pointer focus-ring"
          >
            <option value="ETH">Ethereum (ETH)</option>
            <option value="USDC">USD Coin (USDC)</option>
            <option value="BTC">Bitcoin (BTC)</option>
          </select>
        </div>

        {/* Providers */}
        <div className="space-y-2">
          <label className="cc-caption text-[var(--cc-muted)]">Providers</label>
          <div className="space-y-2">
            {providers.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] rounded-sm hover:bg-[var(--cc-canvas-soft)] transition-colors"
              >
                <span className="text-body-sm font-medium text-[var(--cc-ink)]">{p.name}</span>
                <span className="cc-caption text-[var(--cc-muted)]">Fee: {p.fee}</span>
                <button className="cc-btn-primary-sm focus-ring">Buy</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
