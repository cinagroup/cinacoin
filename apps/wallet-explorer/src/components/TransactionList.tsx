'use client';

import { memo } from 'react';
import { ArrowUp, ArrowDown, FileText } from 'lucide-react';
import type { Transaction } from '@/types';
import { truncateAddress } from '@/lib/utils';

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  send: ArrowUp,
  receive: ArrowDown,
  contract: FileText,
};

const typeColors: Record<string, string> = {
  send: 'text-error bg-error-light',
  receive: 'text-success bg-success-light',
  contract: 'text-link bg-[var(--color-link-bg-soft)]',
};

const statusColors: Record<string, string> = {
  success: 'text-success',
  failed: 'text-error',
  pending: 'text-warning',
};

interface TransactionListProps {
  transactions: Transaction[];
}

export default memo(function TransactionList({ transactions }: TransactionListProps) {
  return (
    <div className="cc-card p-0 overflow-hidden">
      <div className="border-b border-hairline p-5">
        <h2 className="text-heading-3 text-ink">Transactions.</h2>
      </div>
      <div>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="mb-4 text-4xl text-mute" aria-hidden="true">∅</div>
            <h3 className="text-heading-3 text-ink mb-1">No transactions yet.</h3>
            <p className="text-body-sm text-mute max-w-sm">Your transaction history will appear here once you make your first transaction.</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.hash} className="p-5 border-b border-hairline last:border-b-0 transition-colors hover:bg-canvas-soft">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${typeColors[tx.type]}`}>
                    {(() => {
                      const Icon = typeIcons[tx.type];
                      return Icon ? <Icon className="h-5 w-5" /> : null;
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-link cursor-pointer hover:underline" style={{ fontSize: 'var(--cc-text-xs)' }}>
                        {truncateAddress(tx.hash, 10, 8)}
                      </code>
                      <span className={`text-caption ${statusColors[tx.status]}`}>
                        {tx.status === 'success' && '●'}
                        {tx.status === 'failed' && '●'}
                        {tx.status === 'pending' && '○'}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-body-sm text-mute">
                      <code className="text-caption-mono">
                        {truncateAddress(tx.from)}
                      </code>
                      <span>→</span>
                      <code className="text-caption-mono">
                        {truncateAddress(tx.to)}
                      </code>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`amount text-body-sm-strong ${tx.type === 'send' ? 'amount-negative' : 'amount-positive'}`}>
                    {tx.type === 'send' ? '-' : '+'}{tx.value} CINA
                  </p>
                  <p className="mt-1 text-caption text-mute">{tx.timestamp}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-caption text-mute">
                <span>Block: <span className="text-body">{tx.block.toLocaleString()}</span></span>
                <span>Fee: <span className="text-body">{tx.fee} CINA</span></span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
