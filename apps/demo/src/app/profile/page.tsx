'use client';

import { useState, useEffect, useCallback } from 'react';
import DemoLayout from '@/components/DemoLayout';
import { useWallet, shortenAddress } from '@/lib/useWallet';
import { getMultiChainBalances, CHAINS, type ChainBalance } from '@/lib/multiChain';
import { SimulatedBadge } from '@/components/DemoDisclaimer';

/* ── mock ENS data ── */

const ENS_CACHE: Record<string, string> = {
  // demo: real-looking ens names for common addresses
};

function resolveENS(address: string | null): string | null {
  if (!address) return null;
  return ENS_CACHE[address] ?? null;
}

/* ── mock avatar ── */

function AvatarDisplay({ address, size = 'lg' }: { address: string | null; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-20 h-20 text-xl', xl: 'w-32 h-32 text-3xl' };

  if (!address) {
    return (
      <div className={`${sizes[size]} rounded-full bg-[var(--cc-canvas-soft-2)] border-2 border-[var(--cc-hairline-strong)] flex items-center justify-center text-[var(--cc-body)]`}>
        <svg className="w-1/2 h-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    );
  }

  // Generate a deterministic gradient from address
  const hue1 = parseInt(address.slice(2, 6), 16) % 360;
  const hue2 = (hue1 + 120) % 360;
  const initials = address.slice(2, 4).toUpperCase();

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-[var(--cc-ink)] shadow-[0_4px_12px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.1)]`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 70%, 50%))`,
        boxShadow: `0 4px 20px hsla(${hue1}, 70%, 50%, 0.3)`,
      }}
    >
      {size === 'sm' ? initials[0] : initials}
    </div>
  );
}

/* ── portfolio summary ── */

function PortfolioSummary({ balances }: { balances: ChainBalance[] }) {
  const loaded = balances.filter((b) => b.status === 'loaded');
  const withBalance = loaded.filter((b) => parseFloat(b.balance) > 0);

  // TODO: Replace with real prices from a price API (e.g., CoinGecko)
  // In production, fetch live rates dynamically.
  const usdRates: Record<string, number> = {
    ETH: 3800, POL: 0.58, ARB: 0.85, OP: 1.80, BNB: 620,
    AVAX: 38, SOL: 175, BTC: 98000, ATOM: 7.5, NEAR: 5.2,
    SUI: 2.8, STRK: 0.45, HBAR: 0.08, TRX: 0.12, TON: 5.5,
  };

  let totalUsd = 0;
  const perChain: { chain: string; symbol: string; balance: string; usd: number }[] = [];

  withBalance.forEach((b) => {
    const rate = usdRates[b.chain.symbol] ?? 0;
    const balanceNum = parseFloat(b.balance);
    const usd = balanceNum * rate;
    totalUsd += usd;
    perChain.push({ chain: b.chain.name, symbol: b.chain.symbol, balance: b.balance, usd });
  });

  perChain.sort((a, b) => b.usd - a.usd);

  return (
    <div className="bg-[var(--cc-canvas-soft-2)]/60 backdrop-blur-xl rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/60 overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--cc-hairline-strong)]/50 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tighter text-[var(--cc-ink)]">💰 Portfolio Summary</h2>
        <span className="text-xs text-[var(--cc-body)]">{withBalance.length} chains with balance</span>
      </div>

      <div className="p-5">
        {/* Total */}
        <div className="text-center mb-6 p-4 rounded-md bg-gradient-to-b from-gray-900/60 to-gray-800/40 border border-[var(--cc-hairline-strong)]/30">
          <p className="text-xs text-[var(--cc-body)] mb-1">Total Estimated Value</p>
          <p className="text-3xl font-semibold tracking-tighter bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent inline-flex items-center gap-2">
            ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <SimulatedBadge size="xs" />
          </p>
          <p className="text-xs text-[var(--cc-body)] mt-1">Across {withBalance.length} chains</p>
          <p className="text-[10px] text-[var(--cc-warning)]/70 mt-1">⚠ Simulated values — not from live market data</p>
        </div>

        {/* Per-chain breakdown */}
        {perChain.length > 0 ? (
          <div className="space-y-2">
            {perChain.map((item) => {
              const pct = totalUsd > 0 ? (item.usd / totalUsd) * 100 : 0;
              return (
                <div key={item.chain} className="p-3 rounded-md bg-[var(--cc-canvas)]/40 border border-[var(--cc-hairline-strong)]/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[var(--cc-body)]">{item.chain}</span>
                    <span className="text-sm font-semibold text-[var(--cc-body)]">
                      ${item.usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--cc-body)]">{item.balance} {item.symbol}</span>
                    <div className="flex-1 h-1.5 bg-[var(--cc-canvas-soft-2)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--cc-body)] w-10 text-right">{pct.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-[var(--cc-body)]">
            No balances detected. Connect your wallet to see portfolio across chains.
          </div>
        )}
      </div>
    </div>
  );
}

/* ── wallet card ── */

function WalletCard({
  address,
  label,
  isPrimary,
  balances,
  onSwitch,
}: {
  address: string;
  label: string;
  isPrimary: boolean;
  balances: ChainBalance[];
  onSwitch: () => void;
}) {
  const totalBalance = balances
    .filter((b) => b.status === 'loaded')
    .reduce((sum, b) => sum + parseFloat(b.balance), 0);

  return (
    <div className={`p-5 rounded-md border transition-all ${
      isPrimary
        ? 'bg-brand-500/10 border-brand-500/30'
        : 'bg-[var(--cc-canvas)]/40 border-[var(--cc-hairline-strong)]/40 hover:border-[var(--cc-hairline-strong)]'
    }`}>
      <div className="flex items-center gap-4">
        <AvatarDisplay address={address} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm text-[var(--cc-body)] truncate">{shortenAddress(address)}</p>
            {isPrimary && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 font-semibold">
                Primary
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--cc-body)]">{label} · {balances.length} chains</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-[var(--cc-body)]">{totalBalance.toFixed(4)}</p>
          <button
            onClick={onSwitch}
            className="text-[10px] text-brand-400 hover:text-brand-300 transition-colors"
          >
            Switch →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── main page ── */

export default function ProfilePage() {
  const { account, status, connectors, connect, disconnect } = useWallet();
  const isConnected = status === 'connected';

  const [ensName, setEnsName] = useState<string | null>(null);
  const [balances, setBalances] = useState<ChainBalance[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock multi-wallet display
  const [wallets] = useState<Array<{ address: string; label: string }>>(() => {
    const w = [{ address: '0x0000000000000000000000000000000000000000', label: 'MetaMask' }];
    // Add mock wallets for demo purposes
    w.push({ address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', label: 'WalletConnect' });
    w.push({ address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326', label: 'Coinbase Wallet' });
    return w;
  });

  const handleConnect = useCallback(() => {
    connect(connectors.find((c) => c.id === 'io.metamask')?.id ?? 'io.metamask');
  }, [connect, connectors]);

  // Fetch ENS
  useEffect(() => {
    if (!account.address) { setEnsName(null); return; }
    const ens = resolveENS(account.address);
    if (ens) { setEnsName(ens); return; }

    // Try real ENS resolution via public RPC
    const fetchENS = async () => {
      try {
        const provider = (window as unknown as Record<string, unknown>).ethereum;
        if (!provider || typeof (provider as Record<string, unknown>).request !== 'function') return;
        // ENS reverse resolution would need eth_call with ABI-encoded data
        // For demo, we'll skip real ENS and show the mock cache
        // In production, use an ENS library
      } catch { /* ignore */ }
    };
    fetchENS();
  }, [account.address]);

  // Fetch multi-chain balances
  const fetchBalances = useCallback(async (addr: string) => {
    if (!addr) return;
    setLoading(true);
    try {
      const result = await getMultiChainBalances(addr);
      setBalances(result);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isConnected && account.address) {
      fetchBalances(account.address);
    } else {
      setBalances([]);
    }
  }, [isConnected, account.address, fetchBalances]);

  return (
    <DemoLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tighter bg-gradient-to-r from-brand-500 via-brand-400 to-brand-300 bg-clip-text text-transparent">
            Profile
          </h1>
          <p className="text-[var(--cc-muted)] text-sm">Your identity, wallets, and portfolio</p>
        </div>

        {/* ── Wallet connect ── */}
        {!isConnected && (
          <div className="text-center py-12 bg-[var(--cc-canvas-soft-2)]/30 rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/40">
            <AvatarDisplay address={null} size="xl" />
            <p className="text-[var(--cc-muted)] mt-4 text-sm">Connect your wallet to view your profile</p>
            <button
              onClick={handleConnect}
              className="mt-4 px-6 py-3 rounded-[100px] font-semibold bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:opacity-90 transition-all"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {isConnected && (
          <>
            {/* ── Profile Card ── */}
            <div className="bg-[var(--cc-canvas-soft-2)]/60 backdrop-blur-xl rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/60 overflow-hidden">
              {/* Banner */}
              <div className="h-24 bg-gradient-to-r from-brand-600/30 via-brand-500/30 to-brand-400/30 relative">
                <div className="absolute -bottom-10 left-6">
                  <AvatarDisplay address={account.address} size="xl" />
                </div>
              </div>

              <div className="pt-14 px-6 pb-6">
                {/* Name / ENS */}
                <div className="flex items-start justify-between">
                  <div>
                    {ensName ? (
                      <h2 className="text-xl font-semibold tracking-tighter text-[var(--cc-ink)]">{ensName}</h2>
                    ) : (
                      <h2 className="text-xl font-semibold tracking-tighter text-[var(--cc-ink)]">
                        {shortenAddress(account.address ?? '')}
                      </h2>
                    )}
                    <p className="text-xs text-[var(--cc-body)] font-mono mt-1">{account.address}</p>
                    {ensName && (
                      <p className="text-xs text-[var(--cc-body)] font-mono mt-0.5">{account.address}</p>
                    )}
                  </div>
                  <button
                    onClick={() => disconnect()}
                    className="px-4 py-2 rounded-md text-xs font-semibold bg-[var(--cc-error)]/10 text-[var(--cc-error)] border border-red-500/20 hover:bg-[var(--cc-error)]/20 transition-all"
                  >
                    Disconnect
                  </button>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="p-3 rounded-md bg-[var(--cc-canvas)]/50 border border-[var(--cc-hairline-strong)]/30 text-center">
                    <p className="text-xs text-[var(--cc-body)]">Network</p>
                    <p className="text-sm font-semibold text-[var(--cc-body)]">{account.chainName}</p>
                  </div>
                  <div className="p-3 rounded-md bg-[var(--cc-canvas)]/50 border border-[var(--cc-hairline-strong)]/30 text-center">
                    <p className="text-xs text-[var(--cc-body)]">Balance</p>
                    <p className="text-sm font-semibold text-[var(--cc-body)]">{account.balance} {account.chainSymbol}</p>
                  </div>
                  <div className="p-3 rounded-md bg-[var(--cc-canvas)]/50 border border-[var(--cc-hairline-strong)]/30 text-center">
                    <p className="text-xs text-[var(--cc-body)]">Chain ID</p>
                    <p className="text-sm font-semibold text-[var(--cc-body)]">{account.chainId}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Multi-Wallet Display ── */}
            <div className="bg-[var(--cc-canvas-soft-2)]/60 backdrop-blur-xl rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/60 overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--cc-hairline-strong)]/50">
                <h2 className="text-lg font-semibold tracking-tighter text-[var(--cc-ink)]">👛 Connected Wallets</h2>
                <p className="text-xs text-[var(--cc-body)] mt-1">All wallets linked to this profile</p>
              </div>
              <div className="p-5 space-y-3">
                {wallets.map((w, i) => (
                  <WalletCard
                    key={i}
                    address={w.address}
                    label={w.label}
                    isPrimary={i === 0}
                    balances={w.address === account.address ? balances : []}
                    onSwitch={() => {
                      // In a real app, this would switch the active wallet
                    }}
                  />
                ))}
              </div>
            </div>

            {/* ── Portfolio Summary ── */}
            <PortfolioSummary balances={balances} />

            {/* ── Loading indicator ── */}
            {loading && (
              <div className="flex items-center justify-center py-4 text-sm text-[var(--cc-muted)]">
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading balances…
              </div>
            )}
          </>
        )}
      </div>
    </DemoLayout>
  );
}
