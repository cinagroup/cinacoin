'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { FileText, Send, Link2, RefreshCw, CheckCircle } from 'lucide-react';
import DemoLayout from '@/components/DemoLayout';
import { useWallet, shortenAddress } from '@/lib/useWallet';
import { useToast } from '@/lib/toast';
import {
  getTokensForChain,
  SUPPORTED_CHAINS,
  CHAIN_BY_ID,
  type TokenInfo,
} from '@/lib/swapTokens';
import {
  getSwapQuote,
  getSwapTransaction,
  getApprovalTransaction,
  executeSwap,
  getMockQuote,
  getSwapHistory,
  saveSwapHistory,
  updateSwapStatus,
  type PriceQuote,
  type SwapHistoryEntry,
} from '@/lib/swap';
import TxProgress, { type TxStep } from '@/components/TxProgress';

// ─── Token Selector Dropdown ──────────────────────────────────────────────

function TokenSelector({
  tokens,
  selected,
  onSelect,
  label,
  nativeBalance,
}: {
  tokens: TokenInfo[];
  selected: TokenInfo;
  onSelect: (t: TokenInfo) => void;
  label: string;
  nativeBalance?: string;
}) {
  const [open, setOpen] = useState(false);

  const getBalance = useCallback((t: TokenInfo): string => {
    if (t.symbol === 'ETH' && nativeBalance) return nativeBalance;
    return '—';
  }, [nativeBalance]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-[var(--cc-canvas-soft-2)]/80 hover:bg-[var(--cc-muted)]/80 rounded-md px-3 py-2 transition-colors border border-[var(--cc-hairline-strong)]/50"
      >
        <selected.icon className="w-5 h-5" />
        <span className="font-semibold text-[var(--cc-ink)] text-body-sm">{selected.symbol}</span>
        <svg className={`w-4 h-4 text-[var(--cc-muted)] transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-full mt-2 left-0 w-64 bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline-strong)] rounded-md shadow-[var(--cc-level5)] overflow-hidden">
            <div className="p-2 border-b border-[var(--cc-hairline-strong)]">
              <p className="text-caption text-[var(--cc-muted)] px-2 py-1 font-semibold uppercase tracking-normal">Select Token</p>
            </div>
            {tokens.map((t) => (
              <button
                key={t.symbol + t.address}
                onClick={() => { onSelect(t); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-[var(--cc-canvas-soft-2)]/60 transition-colors ${
                  t.address === selected.address ? 'bg-[var(--cc-canvas-soft-2)]/40' : ''
                }`}
              >
                <t.icon className="w-6 h-6" />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-semibold text-[var(--cc-ink)] text-body-sm">{t.symbol}</div>
                  <div className="text-caption text-[var(--cc-muted)] truncate">{t.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-body-sm text-[var(--cc-ink)]">{getBalance(t)}</div>
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
    ? 'text-[var(--cc-success)]'
    : highlight === 'red'
    ? 'text-[var(--cc-error)]'
    : highlight === 'yellow'
    ? 'text-[var(--cc-warning)]'
    : 'text-[var(--cc-body)]';

  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-body-sm text-[var(--cc-muted)]">{label}</span>
      <span className={`text-body-sm font-medium ${color}`}>{value}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function SwapPage() {
  const { account, status, error, connectors, connect, disconnect } = useWallet();
  const { success, error: toastErr, info } = useToast();

  // Chain selection
  const [chainId, setChainId] = useState<number>(1);
  const tokens = useMemo(() => getTokensForChain(chainId), [chainId]);

  const [fromToken, setFromToken] = useState<TokenInfo>(() => tokens[0] ?? {
    symbol: 'ETH', name: 'Ethereum', icon: '⟠', address: 'native', decimals: 18, chainId: 1,
  });
  const [toToken, setToToken] = useState<TokenInfo>(() => tokens[1] ?? {
    symbol: 'USDC', name: 'USD Coin', icon: '◎', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, chainId: 1,
  });

  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);

  // Swap state: idle → quoting → quoting_done → approving → swapping → success
  const [swapState, setSwapState] = useState<'idle' | 'quoting' | 'approving' | 'swapping' | 'success'>('idle');
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [swapRoute, setSwapRoute] = useState<string>('');
  const [swapHistory, setSwapHistory] = useState<SwapHistoryEntry[]>([]);

  const [txSteps, setTxSteps] = useState<TxStep[]>([]);
  const quoteAbortRef = useRef<AbortController | null>(null);

  const isConnected = status === 'connected';
  const primaryConnector = connectors.find((c) => c.id === 'io.metamask') ?? connectors[0];

  // Load swap history from localStorage on mount
  useEffect(() => {
    setSwapHistory(getSwapHistory());
  }, []);

  // Reset swap state when tokens or chain change
  useEffect(() => {
    setQuote(null);
    setSwapRoute('');
    setSwapState('idle');
    if (quoteAbortRef.current) {
      quoteAbortRef.current.abort();
    }
  }, [chainId, fromToken.address, toToken.address]);

  // Keep tokens in sync when chain changes
  useEffect(() => {
    const chainTokens = getTokensForChain(chainId);
    if (chainTokens.length >= 2) {
      // If current tokens aren't on the new chain, switch
      const fromOnChain = chainTokens.find((t) => t.address === fromToken.address);
      const toOnChain = chainTokens.find((t) => t.address === toToken.address);
      if (!fromOnChain) setFromToken(chainTokens[0]);
      if (!toOnChain) setToToken(chainTokens[1]);
    }
  }, [chainId]);

  // Fetch real quote from 1inch API when amount changes
  useEffect(() => {
    const amt = parseFloat(fromAmount);
    if (!isConnected || isNaN(amt) || amt <= 0 || fromToken.address === toToken.address) {
      setQuote(null);
      setSwapRoute('');
      return;
    }

    let cancelled = false;
    quoteAbortRef.current?.abort();
    const controller = new AbortController();
    quoteAbortRef.current = controller;

    setSwapState('quoting');

    // Convert amount to atomic units
    const atomicAmount = (amt * 10 ** fromToken.decimals).toFixed(0).split('.')[0];

    getSwapQuote(fromToken.symbol, toToken.symbol, atomicAmount, chainId, slippage)
      .then((result) => {
        if (cancelled) return;
        if ('error' in result) {
          // Fallback to mock quote with clear "Simulated" label
          const mock = getMockQuote(fromToken.symbol, toToken.symbol, fromAmount);
          mock.isSimulated = true; // Flag for UI to show warning
          setQuote(mock);
          setSwapRoute(`${fromToken.symbol} → ${fromToken.chainId === toToken.chainId ? 'Uniswap V3' : 'Cross-chain'} → ${toToken.symbol} (simulated)`);
        } else {
          setQuote(result);
          setSwapRoute(`${fromToken.symbol} → 1inch Router (${result.protocolsCount} protocol${result.protocolsCount !== 1 ? 's' : ''}) → ${toToken.symbol}`);
        }
        setSwapState('idle');
      })
      .catch(() => {
        if (cancelled) return;
        const mock = getMockQuote(fromToken.symbol, toToken.symbol, fromAmount);
        mock.isSimulated = true; // Flag for UI to show warning
        setQuote(mock);
        setSwapRoute(`${fromToken.symbol} → Simulated DEX → ${toToken.symbol}`);
        setSwapState('idle');
      });

    return () => { cancelled = true; };
  }, [fromAmount, fromToken, toToken, chainId, slippage, isConnected]);

  // Computed values for display
  const displayToAmount = useMemo(() => {
    if (quote) return quote.toTokenAmountFormatted;
    const amt = parseFloat(fromAmount);
    if (isNaN(amt) || amt <= 0) return '';
    return '';
  }, [quote, fromAmount]);

  const displayRate = useMemo(() => {
    if (quote) return quote.rate;
    return '';
  }, [quote]);

  const displayPriceImpact = useMemo(() => {
    if (quote) return quote.priceImpact;
    return '0.00';
  }, [quote]);

  const minReceived = useMemo(() => {
    if (!quote) return '';
    const amt = parseFloat(quote.toTokenAmountFormatted.replace(/,/g, ''));
    if (isNaN(amt) || amt <= 0) return '';
    return (amt * (1 - slippage / 100)).toLocaleString(undefined, { maximumFractionDigits: 6 });
  }, [quote, slippage]);

  const usdValue = useMemo(() => {
    const amt = parseFloat(fromAmount);
    if (isNaN(amt) || amt <= 0) return '$0.00';
    // Approximate USD value from quote
    if (quote) {
      // Try to estimate from the toToken if it's a stablecoin
      const toSymbol = toToken.symbol.toUpperCase();
      if (['USDC', 'USDT', 'DAI', 'BUSD'].includes(toSymbol)) {
        return `~$${parseFloat(quote.toTokenAmountFormatted.replace(/,/g, '')).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }
    return `$${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [fromAmount, quote, toToken]);

  const canSwap = isConnected && parseFloat(fromAmount) > 0 && fromToken.symbol !== toToken.symbol;

  const insufficientBalance = useMemo(() => {
    const amt = parseFloat(fromAmount);
    if (isNaN(amt)) return false;
    if (fromToken.address === 'native' && isConnected) {
      return amt > parseFloat(account.balance);
    }
    return false;
  }, [fromAmount, fromToken.address, isConnected, account.balance]);

  const handleSwapTokens = useCallback(() => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(displayToAmount.replace(/,/g, '') || '');
  }, [fromToken, toToken, displayToAmount]);

  const handleChainChange = useCallback((newChainId: number) => {
    setChainId(newChainId);
    setFromAmount('');
    setQuote(null);
    setSwapRoute('');
  }, []);

  const handleSwap = useCallback(async () => {
    if (!canSwap || !account.address) return;

    setSwapState('swapping');
    setTxSteps([
      { label: 'Preparing transaction', icon: 'file-text', status: 'active' },
      { label: 'Sending to wallet', icon: 'send', status: 'pending' },
      { label: 'Confirming on-chain', icon: 'link-2', status: 'pending' },
      { label: 'Swap complete', icon: 'check-circle', status: 'pending' },
    ]);
    info('Swap Initiated', `Swapping ${fromAmount} ${fromToken.symbol} → ${toToken.symbol}`);

    try {
      // Convert amount to atomic units
      const amt = parseFloat(fromAmount);
      const atomicAmount = (amt * 10 ** fromToken.decimals).toFixed(0).split('.')[0];

      // Get swap transaction data from 1inch
      const result = await getSwapTransaction(
        fromToken.symbol,
        toToken.symbol,
        atomicAmount,
        chainId,
        account.address,
        slippage,
      );

      if ('error' in result) {
        toastErr('Swap Failed', result.description || result.error);
        setSwapState('idle');

        // Save failed entry
        saveSwapHistory({
          id: `0x${Date.now().toString(16)}`,
          from: fromToken.symbol,
          to: toToken.symbol,
          fromAmount,
          toAmount: '0',
          rate: displayRate || 'N/A',
          timestamp: new Date().toISOString(),
          status: 'failed',
          route: swapRoute || 'N/A',
          chainId,
        });
        setSwapHistory(getSwapHistory());
        return;
      }

      // Check if we need to approve the token first (for ERC20, not native)
      if (fromToken.address !== 'native') {
        setSwapState('approving');
        setTxSteps([
          { label: 'Preparing transaction', icon: 'file-text', status: 'done' },
          { label: 'Approving token spend', icon: 'unlock', status: 'active' },
          { label: 'Executing swap', icon: 'refresh-cw', status: 'pending' },
          { label: 'Swap complete', icon: 'check-circle', status: 'pending' },
        ]);
        info('Approval Required', `Approving ${fromToken.symbol} for swap...`);

        const approvalTx = await getApprovalTransaction(fromToken.address, chainId);
        if (approvalTx) {
          try {
            // getApprovalTransaction returns partial tx; send directly via provider
            const eth = window.ethereum as { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } | undefined;
            if (!eth) throw new Error('No wallet provider');
            const approvalHash = (await eth.request({
              method: 'eth_sendTransaction',
              params: [{ from: account.address, ...approvalTx }],
            })) as string;
            info('Approval Sent', `Tx: ${shortenAddress(approvalHash)}`);
            // Wait a moment for approval to process
            await new Promise((r) => setTimeout(r, 3000));
          } catch (approvalErr: unknown) {
            const msg = approvalErr instanceof Error ? approvalErr.message : 'Approval rejected';
            toastErr('Approval Failed', msg);
            setSwapState('idle');

            saveSwapHistory({
              id: `0x${Date.now().toString(16)}`,
              from: fromToken.symbol,
              to: toToken.symbol,
              fromAmount,
              toAmount: '0',
              rate: displayRate || 'N/A',
              timestamp: new Date().toISOString(),
              status: 'failed',
              route: swapRoute || 'N/A',
              chainId,
            });
            setSwapHistory(getSwapHistory());
            return;
          }
        }
      }

      // Execute the swap
      setTxSteps([
        { label: 'Preparing transaction', icon: 'file-text', status: 'done' },
        { label: 'Approving token spend', icon: 'unlock', status: fromToken.address === 'native' ? 'done' : 'pending' },
        { label: 'Executing swap', icon: 'refresh-cw', status: 'active' },
        { label: 'Swap complete', icon: 'check-circle', status: 'pending' },
      ]);
      const txHash = await executeSwap(result.tx);
      info('Swap Sent', `Tx: ${shortenAddress(txHash)}`);

      // Save pending entry
      const entryId = `0x${Date.now().toString(16)}`;
      saveSwapHistory({
        id: entryId,
        from: fromToken.symbol,
        to: toToken.symbol,
        fromAmount,
        toAmount: quote?.toTokenAmountFormatted ?? displayToAmount,
        rate: quote?.rate ?? displayRate ?? 'N/A',
        timestamp: new Date().toISOString(),
        status: 'pending',
        route: swapRoute || '1inch Router',
        chainId,
        txHash,
      });
      setSwapHistory(getSwapHistory());

      setTxSteps([
        { label: 'Preparing transaction', icon: 'file-text', status: 'done' },
        { label: 'Approving token spend', icon: 'unlock', status: 'done' },
        { label: 'Executing swap', icon: 'refresh-cw', status: 'done' },
        { label: 'Swap complete', icon: 'check-circle', status: 'done' },
      ]);
      setSwapState('success');
      success('Swap Complete', `${fromAmount} ${fromToken.symbol} → ${quote?.toTokenAmountFormatted ?? displayToAmount} ${toToken.symbol}`);

      // Update status after a delay (in real app, would poll for tx receipt)
      setTimeout(() => {
        updateSwapStatus(txHash, 'completed');
        setSwapHistory(getSwapHistory());
      }, 15000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      toastErr('Swap Failed', message);
      setTxSteps((prev) =>
        prev.map((s, i) =>
          i === prev.findIndex((p) => p.status === 'active')
            ? { ...s, status: 'error' as const }
            : s,
        ),
      );
      setSwapState('idle');
    }
  }, [
    canSwap, account.address, fromAmount, fromToken, toToken, chainId,
    slippage, quote, displayRate, displayToAmount, swapRoute, info, success, toastErr,
  ]);

  const handleMax = useCallback(() => {
    if (fromToken.address === 'native' && isConnected) {
      setFromAmount(account.balance);
    } else {
      setFromAmount('0');
    }
  }, [fromToken.address, isConnected, account.balance]);

  // Button text & state
  const buttonText = useMemo(() => {
    if (status === 'disconnected') return 'Connect Wallet';
    if (swapState === 'success') return '✓ Swap Successful!';
    if (swapState === 'swapping') return 'Swapping...';
    if (swapState === 'approving') return 'Approving Token...';
    if (swapState === 'quoting') return 'Fetching Best Rate...';
    if (insufficientBalance) return 'Insufficient Balance';
    if (!fromAmount || parseFloat(fromAmount) === 0) return 'Enter an amount';
    if (fromToken.symbol === toToken.symbol) return 'Select different tokens';
    return 'Swap';
  }, [status, swapState, insufficientBalance, fromAmount, fromToken, toToken]);

  const buttonDisabled = !canSwap || (swapState !== 'idle' && swapState !== 'success');

  return (
    <DemoLayout>
      <div className="max-w-xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="text-center space-y-2">
          <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">SWAP</p>
          <h1 className="text-display-lg font-semibold tracking-tighter text-[var(--cc-ink)]">
            Token swap.
          </h1>
          <p className="text-[var(--cc-muted)] text-body-sm">Swap tokens with real DEX aggregator rates</p>
        </div>

        {/* ── Wallet Connect + Chain Selector ────────────── */}
        <div className="flex items-center justify-end gap-3 flex-wrap">
          {/* Chain selector */}
          <select
            value={chainId}
            onChange={(e) => handleChainChange(Number(e.target.value))}
            aria-label="Select blockchain network"
            className="bg-[var(--cc-canvas-soft-2)]/80 text-[var(--cc-ink)] text-body-sm rounded-md px-3 py-2 border border-[var(--cc-hairline-strong)]/50 outline-none cursor-pointer"
          >
            {SUPPORTED_CHAINS.map((c) => (
              <option key={c.chainId} value={c.chainId}>{c.name}</option>
            ))}
          </select>

          {isConnected ? (
            <div className="flex items-center gap-3">
              <span className="text-caption text-[var(--cc-muted)]">
                Balance: <span className="text-[var(--cc-ink)] font-semibold">{account.balance} {account.chainSymbol}</span>
              </span>
              <span className="text-caption text-[var(--cc-body)] font-[var(--font-mono)]">{account.chainName} · {shortenAddress(account.address ?? '')}</span>
              <button
                onClick={() => disconnect()}
                className="px-3 py-2 rounded-[6px] text-caption font-semibold bg-[var(--cc-canvas)] text-[var(--cc-body)] border border-[var(--cc-hairline)] hover:text-[var(--cc-ink)] hover:border-[var(--cc-hairline-strong)] transition-all"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect(primaryConnector?.id ?? 'io.metamask')}
              className="px-4 py-2 rounded-[6px] text-body-sm font-semibold bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:bg-[var(--cc-primary-hover)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cc-link)] transition-all"
            >
              Connect Wallet
            </button>
          )}
        </div>
        {error && (
          <div className="text-center text-body-sm text-[var(--cc-error)] bg-[var(--cc-error)]/10 border border-[var(--cc-error)]/20 rounded-md px-4 py-2">
            {error}
          </div>
        )}

        {/* ── Swap Card ──────────────────────────────────── */}
        <div className="bg-[var(--cc-canvas-soft-2)]/60 backdrop-blur-xl rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/60 shadow-[var(--cc-level4)] overflow-hidden">

          {/* FROM */}
          <div className="p-5 pb-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-body-sm font-medium text-[var(--cc-muted)]">From</span>
              <div className="flex items-center gap-2">
                <span className="text-caption text-[var(--cc-body)]">
                  Balance: <span className="text-[var(--cc-body)]">{fromToken.address === 'native' && isConnected ? account.balance : '—'}</span>
                </span>
                <button
                  onClick={handleMax}
                  className="text-caption font-semibold text-[var(--cc-link)] hover:text-[var(--cc-link)] transition-colors px-2 py-1 rounded bg-[var(--cc-link)]/10 hover:bg-[var(--cc-link)]/20"
                >
                  MAX
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TokenSelector
                tokens={tokens}
                selected={fromToken}
                onSelect={setFromToken}
                label="From"
                nativeBalance={isConnected ? account.balance : undefined}
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
                className="flex-1 bg-transparent text-right text-display-lg font-semibold text-[var(--cc-ink)] outline-none placeholder:text-[var(--cc-body)]"
              />
            </div>
            <div className="text-right mt-1">
              <span className="text-caption text-[var(--cc-body)]">{usdValue}</span>
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center -my-1 relative z-10">
            <button
              onClick={handleSwapTokens}
              className="w-10 h-10 bg-[var(--cc-canvas)] border-2 border-[var(--cc-hairline)] rounded-md flex items-center justify-center hover:bg-[var(--cc-canvas-soft-2)] active:scale-95 transition-all"
              title="Swap tokens"
              aria-label="Swap tokens"
            >
              <svg className="w-5 h-5 text-[var(--cc-body)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* TO */}
          <div className="p-5 pt-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-body-sm font-medium text-[var(--cc-muted)]">To</span>
              <span className="text-caption text-[var(--cc-body)]">
                Balance: <span className="text-[var(--cc-body)]">—</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <TokenSelector
                tokens={tokens}
                selected={toToken}
                onSelect={setToToken}
                label="To"
                nativeBalance={isConnected ? account.balance : undefined}
              />
              <div className="flex-1 text-right text-display-lg font-semibold text-[var(--cc-ink)] truncate">
                {displayToAmount || <span className="text-[var(--cc-body)]">0.0</span>}
              </div>
            </div>
            <div className="text-right mt-1">
              <span className="text-caption text-[var(--cc-body)]">
                {displayToAmount ? `$${parseFloat(displayToAmount.replace(/,/g, '')).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
              </span>
            </div>
          </div>

          {/* ── Slippage Tolerance ─────────────────────── */}
          <div className="px-5 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-caption text-[var(--cc-muted)]">Slippage</span>
              <div className="flex gap-1">
                {[0.1, 0.5, 1.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSlippage(s)}
                    className={`px-3 py-1 rounded-lg text-caption font-semibold transition-all ${
                      slippage === s
                        ? 'bg-[var(--cc-link)]/15 text-[var(--cc-link)] border border-[var(--cc-link)]/25'
                        : 'bg-[var(--cc-canvas-soft-2)]/50 text-[var(--cc-muted)] hover:bg-[var(--cc-muted)]/50 border border-transparent'
                    }`}
                    aria-label={`Set slippage to ${s}%`}
                  >
                    {s}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Swap Details ───────────────────────────── */}
          {(fromAmount && parseFloat(fromAmount) > 0) && (
            <div className="mx-5 p-4 bg-[var(--cc-canvas)]/50 rounded-md space-y-0.5 border border-[var(--cc-hairline-strong)]/30">
              {quote?.isSimulated && (
                <div className="mb-2 px-3 py-2 bg-[var(--cc-warning)]/10 border border-[var(--cc-warning)]/20 rounded-md flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-[var(--cc-warning)]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-caption text-[var(--cc-warning)] font-medium">Simulated Quote — 1inch API unavailable</span>
                </div>
              )}
              {displayRate && <DetailRow label="Rate" value={displayRate} />}
              <DetailRow
                label="Price Impact"
                value={`${displayPriceImpact}%`}
                highlight={parseFloat(displayPriceImpact) > 2 ? 'red' : parseFloat(displayPriceImpact) > 1 ? 'yellow' : 'green'}
              />
              <DetailRow label="Slippage Tolerance" value={`${slippage}%`} />
              {minReceived && <DetailRow label="Minimum Received" value={`${minReceived} ${toToken.symbol}`} />}
              <div className="border-t border-[var(--cc-hairline-strong)]/50 my-1" />
              {swapRoute && <DetailRow label="Route" value={swapRoute} />}
              {swapState === 'quoting' && (
                <div className="flex items-center gap-2 py-1">
                  <svg className="animate-spin h-3 w-3 text-[var(--cc-link)]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-caption text-[var(--cc-link)]">Fetching best rate from 1inch...</span>
                </div>
              )}
            </div>
          )}

          {/* ── Transaction Progress ─────────────────── */}
          {txSteps.length > 0 && swapState !== 'idle' && (
            <TxProgress steps={txSteps} />
          )}

          {/* ── Swap Button ────────────────────────────── */}
          <div className="p-5 pt-3">
            <button
              onClick={isConnected ? handleSwap : () => connect(primaryConnector?.id ?? 'io.metamask')}
              disabled={buttonDisabled}
              className={`w-full py-4 rounded-[6px] font-semibold text-body-lg transition-all ${
                swapState === 'success'
                  ? 'bg-[var(--cc-success)] text-[var(--cc-ink)] shadow-[var(--cc-level3)]'
                  : swapState === 'swapping' || swapState === 'approving'
                  ? 'bg-[var(--cc-link)]/80 text-[var(--cc-ink)] cursor-wait'
                  : swapState === 'quoting'
                  ? 'bg-[var(--cc-link)]/60 text-[var(--cc-on-primary)] cursor-wait'
                  : canSwap
                  ? 'bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:bg-[var(--cc-primary-hover)] shadow-[var(--cc-level3)] hover:shadow-[var(--cc-level4)] active:scale-[0.98]'
                  : 'bg-[var(--cc-canvas-soft-2)]/60 text-[var(--cc-body)] cursor-not-allowed'
              }`}
            >
              {(swapState === 'swapping' || swapState === 'approving' || swapState === 'quoting') && (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {buttonText}
                </span>
              )}
              {swapState !== 'swapping' && swapState !== 'approving' && swapState !== 'quoting' && buttonText}
            </button>
          </div>
        </div>

        {/* ── Recent Swaps History ─────────────────────── */}
        <div className="bg-[var(--cc-canvas-soft-2)]/60 backdrop-blur-xl rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--cc-hairline-strong)]/50">
            <h2 className="text-body-lg font-semibold tracking-tighter text-[var(--cc-ink)]">
              Swap History
              {swapHistory.length > 0 && (
                <span className="ml-2 text-caption text-[var(--cc-body)] font-normal">({swapHistory.length})</span>
              )}
            </h2>
          </div>
          {swapHistory.length === 0 ? (
            <div className="px-5 py-8 text-center text-[var(--cc-body)] text-body-sm">
              No swaps yet. Connect your wallet and make your first swap!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="text-[var(--cc-body)] text-caption uppercase tracking-normal font-[var(--font-mono)]">
                    <th className="text-left px-5 py-3 font-semibold">Tx</th>
                    <th className="text-left px-5 py-3 font-semibold">From → To</th>
                    <th className="text-right px-5 py-3 font-semibold">Amount</th>
                    <th className="text-right px-5 py-3 font-semibold hidden sm:table-cell">Route</th>
                    <th className="text-center px-5 py-3 font-semibold">Status</th>
                    <th className="text-right px-5 py-3 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {swapHistory.map((swap) => {
                    const timeAgo = getTimeAgo(swap.timestamp);
                    return (
                      <tr key={swap.id} className="border-t border-[var(--cc-hairline-strong)]/30 hover:bg-[var(--cc-canvas-soft-2)]/20 transition-colors">
                        <td className="px-5 py-3">
                          {swap.txHash ? (
                            <a
                              href={getBlockExplorerUrl(chainId, swap.txHash!)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[var(--cc-link)] font-[var(--font-mono)] text-caption hover:underline"
                            >
                              {shortenAddress(swap.txHash)}
                            </a>
                          ) : (
                            <span className="text-[var(--cc-link)] font-[var(--font-mono)] text-caption">{swap.id.slice(0, 8)}</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[var(--cc-ink)] font-medium">{swap.from}</span>
                          <span className="text-[var(--cc-body)] mx-1">→</span>
                          <span className="text-[var(--cc-ink)] font-medium">{swap.to}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="text-[var(--cc-ink)]">{swap.fromAmount} {swap.from}</div>
                          <div className="text-[var(--cc-body)] text-caption">→ {swap.toAmount} {swap.to}</div>
                        </td>
                        <td className="px-5 py-3 text-right text-[var(--cc-muted)] text-caption hidden sm:table-cell">
                          {swap.route}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-caption font-semibold ${
                              swap.status === 'completed'
                                ? 'bg-[var(--cc-success)]/15 text-[var(--cc-success)]'
                                : swap.status === 'pending'
                                ? 'bg-[var(--cc-warning)]/15 text-[var(--cc-warning)]'
                                : 'bg-[var(--cc-error)]/15 text-[var(--cc-error)]'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                swap.status === 'completed'
                                  ? 'bg-[var(--cc-success)]'
                                  : swap.status === 'pending'
                                  ? 'bg-[var(--cc-warning)] animate-pulse'
                                  : 'bg-[var(--cc-error)]'
                              }`}
                            />
                            {swap.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-[var(--cc-body)] text-caption">{timeAgo}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────── */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-[var(--cc-body)] text-caption">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--cc-primary)]" />
            <span>Powered by <span className="text-[var(--cc-body)] font-semibold">1inch DEX Aggregator</span></span>
          </div>
          <p className="text-[var(--cc-body)] text-caption">
            Best execution across Uniswap, SushiSwap, Curve, Balancer & more
          </p>
        </div>
      </div>
    </DemoLayout>
  );
}

/** Get block explorer URL for a tx on a given chain. */
function getBlockExplorerUrl(chainId: number, txHash: string): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    137: 'https://polygonscan.com',
    42161: 'https://arbiscan.io',
    8453: 'https://basescan.org',
    56: 'https://bscscan.com',
    10: 'https://optimistic.etherscan.io',
  };
  const base = explorers[chainId] ?? 'https://etherscan.io';
  return `${base}/tx/${txHash}`;
}

/** Format ISO timestamp to relative time string. */
function getTimeAgo(isoString: string): string {
  try {
    const then = new Date(isoString).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - then);
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return '';
  }
}
