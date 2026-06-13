import React, { useState, useEffect, useRef } from 'react';

/**
 * MOCK PRICES — These are illustrative only, not live data.
 * A production swap would pull prices from a DEX aggregator API
 * (e.g. 1inch, Jupiter, CoW Protocol, or on-chain oracles).
 */
const TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', balance: '2.4821', price: 2995.67, icon: 'Ξ', color: 'var(--cc-demo-chain-ethereum)', chain: 'Ethereum' },
  { symbol: 'USDC', name: 'USD Coin', balance: '12,450.00', price: 1.00, icon: '$', color: 'var(--cc-demo-token-usdc)', chain: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana', balance: '45.82', price: 178.34, icon: '◎', color: 'var(--cc-demo-chain-solana)', chain: 'Solana' },
  { symbol: 'BTC', name: 'Bitcoin', balance: '0.1234', price: 104820, icon: '₿', color: 'var(--cc-demo-chain-bitcoin)', chain: 'Bitcoin' },
  { symbol: 'ARB', name: 'Arbitrum', balance: '5,200.00', price: 0.89, icon: 'λ', color: 'var(--cc-demo-chain-arbitrum)', chain: 'Arbitrum' },
  { symbol: 'POL', name: 'Polygon', balance: '8,500.00', price: 0.24, icon: '⬡', color: 'var(--cc-demo-chain-polygon)', chain: 'Polygon' },
];

const RECENT_SWAPS = [
  { from: 'ETH', to: 'USDC', amount: '0.5', received: '1,497.84', route: 'Uniswap V3', status: 'completed', time: '2m ago' },
  { from: 'SOL', to: 'USDC', amount: '10.0', received: '1,783.40', route: 'Jupiter', status: 'completed', time: '15m ago' },
  { from: 'USDC', to: 'ARB', amount: '500', received: '561.80', route: 'Camelot', status: 'pending', time: '1h ago' },
  { from: 'ETH', to: 'BTC', amount: '0.1', received: '0.0028', route: 'tBTC Bridge', status: 'completed', time: '3h ago' },
];

/* TokenSelector extracted to avoid remounting on parent re-render */
interface TokenSelectorProps {
  show: boolean
  onClose: () => void
  onSelect: (index: number) => void
  label: string
}

function TokenSelector({ show, onClose, onSelect, label }: TokenSelectorProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!show) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [show, onClose])

  useEffect(() => {
    if (!show || !modalRef.current) return
    const modal = modalRef.current
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    modal.addEventListener('keydown', handleKeyDown)
    const firstFocusable = modal.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()
    return () => modal.removeEventListener('keydown', handleKeyDown)
  }, [show])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-[var(--color-ink)]/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div ref={modalRef} className="relative w-full max-w-sm cc-card-lg !p-6">
        <h3 className="cc-display-sm mb-4" id="token-selector-title">{label}.</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1" role="listbox" aria-labelledby="token-selector-title">
          {TOKENS.map((t, i) => (
            <button
              key={t.symbol}
              onClick={() => { onSelect(i); onClose(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(i); onClose(); } }}
              className="w-full flex items-center gap-3 p-3 rounded-sm hover:bg-[var(--cc-canvas-soft-2)] transition-colors text-left focus-ring"
              role="option"
              aria-selected={false}
            >
              <span className="w-8 h-8 rounded-sm flex items-center justify-center text-body-sm font-medium text-[var(--cc-ink)]" style={{ backgroundColor: t.color + '20' }} aria-hidden="true">{t.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-body-sm text-[var(--cc-ink)]">{t.symbol}</p>
                <p className="text-caption text-[var(--cc-muted)]">{t.name}</p>
              </div>
              <div className="text-right">
                <p className="text-body-sm text-[var(--cc-ink)]">{t.balance}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SwapPage() {
  const [fromToken, setFromToken] = useState(0);
  const [toToken, setToToken] = useState(1);
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [flipped, setFlipped] = useState(false);
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);
  const [swapStatus, setSwapStatus] = useState<'idle' | 'swapping' | 'done'>('idle');

  const from = TOKENS[fromToken];
  const to = TOKENS[toToken];
  const amount = parseFloat(fromAmount) || 0;
  const toAmount = amount > 0 ? ((amount * from.price) / to.price).toFixed(to.price > 100 ? 6 : 2) : '';
  const usdValue = amount > 0 ? `≈ $${(amount * from.price).toFixed(2)}` : '';
  const rate = from.price > 0 ? `1 ${from.symbol} = ${(from.price / to.price).toFixed(to.price > 100 ? 6 : 4)} ${to.symbol}` : '';

  const handleFlip = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFlipped(!flipped);
  };

  const handleSwap = () => {
    if (amount <= 0 || swapStatus === 'swapping') return;
    setSwapStatus('swapping');
    setTimeout(() => {
      setSwapStatus('done');
      setFromAmount('');
      setTimeout(() => setSwapStatus('idle'), 2500);
    }, 1200);
  };

  return (
    <section className="max-w-md mx-auto w-full py-12 px-4" aria-label="Token swap">
      <h1 className="cc-display-lg text-center mb-8">Swap tokens.</h1>

      <div className="cc-card space-y-4">
        {/* FROM */}
        <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-4 border border-[var(--cc-hairline)]">
          <div className="flex justify-between mb-2">
            <span className="cc-caption text-[var(--cc-muted)]">From</span>
            <span className="cc-caption text-[var(--cc-muted)]">Balance: {from.balance} {from.symbol}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setShowFromSelector(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowFromSelector(true); } }}
              className="flex items-center gap-2 px-3 py-2 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-sm hover:bg-[var(--cc-canvas-soft-2)] transition-colors shrink-0 focus-ring"
              aria-label={`Select token to swap from, currently ${from.symbol}`}
            >
              <span className="w-5 h-5 rounded-sm flex items-center justify-center text-caption font-medium text-[var(--cc-ink)]" style={{ backgroundColor: from.color + '20' }} aria-hidden="true">{from.icon}</span>
              <span className="font-medium text-body-sm text-[var(--cc-ink)]">{from.symbol}</span>
              <span className="text-[var(--cc-muted)] text-caption" aria-hidden="true">▾</span>
            </button>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={fromAmount}
              onChange={e => setFromAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-transparent text-right text-display-md font-medium text-[var(--cc-ink)] outline-none placeholder:text-[var(--cc-muted)] w-24 focus-ring"
              aria-label="Amount to swap from"
            />
          </div>
          {amount > 0 && <p className="text-caption text-[var(--cc-muted)] mt-2 text-right">{usdValue}</p>}
        </div>

        {/* Flip Arrow */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={handleFlip}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlip(); } }}
            className={`w-9 h-9 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-sm flex items-center justify-center hover:bg-[var(--cc-canvas-soft-2)] transition-all duration-300 shadow-[var(--cc-level2)] ${flipped ? 'rotate-180' : ''} focus-ring`}
            aria-label="Switch from and to tokens"
          >
            ⇅
          </button>
        </div>

        {/* TO */}
        <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-4 border border-[var(--cc-hairline)]">
          <div className="flex justify-between mb-2">
            <span className="cc-caption text-[var(--cc-muted)]">To</span>
            <span className="cc-caption text-[var(--cc-muted)]">Balance: {to.balance} {to.symbol}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setShowToSelector(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowToSelector(true); } }}
              className="flex items-center gap-2 px-3 py-2 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-sm hover:bg-[var(--cc-canvas-soft-2)] transition-colors shrink-0 focus-ring"
              aria-label={`Select token to swap to, currently ${to.symbol}`}
            >
              <span className="w-5 h-5 rounded-sm flex items-center justify-center text-caption font-medium text-[var(--cc-ink)]" style={{ backgroundColor: to.color + '20' }} aria-hidden="true">{to.icon}</span>
              <span className="font-medium text-body-sm text-[var(--cc-ink)]">{to.symbol}</span>
              <span className="text-[var(--cc-muted)] text-caption" aria-hidden="true">▾</span>
            </button>
            <div className="flex-1 text-right text-display-md font-medium text-[var(--cc-muted)] truncate">{toAmount || '0.0'}</div>
          </div>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSwap(); } }}
          disabled={amount <= 0 || swapStatus === 'swapping'}
          className="cc-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
          aria-label={swapStatus === 'swapping' ? 'Swap in progress' : swapStatus === 'done' ? 'Swap complete' : amount > 0 ? 'Swap tokens' : 'Enter an amount to swap'}
        >
          {swapStatus === 'swapping'
            ? 'Swapping…'
            : swapStatus === 'done'
            ? '✓ Swap complete (demo)'
            : amount > 0
            ? 'Swap'
            : 'Enter an amount'}
        </button>
      </div>

      {/* Swap Details */}
      {amount > 0 && (
        <div className="cc-card-soft mt-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-sm bg-[var(--cc-warning)]/10 border border-[var(--cc-warning)]/20 text-[var(--cc-warning)] text-caption font-medium" role="alert">
              ⚠️ Mock prices — not live data
            </span>
          </div>
          <div className="flex justify-between text-body-sm"><span className="text-[var(--cc-muted)] cc-body-sm">Rate</span><span className="font-[var(--font-mono)] text-caption">{rate}</span></div>
          <div className="flex justify-between text-body-sm"><span className="text-[var(--cc-muted)] cc-body-sm">Network fee</span><span className="text-[var(--cc-success)] font-medium">~$2.34</span></div>
          <div className="flex justify-between items-center text-body-sm">
            <span className="text-[var(--cc-muted)] cc-body-sm">Slippage</span>
            <div className="flex gap-1 bg-[var(--cc-canvas)] p-1 rounded-sm border border-[var(--cc-hairline)]">
              {['0.1', '0.5', '1.0'].map(s => (
                <button
                  key={s}
                  onClick={() => setSlippage(s)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSlippage(s); } }}
                  className="cc-tab-ghost !h-6 !px-3 text-caption rounded-sm focus-ring"
                  data-active={slippage === s}
                  role="radio"
                  aria-checked={slippage === s}
                  aria-label={`Slippage ${s}%`}
                >
                  {s}%
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between text-body-sm"><span className="text-[var(--cc-muted)] cc-body-sm">Price impact</span><span className="text-[var(--cc-success)] font-medium">0.02%</span></div>
          <div className="flex justify-between text-body-sm"><span className="text-[var(--cc-muted)] cc-body-sm">Minimum received</span><span className="font-medium">{(parseFloat(toAmount || '0') * 0.995).toFixed(2)} {to.symbol}</span></div>
          <div className="pt-2 border-t border-[var(--cc-hairline)] text-caption text-[var(--cc-muted)] cc-caption">Route: {from.symbol} → {to.symbol} via Uniswap V3</div>
        </div>
      )}

      {/* Powered by */}
      <p className="text-center text-caption text-[var(--cc-muted)] cc-caption mt-4">
        Powered by <span className="font-medium text-[var(--cc-body)]">CinaCoin Swap SDK</span>
        {' · '}<span className="text-[var(--cc-warning)]/70">Demo mode — prices are illustrative</span>
      </p>

      {/* Recent Swaps */}
      <div className="mt-12">
        <h2 className="cc-display-sm mb-4">Recent swaps.</h2>
        <div className="cc-card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-[var(--cc-hairline)] text-[var(--cc-muted)] text-caption bg-[var(--cc-canvas-soft-2)]">
                  <th scope="col" className="text-left p-4 font-medium cc-caption-mono">Pair</th>
                  <th scope="col" className="text-left p-4 font-medium cc-caption-mono">Route</th>
                  <th scope="col" className="text-left p-4 font-medium cc-caption-mono">Status</th>
                  <th scope="col" className="text-right p-4 font-medium cc-caption-mono">Time</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_SWAPS.map((s, i) => (
                  <tr key={i} className="border-b border-[var(--cc-hairline)]/50 hover:bg-[var(--cc-canvas-soft-2)]/30 transition-colors">
                    <td className="p-4 text-[var(--cc-ink)]"><span className="font-medium">{s.from}</span><span className="text-[var(--cc-muted)] mx-1">→</span><span className="font-medium">{s.to}</span></td>
                    <td className="p-4 text-[var(--cc-body)] font-medium text-caption">{s.route}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm text-caption font-medium ${s.status === 'completed' ? 'bg-[var(--cc-success)]/10 text-[var(--cc-success)]' : 'bg-[var(--cc-warning)]/10 text-[var(--cc-warning)]'}`}>
                        <span className={`w-1.5 h-1.5 rounded-sm ${s.status === 'completed' ? 'bg-[var(--cc-success)] animate-pulse' : 'bg-[var(--cc-warning)]'}`} />
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-right text-[var(--cc-muted)] cc-caption">{s.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TokenSelector show={showFromSelector} onClose={() => setShowFromSelector(false)} onSelect={(i: number) => { setFromToken(i); if (i === toToken) setToToken(fromToken); }} label="Select Token" />
      <TokenSelector show={showToSelector} onClose={() => setShowToSelector(false)} onSelect={(i: number) => { setToToken(i); if (i === fromToken) setFromToken(toToken); }} label="Select Token" />
    </section>
  );
}
