import React from 'react'

export function AddressDisplay({ address, truncate = false }: { address: string; truncate?: boolean }) {
  if (!address) return null
  const display = truncate
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address
  return (
    <div className="cc-mono inline-flex items-center gap-1">
      {display}
    </div>
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
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-caption font-medium
      ${chain.color || 'bg-[var(--cc-canvas-soft)] text-[var(--cc-body)]'}`}>
      {chain.icon} {chain.name}
    </span>
  )
}

export function BalanceCard({ balance, chain }: { balance: string; chain?: ChainInfo }) {
  return (
    <div className="p-4 bg-gradient-to-br from-[var(--cc-canvas-soft)] to-[var(--cc-canvas)]
      rounded-lg border border-[var(--cc-hairline)]">
      <p className="cc-body-xs text-[var(--cc-body)] mb-1">当前余额</p>
      <div className="flex items-baseline gap-2">
        <span className="cc-title-lg">{balance}</span>
        <span className="cc-title-sm text-[var(--cc-body)]">{chain?.symbol || 'ETH'}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-caption">
        <span className="text-[var(--cc-body)]">≈</span>
        <span className="text-[var(--cc-ink)]">
          ${(parseFloat(balance) * (chain?.usdPrice || 3000)).toLocaleString()}
        </span>
      </div>
    </div>
  )
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <div>
      <h4 className="cc-body mb-3">最近交易</h4>
      <div className="space-y-2">
        {transactions.length === 0 ? (
          <div className="text-center py-4 text-[var(--cc-body)]">
            暂无交易记录
          </div>
        ) : (
          transactions.slice(0, 5).map((tx) => (
            <div
              key={tx.hash}
              className="cc-card p-3 flex items-center justify-between text-body-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full
                  ${tx.status === 'success' ? 'bg-[var(--cc-success)]' :
                    tx.status === 'pending' ? 'bg-[var(--cc-accent)]' :
                    'bg-[var(--cc-error)]'}`} />
                <div>
                  <p className="cc-mono text-caption">{tx.hash.slice(0, 8)}...</p>
                  <p className="text-[var(--cc-body)] text-caption">
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="cc-title-sm">{tx.value} ETH</p>
                <span className={`inline-block px-2 py-1 rounded text-[10px]
                  ${tx.status === 'success' ? 'bg-[var(--cc-success)/20] text-[var(--cc-success)]' :
                    tx.status === 'pending' ? 'bg-[var(--cc-accent)/20] text-[var(--cc-accent)]' :
                    'bg-[var(--cc-error)/20] text-[var(--cc-error)]'}`}>
                  {tx.status === 'success' ? '成功' : tx.status === 'pending' ? '待确认' : '失败'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
