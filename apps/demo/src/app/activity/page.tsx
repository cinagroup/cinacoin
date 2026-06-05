'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import DemoLayout from '@/components/DemoLayout';
import { useWallet, shortenAddress } from '@/lib/useWallet';
import { getConnectionHistory, type ConnectionRecord } from '@/lib/connectionHistory';
import { getSwapHistory, type SwapHistoryEntry } from '@/lib/swap';

/* ── types ── */

type ActivityType = 'connection' | 'swap' | 'chain_switch' | 'auth';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  chain?: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: number;
  hash?: string;
  metadata?: Record<string, string>;
}

const CHAINS = [
  'All', 'Ethereum', 'Polygon', 'Arbitrum', 'Base', 'Optimism',
  'BNB Chain', 'Solana', 'Avalanche', 'TON', 'Cosmos',
];

const TYPE_FILTERS: { value: ActivityType | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '📋' },
  { value: 'connection', label: 'Connections', icon: '🔗' },
  { value: 'swap', label: 'Swaps', icon: '🔄' },
  { value: 'chain_switch', label: 'Chain Switches', icon: '🌐' },
  { value: 'auth', label: 'Auth', icon: '🔐' },
];

const PAGE_SIZE = 10;

/* ── helpers ── */

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString();
}

function typeIcon(type: ActivityType): string {
  switch (type) {
    case 'connection': return '🔗';
    case 'swap': return '🔄';
    case 'chain_switch': return '🌐';
    case 'auth': return '🔐';
  }
}

function statusColor(status: ActivityItem['status']): string {
  switch (status) {
    case 'completed': return 'bg-[var(--cc-success)]/15 text-[var(--cc-success)] border-emerald-500/25';
    case 'pending': return 'bg-[var(--cc-warning)]/15 text-[var(--cc-warning)] border-amber-500/25';
    case 'failed': return 'bg-[var(--cc-error)]/15 text-[var(--cc-error)] border-red-500/25';
  }
}

/* ── mock data generator ── */

function generateMockActivities(
  connections: ConnectionRecord[],
  swaps: SwapHistoryEntry[],
  walletAddress: string | null,
): ActivityItem[] {
  const items: ActivityItem[] = [];

  // Connection history
  connections.forEach((c, i) => {
    items.push({
      id: `conn-${i}`,
      type: 'connection',
      title: 'Wallet Connected',
      description: `${shortenAddress(c.address)} via ${c.connectorName}`,
      chain: c.chainName,
      status: 'completed',
      timestamp: c.connectedAt,
      metadata: { connector: c.connectorName, chainId: String(c.chainId) },
    });
  });

  // Swap history
  swaps.forEach((s, i) => {
    items.push({
      id: `swap-${i}`,
      type: 'swap',
      title: `Swap ${s.from} → ${s.to}`,
      description: `${s.fromAmount} ${s.from} → ${s.toAmount} ${s.to}`,
      chain: s.chainId ? `Chain ${s.chainId}` : undefined,
      status: s.status === 'completed' ? 'completed' : s.status === 'pending' ? 'pending' : 'failed',
      timestamp: new Date(s.timestamp).getTime(),
      hash: s.txHash,
      metadata: { rate: s.rate, route: s.route },
    });
  });

  // Mock auth activities
  if (walletAddress) {
    items.push({
      id: 'auth-1',
      type: 'auth',
      title: 'SIWE Authentication',
      description: `Wallet ownership verified for ${shortenAddress(walletAddress)}`,
      status: 'completed',
      timestamp: Date.now() - 86400000 * 2,
      metadata: { method: 'SIWE', standard: 'EIP-4361' },
    });
    items.push({
      id: 'auth-2',
      type: 'auth',
      title: 'Passkey Registered',
      description: 'New biometric credential added',
      status: 'completed',
      timestamp: Date.now() - 86400000 * 5,
      metadata: { method: 'WebAuthn' },
    });
  }

  // Mock chain switch activities
  const chainSwitches = [
    { chain: 'Ethereum', ts: Date.now() - 3600000 },
    { chain: 'Polygon', ts: Date.now() - 7200000 },
    { chain: 'Arbitrum', ts: Date.now() - 14400000 },
  ];
  chainSwitches.forEach((cs, i) => {
    items.push({
      id: `switch-${i}`,
      type: 'chain_switch',
      title: `Switched to ${cs.chain}`,
      description: `Network changed to ${cs.chain}`,
      chain: cs.chain,
      status: 'completed',
      timestamp: cs.ts,
    });
  });

  // Sort by timestamp descending
  items.sort((a, b) => b.timestamp - a.timestamp);
  return items;
}

/* ── main page ── */

export default function ActivityPage() {
  const { account, status, connectors, connect } = useWallet();
  const isConnected = status === 'connected';

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [chainFilter, setChainFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all');
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load activities
  useEffect(() => {
    const conns = getConnectionHistory();
    const swps = getSwapHistory();
    const all = generateMockActivities(conns, swps, account.address);
    setActivities(all);
  }, [account.address]);

  // Filtered + paginated
  const filtered = useMemo(() => {
    let result = activities;
    if (typeFilter !== 'all') {
      result = result.filter((a) => a.type === typeFilter);
    }
    if (chainFilter !== 'All') {
      result = result.filter((a) => a.chain === chainFilter);
    }
    return result;
  }, [activities, typeFilter, chainFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Stats
  const stats = useMemo(() => ({
    total: activities.length,
    completed: activities.filter((a) => a.status === 'completed').length,
    pending: activities.filter((a) => a.status === 'pending').length,
    failed: activities.filter((a) => a.status === 'failed').length,
  }), [activities]);

  const handleConnect = useCallback(() => {
    connect(connectors.find((c) => c.id === 'io.metamask')?.id ?? 'io.metamask');
  }, [connect, connectors]);

  return (
    <DemoLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tighter bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Activity History
          </h1>
          <p className="text-[var(--cc-muted)] text-sm">Track all your wallet interactions and transactions</p>
        </div>

        {/* ── Wallet connect bar ── */}
        <div className="flex items-center justify-between bg-[var(--cc-canvas-soft-2)]/40 backdrop-blur rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/50 px-5 py-4">
          {isConnected ? (
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-[var(--cc-ink)]">
                {account.address?.slice(2, 4).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-mono text-[var(--cc-body)]">{shortenAddress(account.address ?? '')}</p>
                <p className="text-xs text-[var(--cc-body)]">{account.chainName} · Balance: {account.balance} {account.chainSymbol}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="px-5 py-2.5 rounded-[100px] text-sm font-semibold bg-[var(--cc-primary)] text-[var(--cc-on-primary)] hover:opacity-90 transition-all"
            >
              Connect Wallet
            </button>
          )}
          <span className="text-xs text-[var(--cc-body)]">{activities.length} activities</span>
        </div>

        {/* ── Stats bar ── */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-[var(--cc-ink)]' },
            { label: 'Completed', value: stats.completed, color: 'text-[var(--cc-success)]' },
            { label: 'Pending', value: stats.pending, color: 'text-[var(--cc-warning)]' },
            { label: 'Failed', value: stats.failed, color: 'text-[var(--cc-error)]' },
          ].map((s) => (
            <div key={s.label} className="text-center p-4 rounded-md bg-[var(--cc-canvas-soft-2)]/40 border border-[var(--cc-hairline-strong)]/40">
              <div className={`text-2xl font-semibold tracking-tighter ${s.color}`}>{s.value}</div>
              <div className="text-xs text-[var(--cc-body)] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="space-y-3">
          {/* Type filter */}
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setTypeFilter(f.value); setPage(0); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  typeFilter === f.value
                    ? 'bg-blue-500/15 text-blue-400 border border-[var(--cc-primary)]/30'
                    : 'bg-[var(--cc-canvas-soft-2)]/40 text-[var(--cc-muted)] border border-[var(--cc-hairline-strong)]/40 hover:text-[var(--cc-ink)] hover:border-[var(--cc-hairline-strong)]'
                }`}
              >
                <span>{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>

          {/* Chain filter */}
          <div className="relative">
            <select
              value={chainFilter}
              onChange={(e) => { setChainFilter(e.target.value); setPage(0); }}
              className="w-full px-4 py-2.5 bg-[var(--cc-canvas-soft-2)]/60 border border-[var(--cc-hairline-strong)]/50 rounded-md text-sm text-[var(--cc-body)] focus:outline-none focus:ring-2 focus:ring-[var(--cc-primary)]/40 appearance-none cursor-pointer"
            >
              {CHAINS.map((c) => (
                <option key={c} value={c}>{c === 'All' ? 'All Chains' : c}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--cc-body)] text-xs">▾</span>
          </div>
        </div>

        {/* ── Activity List ── */}
        {paginated.length === 0 ? (
          <div className="text-center py-16 bg-[var(--cc-canvas-soft-2)]/30 rounded-[var(--cc-radius-md)] border border-[var(--cc-hairline-strong)]/40">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-[var(--cc-muted)] text-sm">No activities found</p>
            <p className="text-[var(--cc-body)] text-xs mt-1">Connect your wallet and start interacting to see activity here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {paginated.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="w-full text-left p-4 rounded-md bg-[var(--cc-canvas-soft-2)]/40 border border-[var(--cc-hairline-strong)]/40 hover:border-[var(--cc-hairline-strong)]/60 hover:bg-[var(--cc-canvas-soft-2)]/60 transition-all"
                  aria-expanded={expandedId === item.id}
                  aria-label={`${item.title} - ${item.status}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{typeIcon(item.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--cc-body)] truncate">{item.title}</p>
                      <p className="text-xs text-[var(--cc-body)] truncate">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.chain && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--cc-canvas-soft-2)]/60 text-[var(--cc-muted)]">
                          {item.chain}
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusColor(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="text-[10px] text-[var(--cc-body)]">{timeAgo(item.timestamp)}</span>
                      <svg className={`w-4 h-4 text-[var(--cc-body)] transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {expandedId === item.id && (
                  <div className="mt-1 p-4 rounded-md bg-[var(--cc-canvas)]/60 border border-[var(--cc-hairline-strong)]/30 space-y-2 ml-8">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[var(--cc-body)]">Type:</span>
                        <span className="text-[var(--cc-body)] ml-2 capitalize">{item.type.replace('_', ' ')}</span>
                      </div>
                      <div>
                        <span className="text-[var(--cc-body)]">Status:</span>
                        <span className={`ml-2 font-semibold ${
                          item.status === 'completed' ? 'text-[var(--cc-success)]' : item.status === 'pending' ? 'text-[var(--cc-warning)]' : 'text-[var(--cc-error)]'
                        }`}>{item.status}</span>
                      </div>
                      <div>
                        <span className="text-[var(--cc-body)]">Time:</span>
                        <span className="text-[var(--cc-body)] ml-2">{formatDate(item.timestamp)}</span>
                      </div>
                      {item.chain && (
                        <div>
                          <span className="text-[var(--cc-body)]">Chain:</span>
                          <span className="text-[var(--cc-body)] ml-2">{item.chain}</span>
                        </div>
                      )}
                    </div>
                    {item.hash && (
                      <div className="pt-2 border-t border-[var(--cc-hairline)]/50">
                        <span className="text-[10px] text-[var(--cc-body)]">Transaction Hash:</span>
                        <p className="font-mono text-xs text-blue-400 break-all mt-1">{item.hash}</p>
                      </div>
                    )}
                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                      <div className="pt-2 border-t border-[var(--cc-hairline)]/50">
                        <span className="text-[10px] text-[var(--cc-body)]">Details:</span>
                        <div className="mt-1 space-y-1">
                          {Object.entries(item.metadata).map(([k, v]) => (
                            <div key={k} className="flex text-xs">
                              <span className="text-[var(--cc-body)] w-24 shrink-0">{k}:</span>
                              <span className="text-[var(--cc-body)] font-mono">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-[var(--cc-canvas-soft-2)]/30 rounded-md border border-[var(--cc-hairline-strong)]/40 px-5 py-3">
            <span className="text-xs text-[var(--cc-body)]">
              Page {page + 1} of {totalPages} · {filtered.length} items
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--cc-canvas-soft-2)]/50 text-[var(--cc-muted)] border border-[var(--cc-hairline-strong)]/40 hover:text-[var(--cc-ink)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Previous page"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--cc-canvas-soft-2)]/50 text-[var(--cc-muted)] border border-[var(--cc-hairline-strong)]/40 hover:text-[var(--cc-ink)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </DemoLayout>
  );
}
