'use client'

import { useState } from 'react'
import { useCinacoinWallet } from '@cinacoin/appkit-config/react'

/**
 * Swap Widget — demonstrates token swap functionality
 * Uses Reown AppKit's built-in swap modal
 */
export function SwapWidget() {
  const { isConnected, address } = useCinacoinWallet()
  const [fromToken, setFromToken] = useState('ETH')
  const [toToken, setToToken] = useState('USDC')
  const [amount, setAmount] = useState('')

  const tokens = [
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'DAI', name: 'Dai' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin' },
  ]

  if (!isConnected) {
    return (
      <div className="cc-card">
        <h3 className="cc-display-sm mb-4">Swap Tokens</h3>
        <p className="cc-body-sm text-[var(--cc-muted)]">Connect your wallet to swap tokens</p>
      </div>
    )
  }

  return (
    <div className="cc-card space-y-4">
      <h3 className="cc-display-sm">Swap Tokens</h3>
      <p className="cc-caption font-[var(--font-mono)] text-[var(--cc-body)]">
        From: {address?.slice(0, 8)}...{address?.slice(-4)}
      </p>

      <div className="space-y-3">
        {/* From field */}
        <div className="space-y-2">
          <label className="cc-caption text-[var(--cc-muted)]">From</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 cc-form-input focus-ring"
            />
            <select
              value={fromToken}
              onChange={(e) => setFromToken(e.target.value)}
              className="cc-form-input cursor-pointer focus-ring"
            >
              {tokens.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
            </select>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center py-1">
          <span className="text-[var(--cc-muted)] text-display-sm" aria-hidden="true">↓</span>
        </div>

        {/* To field */}
        <div className="space-y-2">
          <label className="cc-caption text-[var(--cc-muted)]">To</label>
          <div className="flex gap-2">
            <input type="text" placeholder="0.0" readOnly className="flex-1 cc-form-input text-[var(--cc-muted)]" />
            <select
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
              className="cc-form-input cursor-pointer focus-ring"
            >
              {tokens.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
            </select>
          </div>
        </div>

        {/* Swap button */}
        <button
          className="cc-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
          disabled={!amount}
        >
          Swap
        </button>
      </div>
    </div>
  )
}
