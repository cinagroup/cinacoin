import React from 'react'

export function AddressDisplay({ address, truncate = false }: { address: string; truncate?: boolean }) {
  if (!address) return null
  const display = truncate
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address
  return (
    <span className="font-[var(--font-mono)] text-caption text-[var(--cc-body)]">
      {display}
    </span>
  )
}

interface ChainInfo {
  color?: string;
  icon?: string;
  name?: string;
  symbol?: string;
  usdPrice?: number;
}

interface Transaction {
  hash: string;
  status: 'success' | 'pending' | 'failed';
  [key: string]: unknown;
}

export function ChainBadge({ chain }: { chain?: ChainInfo }) {
  if (!chain) return null
  return (
    <span className="cc-badge">
      {chain.icon} {chain.name}
    </span>
  )
}

export function BalanceCard({ balance, chain }: { balance: string; chain?: ChainInfo }) {
  return (
    <div className="bg-[var(--cc-canvas-soft-2)] rounded-lg p-4 border border-[var(--cc-hairline)]">
      <p className="text-caption text-[var(--cc-muted)] mb-1">Current balance</p>
      <div className="flex items-baseline gap-2">
        <span className="cc-display-sm">{balance}</span>
        <span className="text-body-sm text-[var(--cc-body)]">{chain?.symbol || 'ETH'}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-caption">
        <span className="text-[var(--cc-muted)]">≈</span>
        <span className="text-[var(--cc-ink)] font-medium">
          ${(parseFloat(balance) * (chain?.usdPrice || 3000)).toLocaleString()}
        </span>
      </div>
    </div>
  )
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <div>
      <h4 className="cc-body-sm-strong text-[var(--cc-ink)] mb-3">Recent transactions</h4>
      <div className="space-y-2">
        {transactions.length === 0 ? (
          <div className="text-center py-4 cc-body-sm text-[var(--cc-muted)]">
            No transactions yet
          </div>
        ) : (
          transactions.slice(0, 5).map((tx) => (
            <div
              key={tx.hash}
              className="cc-card !p-3 flex items-center justify-between text-body-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full
                  ${tx.status === 'success' ? 'bg-[var(--cc-success)]' :
                    tx.status === 'pending' ? 'bg-[var(--cc-warning)]' :
                    'bg-[var(--cc-error)]'}`} />
                <div>
                  <p className="font-[var(--font-mono)] text-caption text-[var(--cc-body)]">{tx.hash.slice(0, 8)}...</p>
                  <p className="text-caption text-[var(--cc-muted)]">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-body-sm font-medium">{tx.value} ETH</p>
                <span className={`cc-badge text-[10px] ${
                  tx.status === 'success' ? '!bg-[var(--cc-success-bg)] text-[var(--cc-success)]' :
                  tx.status === 'pending' ? '!bg-[var(--cc-warning-bg)] text-[var(--cc-warning)]' :
                  '!bg-[var(--cc-error-bg)] text-[var(--cc-error)]'}`}>
                  {tx.status === 'success' ? 'Success' : tx.status === 'pending' ? 'Pending' : 'Failed'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
