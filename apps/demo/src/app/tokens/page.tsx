'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import DemoLayout from '@/components/DemoLayout';
import { useWallet, shortenAddress } from '@/lib/useWallet';
import { useToast } from '@/lib/toast';
import {
  getTokensForChain,
  SUPPORTED_CHAINS,
  type TokenInfo,
} from '@/lib/swapTokens';
import { getMockQuote } from '@/lib/swap';
import { SimulatedBadge } from '@/components/DemoDisclaimer';

/* ── mock token prices & history ── */

/* DEMO ONLY — mock data, not production logic */
// TODO: Replace with real prices from a price API (e.g., CoinGecko, DexScreener)
// In production, fetch live prices via:
//   GET https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd
const MOCK_PRICES: Record<string, { usd: number; change24h: number; volume24h: string; marketCap: string }> = {
  ETH: { usd: 3800, change24h: 2.4, volume24h: '$15.2B', marketCap: '$456B' },
  USDC: { usd: 1.00, change24h: 0.01, volume24h: '$8.1B', marketCap: '$33B' },
  USDT: { usd: 1.00, change24h: -0.01, volume24h: '$42.3B', marketCap: '$105B' },
  WBTC: { usd: 98000, change24h: 1.8, volume24h: '$2.1B', marketCap: '$192B' },
  DAI: { usd: 1.00, change24h: 0.00, volume24h: '$340M', marketCap: '$5.3B' },
  UNI: { usd: 12.50, change24h: -1.2, volume24h: '$280M', marketCap: '$7.5B' },
  LINK: { usd: 18.20, change24h: 3.5, volume24h: '$650M', marketCap: '$10.8B' },
  AAVE: { usd: 285, change24h: 4.1, volume24h: '$420M', marketCap: '$4.2B' },
  POL: { usd: 0.58, change24h: -0.8, volume24h: '$310M', marketCap: '$5.4B' },
  ARB: { usd: 0.85, change24h: 1.5, volume24h: '$450M', marketCap: '$3.1B' },
  OP: { usd: 1.80, change24h: -2.1, volume24h: '$200M', marketCap: '$2.3B' },
  BNB: { usd: 620, change24h: 0.9, volume24h: '$1.8B', marketCap: '$92B' },
  AVAX: { usd: 38, change24h: 5.2, volume24h: '$780M', marketCap: '$14.8B' },
  SOL: { usd: 175, change24h: 3.8, volume24h: '$3.2B', marketCap: '$78B' },
  SUI: { usd: 2.80, change24h: 6.5, volume24h: '$1.1B', marketCap: '$7.5B' },
};

/* DEMO ONLY — simulated sparkline for visualization purposes only */
/* In production, this would fetch real historical price data from an API */
function generateSparkline(basePrice: number, points = 24): number[] {
  const data: number[] = [];
  let price = basePrice * 0.95;
  // Use deterministic seed for consistent demo experience
  const seed = basePrice * 1000;
  for (let i = 0; i < points; i++) {
    // Pseudo-random based on seed (not cryptographically secure, demo only)
    const pseudoRandom = Math.sin(seed + i) * 10000;
    const normalized = (pseudoRandom - Math.floor(pseudoRandom)) - 0.48;
    price += normalized * basePrice * 0.02;
    data.push(price);
  }
  data[data.length - 1] = basePrice;
  return data;
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 40;

  const pathData = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-70">
      <path d={pathData} fill="none" stroke={positive ? '#34d399' : '#f87171'} strokeWidth="1.5" />
    </svg>
  );
}

/* ── Token Row ── */

function TokenRow({
  token,
  isSelected,
  onSelect,
  balance,
}: {
  token: TokenInfo;
  isSelected: boolean;
  onSelect: () => void;
  balance?: string;
}) {
  const priceInfo = MOCK_PRICES[token.symbol];
  if (!priceInfo) return null;

  const sparkData = useMemo(() => generateSparkline(priceInfo.usd), [token.symbol, priceInfo.usd]);

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all text-left ${
        isSelected
          ? 'bg-[var(--cc-link)]/10 border border-[var(--cc-primary)]/30'
          : 'bg-[var(--cc-canvas-soft-2)]/30 border border-[var(--cc-hairline-strong)]/30 hover:bg-[var(--cc-canvas-soft-2)]/50 hover:border-[var(--cc-hairline-strong)]'
      }`}
    >
      <token.icon className="w-6 h-6" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-body-sm font-semibold text-[var(--cc-ink)]">{token.symbol}</span>
          <span className="text-caption text-[var(--cc-body)]">{token.name}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-caption text-[var(--cc-muted)]">${priceInfo.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <SimulatedBadge size="xs" />
          <span className={`text-caption ${priceInfo.change24h >= 0 ? 'text-[var(--cc-success)]' : 'text-[var(--cc-error)]'}`}>
            {priceInfo.change24h >= 0 ? '+' : ''}{priceInfo.change24h}%
          </span>
        </div>
      </div>
      <Sparkline data={sparkData} positive={priceInfo.change24h >= 0} />
      {balance && (
        <div className="text-right shrink-0 ml-2">
          <p className="text-body-sm text-[var(--cc-ink)]">{balance}</p>
        </div>
      )}
    </button>
  );
}

/* ── Token Detail Panel ── */

function TokenDetailPanel({ token, onClose }: { token: TokenInfo; onClose: () => void }) {
  const priceInfo = MOCK_PRICES[token.symbol];
  if (!priceInfo) return null;

  const sparkData = useMemo(() => generateSparkline(priceInfo.usd, 48), [token.symbol]);

  return (
    <div className="bg-[var(--cc-canvas-soft-2)]/60 backdrop-blur-xl rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/60 overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--cc-hairline-strong)]/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <token.icon className="w-8 h-8" />
          <div>
            <h3 className="text-body-lg font-semibold tracking-tighter text-[var(--cc-ink)]">{token.symbol}</h3>
            <p className="text-caption text-[var(--cc-body)]">{token.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-[var(--cc-muted)] hover:text-[var(--cc-ink)] hover:bg-[var(--cc-canvas-soft-2)]/50 transition-all"
          aria-label="Close token details"
        >
          ✕
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Price */}
        <div className="text-center">
          <p className="text-display-xl font-semibold tracking-tighter text-[var(--cc-ink)] inline-flex items-center gap-3">
            ${priceInfo.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <SimulatedBadge size="sm" />
          </p>
          <p className={`text-body-sm font-semibold ${priceInfo.change24h >= 0 ? 'text-[var(--cc-success)]' : 'text-[var(--cc-error)]'}`}>
            {priceInfo.change24h >= 0 ? '▲' : '▼'} {Math.abs(priceInfo.change24h)}% (24h)
          </p>
        </div>

        {/* Sparkline */}
        <div className="flex justify-center">
          <Sparkline data={sparkData} positive={priceInfo.change24h >= 0} />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-md bg-[var(--cc-canvas)]/50 border border-[var(--cc-hairline-strong)]/30">
            <p className="text-caption text-[var(--cc-body)] uppercase tracking-normal">Volume (24h)</p>
            <p className="text-body-sm font-semibold text-[var(--cc-body)] mt-1">{priceInfo.volume24h}</p>
          </div>
          <div className="p-3 rounded-md bg-[var(--cc-canvas)]/50 border border-[var(--cc-hairline-strong)]/30">
            <p className="text-caption text-[var(--cc-body)] uppercase tracking-normal">Market Cap</p>
            <p className="text-body-sm font-semibold text-[var(--cc-body)] mt-1">{priceInfo.marketCap}</p>
          </div>
          <div className="p-3 rounded-md bg-[var(--cc-canvas)]/50 border border-[var(--cc-hairline-strong)]/30">
            <p className="text-caption text-[var(--cc-body)] uppercase tracking-normal">Address</p>
            <p className="text-caption font-[var(--font-mono)] text-[var(--cc-body)] mt-1 truncate">
              {token.address === 'native' ? 'Native Token' : shortenAddress(token.address)}
            </p>
          </div>
          <div className="p-3 rounded-md bg-[var(--cc-canvas)]/50 border border-[var(--cc-hairline-strong)]/30">
            <p className="text-caption text-[var(--cc-body)] uppercase tracking-normal">Chain</p>
            <p className="text-body-sm font-semibold text-[var(--cc-body)] mt-1">
              {SUPPORTED_CHAINS.find((c) => c.chainId === token.chainId)?.name ?? `Chain ${token.chainId}`}
            </p>
          </div>
        </div>

        {/* Mock price history */}
        <div className="p-3 rounded-md bg-[var(--cc-canvas)]/50 border border-[var(--cc-hairline-strong)]/30">
          <p className="text-caption text-[var(--cc-body)] uppercase tracking-normal mb-2">Price History</p>
          <div className="flex gap-1">
            {['1H', '24H', '7D', '30D', '1Y'].map((period) => (
              <button
                key={period}
                className={`px-2 py-1 rounded text-caption font-semibold transition-all ${
                  period === '24H'
                    ? 'bg-[var(--cc-link)]/20 text-[var(--cc-link)] border border-[var(--cc-primary)]/30'
                    : 'bg-[var(--cc-canvas-soft-2)]/50 text-[var(--cc-body)] hover:text-[var(--cc-body)]'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Swap Widget (inline) ── */

function SwapWidget({
  fromToken,
  toToken,
  onSwapTokens,
}: {
  fromToken: TokenInfo | null;
  toToken: TokenInfo | null;
  onSwapTokens: () => void;
}) {
  const { account, status, connectors, connect } = useWallet();
  const { success, error: toastError, info } = useToast();
  const isConnected = status === 'connected';

  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [swapState, setSwapState] = useState<'idle' | 'quoting' | 'success'>('idle');

  useEffect(() => {
    const amt = parseFloat(fromAmount);
    if (!isConnected || isNaN(amt) || amt <= 0 || !fromToken || !toToken || fromToken.address === toToken.address) {
      setToAmount('');
      return;
    }
    setSwapState('quoting');
    const timeoutId = setTimeout(() => {
      const mock = getMockQuote(fromToken.symbol, toToken.symbol, fromAmount);
      setToAmount(mock.toTokenAmountFormatted);
      setSwapState('idle');
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [fromAmount, fromToken, toToken, isConnected]);

  if (!fromToken || !toToken) {
    return (
      <div className="bg-[var(--cc-canvas-soft-2)]/60 backdrop-blur-xl rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/60 p-8 text-center">
        <p className="text-[var(--cc-muted)] text-body-sm">Select tokens to swap</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--cc-canvas-soft-2)]/60 backdrop-blur-xl rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/60 overflow-hidden">
      <div className="px-5 py-3 border-b border-[var(--cc-hairline-strong)]/50">
        <h3 className="text-body-sm font-semibold tracking-tighter text-[var(--cc-ink)]">Quick Swap</h3>
      </div>
      <div className="p-5 space-y-3">
        {/* From */}
        <div className="flex items-center gap-2 bg-[var(--cc-canvas)]/50 rounded-md p-3 border border-[var(--cc-hairline-strong)]/30">
          <fromToken.icon className="w-5 h-5" />
          <span className="text-body-sm font-semibold text-[var(--cc-ink)] w-16">{fromToken.symbol}</span>
          <input
            type="text"
            inputMode="decimal"
            value={fromAmount}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '' || /^\d*\.?\d*$/.test(v)) setFromAmount(v);
            }}
            placeholder="0.0"
            className="flex-1 bg-transparent text-right text-body-lg font-semibold text-[var(--cc-ink)] outline-none placeholder:text-[var(--cc-body)]"
          />
        </div>

        {/* Swap arrow */}
        <div className="flex justify-center">
          <button
            onClick={onSwapTokens}
            className="w-8 h-8 bg-[var(--cc-canvas-soft-2)] rounded-lg flex items-center justify-center hover:bg-[var(--cc-muted)] transition-colors"
          >
            ↓
          </button>
        </div>

        {/* To */}
        <div className="flex items-center gap-2 bg-[var(--cc-canvas)]/50 rounded-md p-3 border border-[var(--cc-hairline-strong)]/30">
          <toToken.icon className="w-5 h-5" />
          <span className="text-body-sm font-semibold text-[var(--cc-ink)] w-16">{toToken.symbol}</span>
          <div className="flex-1 text-right text-body-lg font-semibold text-[var(--cc-body)]">
            {toAmount || '0.0'}
          </div>
        </div>

        {/* Swap button */}
        {isConnected ? (
          <button
            onClick={() => {
              if (!fromAmount || parseFloat(fromAmount) <= 0) return;
              setSwapState('success');
              success('Swap Complete', `${fromAmount} ${fromToken.symbol} → ${toAmount} ${toToken.symbol}`);
              setTimeout(() => {
                setFromAmount('');
                setToAmount('');
                setSwapState('idle');
              }, 2000);
            }}
            disabled={swapState !== 'idle' || !fromAmount || parseFloat(fromAmount) <= 0}
            className={`w-full py-3 rounded-[6px] font-semibold text-body-sm transition-all ${
              swapState === 'success'
                ? 'bg-[var(--cc-success)] text-[var(--cc-ink)]'
                : 'bg-[var(--cc-primary)] text-[var(--cc-on-primary)] disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90'
            }`}
          >
            {swapState === 'success' ? '✓ Swap Successful!' : 'Swap'}
          </button>
        ) : (
          <button
            onClick={() => connect(connectors.find((c) => c.id === 'io.metamask')?.id ?? 'io.metamask')}
            className="w-full py-3 rounded-[6px] font-semibold text-body-sm bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:opacity-90 transition-all"
          >
            Connect Wallet to Swap
          </button>
        )}

        {swapState === 'quoting' && (
          <div className="flex items-center justify-center text-caption text-[var(--cc-link)]">
            <svg className="animate-spin h-3 w-3 mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Fetching best rate…
          </div>
        )}
      </div>
    </div>
  );
}

/* ── main page ── */

export default function TokensPage() {
  const { account, status, connectors, connect } = useWallet();
  const isConnected = status === 'connected';

  const [chainId, setChainId] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [swapFrom, setSwapFrom] = useState<TokenInfo | null>(null);
  const [swapTo, setSwapTo] = useState<TokenInfo | null>(null);

  const tokens = useMemo(() => getTokensForChain(chainId), [chainId]);

  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return tokens;
    const q = searchQuery.toLowerCase();
    return tokens.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q)
    );
  }, [tokens, searchQuery]);

  const handleSelectToken = useCallback((token: TokenInfo) => {
    setSelectedToken(token);
    if (!swapFrom) setSwapFrom(token);
    else if (!swapTo && token.address !== swapFrom.address) setSwapTo(token);
  }, [swapFrom, swapTo]);

  const handleSwapTokens = useCallback(() => {
    const temp = swapFrom;
    setSwapFrom(swapTo);
    setSwapTo(temp);
  }, [swapFrom, swapTo]);

  return (
    <DemoLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="text-center space-y-2">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">TOKENS</p>
          <h1 className="text-display-lg font-semibold tracking-tighter bg-gradient-to-r from-[var(--cc-link)]/80 via-[var(--cc-link)] to-[var(--cc-link)]/60 bg-clip-text text-transparent">
            Token Search & Swap
          </h1>
          <p className="text-[var(--cc-muted)] text-body-sm">Search tokens, view details, and swap in one place</p>
        </div>

        {/* ── Wallet connect bar ── */}
        <div className="flex items-center justify-between bg-[var(--cc-canvas-soft-2)]/40 backdrop-blur rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/50 px-5 py-4">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <div className="size-8 rounded-full bg-gradient-to-br from-[var(--cc-link)] to-[var(--cc-violet-deep)] flex items-center justify-center text-caption font-semibold text-[var(--cc-ink)]">
                  {account.address?.slice(2, 4).toUpperCase()}
                </div>
                <div>
                  <p className="text-body-sm font-[var(--font-mono)] text-[var(--cc-body)]">{shortenAddress(account.address ?? '')}</p>
                  <p className="text-caption text-[var(--cc-body)]">{account.chainName} · {account.balance} {account.chainSymbol}</p>
                </div>
              </>
            ) : (
              <button
                onClick={() => connect(connectors.find((c) => c.id === 'io.metamask')?.id ?? 'io.metamask')}
                className="px-5 py-3 rounded-[6px] text-body-sm font-semibold bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:opacity-90 transition-all"
              >
                Connect Wallet
              </button>
            )}
          </div>

          {/* Chain selector */}
          <select
            value={chainId}
            onChange={(e) => { setChainId(Number(e.target.value)); setSelectedToken(null); }}
            className="bg-[var(--cc-canvas-soft-2)]/60 text-[var(--cc-ink)] text-body-sm rounded-md px-3 py-2 border border-[var(--cc-hairline-strong)]/40 outline-none cursor-pointer"
          >
            {SUPPORTED_CHAINS.map((c) => (
              <option key={c.chainId} value={c.chainId}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Token List (left 2/3) ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, symbol, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
className="w-full h-[40px] px-4 pl-10 bg-[var(--cc-canvas-soft-2)]/60 border border-[var(--cc-hairline-strong)]/50 rounded-[6px] text-body-sm text-[var(--cc-body)] placeholder:text-[var(--cc-body)] focus:outline-none focus:ring-2 focus:ring-[var(--cc-primary)]/40"
                aria-label="Search tokens"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--cc-body)]" />
            </div>

            {/* Token list */}
            <div className="space-y-2">
              {filteredTokens.map((token) => (
                <TokenRow
                  key={token.symbol + token.address}
                  token={token}
                  isSelected={selectedToken?.address === token.address}
                  onSelect={() => handleSelectToken(token)}
                />
              ))}
              {filteredTokens.length === 0 && (
                <div className="text-center py-12 text-body-sm text-[var(--cc-body)]">
                  No tokens found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>

          {/* ── Right sidebar (detail + swap) ── */}
          <div className="space-y-4">
            {selectedToken && <TokenDetailPanel token={selectedToken} onClose={() => setSelectedToken(null)} />}

            <SwapWidget
              fromToken={swapFrom}
              toToken={swapTo}
              onSwapTokens={handleSwapTokens}
            />
          </div>
        </div>
      </div>
    </DemoLayout>
  );
}
