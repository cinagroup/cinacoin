"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowDownUp, ChevronDown, AlertCircle, RefreshCw, Settings2, Info } from "lucide-react";
import DemoLayout from "@/components/DemoLayout";
import { useWallet } from "@/lib/useWallet";
import { useToast } from "@/lib/toast";
import { getSwapQuote as swapTokens, type PriceQuote as SwapQuote } from "@/lib/swap";
import { getTokensForChain, type TokenInfo } from "@/lib/swapTokens";

/* ── Token selector dropdown ── */
function TokenSelector({
  value,
  onChange,
  label,
  balance,
  chainId,
}: {
  value: string;
  onChange: (symbol: string) => void;
  label: string;
  balance?: string;
  chainId: number;
}) {
  const [open, setOpen] = useState(false);
  const SWAP_TOKEN_LIST = getTokensForChain(chainId);
  const selected = SWAP_TOKEN_LIST.find((t) => t.symbol === value);

  return (
    <div className="relative">
      <label className="text-caption text-[var(--cc-muted)] block mb-1.5">{label}</label>
      <div className="flex items-center gap-3 p-3 bg-[var(--cc-canvas-soft-2)]/60 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-sm)]">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-full hover:border-[var(--cc-hairline-strong)] transition-all shrink-0"
        >
          {selected && (
            <selected.icon className="w-5 h-5 text-[var(--cc-link)]" />
          )}
          <span className="font-semibold text-body-sm text-[var(--cc-ink)]">{value}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--cc-muted)]" />
        </button>
        <input
          type="text"
          placeholder="0.0"
          className="flex-1 bg-transparent text-right text-display-sm font-semibold text-[var(--cc-ink)] placeholder:text-[var(--cc-muted)]/50 focus:outline-none cc-tabular-nums min-w-0"
        />
      </div>
      {balance && (
        <div className="flex items-center justify-between mt-1.5 px-1">
          <span className="text-caption text-[var(--cc-muted)]">Balance: {balance}</span>
          <button className="text-caption text-[var(--cc-link)] hover:underline font-medium">Max</button>
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-56 bg-[var(--cc-canvas)] border border-[var(--cc-hairline-strong)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level4)] z-50 overflow-hidden cc-animate-scale-in">
            <div className="max-h-64 overflow-y-auto cc-scrollbar">
              {SWAP_TOKEN_LIST.map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => {
                    onChange(token.symbol);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--cc-canvas-soft-2)] transition-colors text-left ${
                    token.symbol === value ? 'bg-[var(--cc-canvas-soft-2)]/60' : ''
                  }`}
                >
                  <token.icon className="w-7 h-7 shrink-0 text-[var(--cc-link)]" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-body-sm text-[var(--cc-ink)]">{token.symbol}</p>
                    <p className="text-caption text-[var(--cc-muted)] truncate">{token.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function SwapPage() {
  const { account, status } = useWallet();
  const { success, error: showError } = useToast();

  const isConnected = status === "connected";

  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState("0.5");

  // Get a quote when amount changes
  const getQuote = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setQuote(null);
      return;
    }
    setLoading(true);
    try {
      const q = await swapTokens(fromToken, toToken, amount, account.chainId || 1, parseFloat(slippage));
      if ('error' in q) {
        showError("Quote failed", q.error);
        setQuote(null);
        return;
      }
      setQuote(q);
    } catch (err) {
      showError("Quote failed", err instanceof Error ? err.message : "Could not get quote");
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [fromToken, toToken, amount, showError]);

  useEffect(() => {
    const timer = setTimeout(getQuote, 300);
    return () => clearTimeout(timer);
  }, [getQuote]);

  const handleSwap = async () => {
    if (!quote) return;
    setLoading(true);
    // Simulate swap execution
    await new Promise((r) => setTimeout(r, 1500));
    success("Swap executed", `Swapped ${amount} ${fromToken} for ~${quote.toTokenAmountFormatted} ${toToken}`);
    setAmount("");
    setQuote(null);
    setLoading(false);
  };

  const handleFlip = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setAmount("");
    setQuote(null);
  };

  if (!isConnected) {
    return (
      <DemoLayout>
        <div className="max-w-md mx-auto px-4 py-12 text-center cc-page-enter">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">SWAP</p>
          <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)] mb-4">
            Swap tokens.
          </h1>
          <p className="text-[var(--cc-body)]">Connect your wallet to swap tokens.</p>
        </div>
      </DemoLayout>
    );
  }

  return (
    <DemoLayout>
      <div className="max-w-md mx-auto px-4 py-12 cc-page-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">SWAP</p>
            <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)]">
              Swap.
            </h1>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-[var(--cc-radius-sm)] border transition-all ${
              showSettings
                ? 'bg-[var(--cc-canvas-soft-2)] border-[var(--cc-hairline-strong)] text-[var(--cc-ink)]'
                : 'border-[var(--cc-hairline)] text-[var(--cc-muted)] hover:text-[var(--cc-ink)] hover:border-[var(--cc-hairline-strong)]'
            }`}
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="mb-4 p-4 bg-[var(--cc-canvas-soft-2)]/60 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] cc-animate-slide-down">
            <p className="text-body-sm font-medium text-[var(--cc-ink)] mb-3">Transaction settings</p>
            <div className="flex items-center gap-2">
              <span className="text-caption text-[var(--cc-muted)]">Slippage tolerance</span>
              <div className="flex gap-1.5 ml-auto">
                {["0.1", "0.5", "1.0"].map((val) => (
                  <button
                    key={val}
                    onClick={() => setSlippage(val)}
                    className={`px-2.5 py-1 text-caption rounded-full font-medium transition-all ${
                      slippage === val
                        ? 'bg-[var(--cc-primary)] text-[var(--cc-on-primary)]'
                        : 'bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] text-[var(--cc-body)] hover:border-[var(--cc-hairline-strong)]'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Swap Card */}
        <div className="p-5 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] shadow-[var(--cc-level1)]">
          {/* From */}
          <TokenSelector
            label="From"
            value={fromToken}
            onChange={setFromToken}
            balance={fromToken === "ETH" ? "2.4521" : fromToken === "USDC" ? "1,250.00" : "0.00"}
            chainId={account.chainId || 1}
          />

          {/* Flip button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={handleFlip}
              className="p-2 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-full hover:border-[var(--cc-hairline-strong)] hover:shadow-[var(--cc-level2)] transition-all active:scale-95"
            >
              <ArrowDownUp className="w-4 h-4 text-[var(--cc-muted)]" />
            </button>
          </div>

          {/* To */}
          <TokenSelector
            label="To"
            value={toToken}
            onChange={setToToken}
            balance={toToken === "ETH" ? "2.4521" : toToken === "USDC" ? "1,250.00" : "0.00"}
            chainId={account.chainId || 1}
          />

          {/* Amount input for From */}
          <div className="mt-4 pt-4 border-t border-[var(--cc-hairline)]/60">
            <label className="text-caption text-[var(--cc-muted)] block mb-1.5">Amount</label>
            <input
              type="text"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              className="w-full bg-transparent text-display-sm font-semibold text-[var(--cc-ink)] placeholder:text-[var(--cc-muted)]/50 focus:outline-none cc-tabular-nums"
            />
          </div>
        </div>

        {/* Quote Details */}
        {quote && (
          <div className="mt-4 p-4 bg-[var(--cc-canvas-soft-2)]/40 border border-[var(--cc-hairline)] rounded-[var(--cc-radius-md)] space-y-2.5 cc-animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="text-caption text-[var(--cc-muted)]">Rate</span>
              <span className="text-caption text-[var(--cc-body)] cc-tabular-nums">
                1 {fromToken} ≈ {parseFloat(quote.rate).toFixed(4)} {toToken}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-caption text-[var(--cc-muted)]">Expected output</span>
              <span className="text-caption text-[var(--cc-body)] cc-tabular-nums">
                ~{quote.toTokenAmountFormatted} {toToken}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-caption text-[var(--cc-muted)]">Minimum received</span>
              <span className="text-caption text-[var(--cc-body)] cc-tabular-nums">
                {quote.toTokenAmountFormatted} {toToken}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-caption text-[var(--cc-muted)]">Price impact</span>
              <span className="text-caption text-[var(--cc-success)] cc-tabular-nums">
                {"<"}0.01%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-caption text-[var(--cc-muted)]">Network fee</span>
              <span className="text-caption text-[var(--cc-body)] cc-tabular-nums">~$2.40</span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!quote || loading}
          className="w-full mt-5 px-6 py-3.5 bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:bg-[var(--cc-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed rounded-[var(--cc-radius-sm)] font-semibold transition-all shadow-[var(--cc-level3)] hover:shadow-[var(--cc-level4)] active:scale-[0.99] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              {quote ? "Swapping..." : "Fetching quote..."}
            </>
          ) : !amount ? (
            "Enter an amount"
          ) : !quote ? (
            "Get quote"
          ) : (
            `Swap ${fromToken} for ${toToken}`
          )}
        </button>

        {/* Disclaimer */}
        <div className="mt-4 flex items-start gap-2 p-3 bg-[var(--cc-canvas-soft-2)]/30 border border-[var(--cc-hairline)]/60 rounded-[var(--cc-radius-sm)]">
          <Info className="w-3.5 h-3.5 text-[var(--cc-muted)] mt-0.5 shrink-0" />
          <p className="text-caption text-[var(--cc-muted)]">
            Demo uses simulated quotes. Actual swaps require mainnet integration with DEX aggregators.
          </p>
        </div>
      </div>
    </DemoLayout>
  );
}
