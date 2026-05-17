'use client';

import { useState, useCallback, useMemo } from 'react';
import DemoLayout from '@/components/DemoLayout';

// ─── Token Data ───────────────────────────────────────────────────────────

interface Token {
  symbol: string;
  name: string;
  icon: string;
  balance: number;
  decimals: number;
  price: number; // USD
  chain: string;
}

const TOKENS: Token[] = [
  { symbol: 'ETH', name: 'Ethereum', icon: '⟠', balance: 12.4831, decimals: 18, price: 3245.67, chain: 'Ethereum' },
  { symbol: 'USDC', name: 'USD Coin', icon: '◎', balance: 8420.50, decimals: 6, price: 1.00, chain: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana', icon: '✦', balance: 154.22, decimals: 9, price: 178.43, chain: 'Solana' },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', balance: 0.8765, decimals: 8, price: 67234.12, chain: 'Bitcoin' },
];

// ─── Mock Recent Swaps ────────────────────────────────────────────────────

interface SwapRecord {
  id: string;
  from: string;
  to: string;
  fromAmount: string;
  toAmount: string;
  rate: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  route: string;
}

const RECENT_SWAPS: SwapRecord[] = [
  { id: '0x1a2b', from: 'ETH', to: 'USDC', fromAmount: '2.5000', toAmount: '8,114.18', rate: '1 ETH = 3,245.67 USDC', timestamp: '2 min ago', status: 'completed', route: 'ETH → Uniswap V3 → USDC' },
  { id: '0x3c4d', from: 'SOL', to: 'ETH', fromAmount: '50.0000', toAmount: '2.7563', rate: '1 SOL = 0.0551 ETH', timestamp: '15 min ago', status: 'completed', route: 'SOL → Jupiter → Wormhole → ETH' },
  { id: '0x5e6f', from: 'USDC', to: 'BTC', fromAmount: '10,000.00', toAmount: '0.1487', rate: '1 BTC = 67,234.12 USDC', timestamp: '1 hr ago', status: 'completed', route: 'USDC → ThorChain → BTC' },
  { id: '0x7g8h', from: 'BTC', to: 'SOL', fromAmount: '0.0500', toAmount: '18.8371', rate: '1 BTC = 376.74 SOL', timestamp: '3 hr ago', status: 'pending', route: 'BTC → ThorChain → SOL' },
  { id: '0x9i0j', from: 'ETH', to: 'SOL', fromAmount: '1.0000', toAmount: '18.1893', rate: '1 ETH = 18.19 SOL', timestamp: '5 hr ago', status: 'failed', route: 'ETH → Wormhole → SOL' },
];

// ─── Token Selector Dropdown ──────────────────────────────────────────────

function TokenSelector({
  tokens,
  selected,
  onSelect,
  label,
}: {
  tokens: Token[];
  selected: Token;
  onSelect: (t: Token) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-gray-700/80 hover:bg-gray-600/80 rounded-xl px-3 py-2 transition-colors border border-gray-600/50"
      >
        <span className="text-xl leading-none">{selected.icon}</span>
        <span className="font-bold text-white text-sm">{selected.symbol}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-full mt-2 left-0 w-64 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
            <div className="p-2 border-b border-gray-700">
              <p className="text-xs text-gray-400 px-2 py-1 font-semibold uppercase tracking-wider">Select Token</p>
            </div>
            {tokens.map((t) => (
              <button
                key={t.symbol}
                onClick={() => { onSelect(t); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700/60 transition-colors ${
                  t.symbol === selected.symbol ? 'bg-gray-700/40' : ''
                }`}
              >
                <span className="text-2xl leading-none">{t.icon}</span>
                <div className="text-left flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm">{t.symbol}</div>
                  <div className="text-xs text-gray-400 truncate">{t.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white">{t.balance.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{t.chain}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Swap Detail Row ──────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'green' | 'red' | 'yellow';
}) {
  const color = highlight === 'green'
    ? 'text-emerald-400'
    : highlight === 'red'
    ? 'text-red-400'
    : highlight === 'yellow'
    ? 'text-amber-400'
    : 'text-gray-300';

  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm font-medium ${color}`}>{value}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function SwapPage() {
  const [fromToken, setFromToken] = useState<Token>(TOKENS[0]); // ETH
  const [toToken, setToToken] = useState<Token>(TOKENS[1]);   // USDC
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [walletConnected, setWalletConnected] = useState(false);
  const [swapState, setSwapState] = useState<'idle' | 'swapping' | 'success'>('idle');

  // Computed values
  const toAmount = useMemo(() => {
    const amt = parseFloat(fromAmount);
    if (isNaN(amt) || amt <= 0) return '';
    const rate = fromToken.price / toToken.price;
    const result = amt * rate;
    return result.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }, [fromAmount, fromToken, toToken]);

  const rate = useMemo(() => {
    const r = fromToken.price / toToken.price;
    return `1 ${fromToken.symbol} = ${r.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${toToken.symbol}`;
  }, [fromToken, toToken]);

  const priceImpact = useMemo(() => {
    const amt = parseFloat(fromAmount);
    if (isNaN(amt) || amt <= 0) return '0.00';
    // Simulate: larger amounts = higher impact
    const usdValue = amt * fromToken.price;
    const impact = Math.min(usdValue / 500000, 2.5); // caps at 2.5%
    return impact.toFixed(2);
  }, [fromAmount, fromToken]);

  const feeUsd = useMemo(() => {
    return (parseFloat(fromAmount || '0') * fromToken.price * 0.003).toFixed(2);
  }, [fromAmount, fromToken]);

  const minReceived = useMemo(() => {
    const amt = parseFloat(toAmount.replace(/,/g, ''));
    if (isNaN(amt) || amt <= 0) return '';
    return (amt * (1 - slippage / 100)).toLocaleString(undefined, { maximumFractionDigits: 6 });
  }, [toAmount, slippage]);

  const usdValue = useMemo(() => {
    const amt = parseFloat(fromAmount);
    if (isNaN(amt) || amt <= 0) return '$0.00';
    return `$${(amt * fromToken.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [fromAmount, fromToken]);

  const canSwap = walletConnected && parseFloat(fromAmount) > 0 && fromToken.symbol !== toToken.symbol;

  const insufficientBalance = useMemo(() => {
    const amt = parseFloat(fromAmount);
    return !isNaN(amt) && amt > fromToken.balance;
  }, [fromAmount, fromToken]);

  const handleSwapTokens = useCallback(() => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount.replace(/,/g, ''));
  }, [fromToken, toToken, toAmount]);

  const handleSwap = useCallback(() => {
    if (!canSwap) return;
    setSwapState('swapping');
    setTimeout(() => setSwapState('success'), 2000);
    setTimeout(() => setSwapState('idle'), 4500);
  }, [canSwap]);

  const handleMax = useCallback(() => {
    setFromAmount(fromToken.balance.toString());
  }, [fromToken]);

  // Button text & state
  const buttonText = useMemo(() => {
    if (!walletConnected) return 'Connect Wallet';
    if (swapState === 'success') return '✓ Swap Successful!';
    if (swapState === 'swapping') return 'Swapping...';
    if (insufficientBalance) return 'Insufficient Balance';
    if (!fromAmount || parseFloat(fromAmount) === 0) return 'Enter an amount';
    if (fromToken.symbol === toToken.symbol) return 'Select different tokens';
    return 'Swap';
  }, [walletConnected, swapState, insufficientBalance, fromAmount, fromToken, toToken]);

  const buttonDisabled = !canSwap || swapState !== 'idle';

  return (
    <DemoLayout>
      <div className="max-w-xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Token Swap
          </h1>
          <p className="text-gray-400 text-sm">Swap tokens across chains with the best rates</p>
        </div>

        {/* ── Wallet Connect ─────────────────────────────── */}
        <div className="flex justify-end">
          <button
            onClick={() => setWalletConnected(!walletConnected)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              walletConnected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {walletConnected ? '● 0x1a2...f8e3' : 'Connect Wallet'}
          </button>
        </div>

        {/* ── Swap Card ──────────────────────────────────── */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/60 shadow-2xl shadow-black/30 overflow-hidden">

          {/* FROM */}
          <div className="p-5 pb-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-400">From</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  Balance: <span className="text-gray-300">{fromToken.balance.toLocaleString()}</span>
                </span>
                <button
                  onClick={handleMax}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors px-2 py-0.5 rounded bg-blue-400/10 hover:bg-blue-400/20"
                >
                  MAX
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TokenSelector
                tokens={TOKENS}
                selected={fromToken}
                onSelect={setFromToken}
                label="From"
              />
              <input
                type="text"
                inputMode="decimal"
                value={fromAmount}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '' || /^\d*\.?\d*$/.test(v)) {
                    setFromAmount(v);
                    if (swapState === 'success') setSwapState('idle');
                  }
                }}
                placeholder="0.0"
                className="flex-1 bg-transparent text-right text-3xl font-bold text-white outline-none placeholder:text-gray-600"
              />
            </div>
            <div className="text-right mt-1">
              <span className="text-xs text-gray-500">{usdValue}</span>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center -my-1 relative z-10">
            <button
              onClick={handleSwapTokens}
              className="w-10 h-10 bg-gray-800 border-4 border-gray-900/50 rounded-xl flex items-center justify-center hover:bg-gray-700 hover:scale-110 active:scale-95 transition-all shadow-lg"
              title="Swap tokens"
            >
              <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* TO */}
          <div className="p-5 pt-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-400">To</span>
              <span className="text-xs text-gray-500">
                Balance: <span className="text-gray-300">{toToken.balance.toLocaleString()}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <TokenSelector
                tokens={TOKENS}
                selected={toToken}
                onSelect={setToToken}
                label="To"
              />
              <div className="flex-1 text-right text-3xl font-bold text-white truncate">
                {toAmount || <span className="text-gray-600">0.0</span>}
              </div>
            </div>
            <div className="text-right mt-1">
              <span className="text-xs text-gray-500">
                {toAmount ? `$${(parseFloat(toAmount.replace(/,/g, '')) * toToken.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
              </span>
            </div>
          </div>

          {/* ── Slippage Tolerance ─────────────────────── */}
          <div className="px-5 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Slippage</span>
              <div className="flex gap-1">
                {[0.1, 0.5, 1.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSlippage(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      slippage === s
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 border border-transparent'
                    }`}
                  >
                    {s}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Swap Details ───────────────────────────── */}
          {fromAmount && parseFloat(fromAmount) > 0 && (
            <div className="mx-5 p-4 bg-gray-900/50 rounded-xl space-y-0.5 border border-gray-700/30">
              <DetailRow label="Rate" value={rate} />
              <DetailRow label="Fee (0.3%)" value={`~$${feeUsd}`} />
              <DetailRow
                label="Slippage Tolerance"
                value={`${slippage}%`}
              />
              <DetailRow
                label="Price Impact"
                value={`${priceImpact}%`}
                highlight={parseFloat(priceImpact) > 2 ? 'red' : parseFloat(priceImpact) > 1 ? 'yellow' : 'green'}
              />
              <DetailRow label="Minimum Received" value={`${minReceived} ${toToken.symbol}`} />
              <div className="border-t border-gray-700/50 my-1" />
              <DetailRow
                label="Route"
                value={`${fromToken.symbol} → ${fromToken.chain === toToken.chain ? 'Direct' : 'Cross-chain'} → ${toToken.symbol}`}
              />
            </div>
          )}

          {/* ── Swap Button ────────────────────────────── */}
          <div className="p-5 pt-3">
            <button
              onClick={walletConnected ? handleSwap : () => setWalletConnected(true)}
              disabled={buttonDisabled}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                swapState === 'success'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : swapState === 'swapping'
                  ? 'bg-blue-500/80 text-white cursor-wait'
                  : canSwap
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 active:scale-[0.98]'
                  : 'bg-gray-700/60 text-gray-500 cursor-not-allowed'
              }`}
            >
              {swapState === 'swapping' && (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {buttonText}
                </span>
              )}
              {swapState !== 'swapping' && buttonText}
            </button>
          </div>
        </div>

        {/* ── Recent Swaps History ─────────────────────── */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-700/50">
            <h2 className="text-lg font-bold text-white">Recent Swaps</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-semibold">Tx</th>
                  <th className="text-left px-5 py-3 font-semibold">From → To</th>
                  <th className="text-right px-5 py-3 font-semibold">Amount</th>
                  <th className="text-right px-5 py-3 font-semibold hidden sm:table-cell">Route</th>
                  <th className="text-center px-5 py-3 font-semibold">Status</th>
                  <th className="text-right px-5 py-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_SWAPS.map((swap) => (
                  <tr key={swap.id} className="border-t border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-blue-400 font-mono text-xs">{swap.id}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-white font-medium">{swap.from}</span>
                      <span className="text-gray-500 mx-1">→</span>
                      <span className="text-white font-medium">{swap.to}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="text-white">{swap.fromAmount} {swap.from}</div>
                      <div className="text-gray-500 text-xs">→ {swap.toAmount} {swap.to}</div>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-400 text-xs hidden sm:table-cell">
                      {swap.route}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          swap.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : swap.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            swap.status === 'completed'
                              ? 'bg-emerald-400'
                              : swap.status === 'pending'
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-red-400'
                          }`}
                        />
                        {swap.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500 text-xs">{swap.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────── */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
            <span>Powered by <span className="text-gray-300 font-semibold">CinaConnect Swap SDK</span></span>
          </div>
          <p className="text-gray-600 text-xs">Cross-chain liquidity aggregation • Best execution guaranteed</p>
        </div>
      </div>
    </DemoLayout>
  );
}
