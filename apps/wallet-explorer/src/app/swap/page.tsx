'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';

export default function SwapPage() {
  const { connected, address, balance, connect } = useWallet();
  const [fromToken, setFromToken] = useState('CINA');
  const [toToken, setToToken] = useState('USDT');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [swapping, setSwapping] = useState(false);
  const [swapped, setSwapped] = useState(false);

  // Mock exchange rates
  const rates: Record<string, number> = {
    'CINA-USDT': 0.85,
    'CINA-ETH': 0.00035,
    'CINA-BTC': 0.000015,
    'USDT-CINA': 1.18,
    'ETH-CINA': 2857,
    'BTC-CINA': 66667,
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    if (value && rates[`${fromToken}-${toToken}`]) {
      const converted = parseFloat(value) * rates[`${fromToken}-${toToken}`];
      setToAmount(converted.toFixed(6));
    } else {
      setToAmount('');
    }
  };

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAmount || !toAmount) return;
    setSwapping(true);
    // TODO: Integrate real swap functionality
    await new Promise((r) => setTimeout(r, 1500));
    setSwapping(false);
    setSwapped(true);
    setTimeout(() => setSwapped(false), 3000);
    setFromAmount('');
    setToAmount('');
  };

  const handleReverseTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  if (!connected) {
    return (
      <div className="card text-center py-12">
        <h2 className="text-heading-2 text-ink">Swap Tokens</h2>
        <p className="mt-2 text-body text-mute">Connect your wallet to swap tokens.</p>
        <button onClick={connect} className="btn btn-primary mt-6">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-2 text-ink">Swap Tokens</h1>
        <p className="mt-1 text-body text-mute">Exchange tokens at the best rates.</p>
      </div>

      <div className="card">
        <div className="mb-6 flex items-center justify-between rounded-lg bg-canvas-soft-2 p-4">
          <div>
            <p className="text-caption text-mute">Available Balance</p>
            <p className="mt-1 text-display-sm text-ink">{balance} CINA</p>
          </div>
          <code className="text-caption-mono text-mute">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </code>
        </div>

        {swapped && (
          <div className="mb-6 rounded-lg bg-success-light p-4 text-body-sm" style={{ color: 'var(--color-success)' }}>
            ✓ Swap submitted successfully!
          </div>
        )}

        <form onSubmit={handleSwap} className="space-y-5">
          {/* From Token */}
          <div>
            <label className="block text-caption text-mute mb-2">From</label>
            <div className="flex gap-3">
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="search-bar w-32"
              >
                <option value="CINA">CINA</option>
                <option value="USDT">USDT</option>
                <option value="ETH">ETH</option>
                <option value="BTC">BTC</option>
              </select>
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                placeholder="0.00"
                className="search-bar flex-1"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          {/* Reverse Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleReverseTokens}
              className="p-2 rounded-lg bg-canvas-soft-2 hover:bg-canvas-soft transition-colors"
            >
              <svg className="w-5 h-5 text-body" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* To Token */}
          <div>
            <label className="block text-caption text-mute mb-2">To</label>
            <div className="flex gap-3">
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="search-bar w-32"
              >
                <option value="USDT">USDT</option>
                <option value="CINA">CINA</option>
                <option value="ETH">ETH</option>
                <option value="BTC">BTC</option>
              </select>
              <input
                type="text"
                value={toAmount}
                placeholder="0.00"
                className="search-bar flex-1"
                readOnly
              />
            </div>
          </div>

          {/* Exchange Rate Info */}
          {fromAmount && toAmount && (
            <div className="rounded-lg bg-canvas-soft-2 p-4 space-y-2">
              <div className="flex justify-between text-body-sm">
                <span className="text-mute">Exchange Rate</span>
                <span className="text-ink font-[var(--font-mono)]">
                  1 {fromToken} = {rates[`${fromToken}-${toToken}`]} {toToken}
                </span>
              </div>
              <div className="flex justify-between text-body-sm">
                <span className="text-mute">Network Fee (est.)</span>
                <span className="text-ink font-[var(--font-mono)]">~0.005 CINA</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={swapping || !fromAmount || !toAmount}
            className="btn btn-primary w-full py-3"
          >
            {swapping ? 'Swapping...' : 'Swap'}
          </button>
        </form>
      </div>
    </div>
  );
}
