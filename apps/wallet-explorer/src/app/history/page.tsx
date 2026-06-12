'use client';

import { useWallet } from '@/hooks/useWallet';
import { truncateAddress } from '@/lib/utils';
import { ArrowUp, ArrowDown, FileText } from 'lucide-react';
import type { Transaction } from '@/types';

const mockHistory: Transaction[] = [
  { hash: '0x8ba1f109551bD432803012645Ac136ddd64DBA72', type: 'receive', from: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: '100.5031', fee: '0.00214', block: 18543210, timestamp: '2 hours ago', status: 'success' },
  { hash: '0x1f4e2d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e', type: 'send', from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', to: '0xDeaDBeeF00000000000000000000000000000000', value: '50.25', fee: '0.00183', block: 18543195, timestamp: '5 hours ago', status: 'success' },
  { hash: '0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d', type: 'contract', from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', value: '0', fee: '0.00457', block: 18543180, timestamp: '8 hours ago', status: 'success' },
  { hash: '0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e', type: 'receive', from: '0x1234567890AbCdEf1234567890aBcDeF12345678', to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: '253.8741', fee: '0.00231', block: 18543165, timestamp: 'yesterday', status: 'success' },
  { hash: '0x4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f', type: 'send', from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', to: '0xFEDCBA0987654321FEDCBA0987654321FEDCBA09', value: '75.80', fee: '0.00190', block: 18543150, timestamp: 'Jun 7, 18:41 UTC', status: 'failed' },
  { hash: '0x5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a', type: 'receive', from: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12', to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: '489.17', fee: '0.00204', block: 18543135, timestamp: 'Jun 7, 10:12 UTC', status: 'success' },
  { hash: '0x6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b', type: 'send', from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', to: '0x11111112542D8803e1B2C7a8e3F1d4C5B6A79800', value: '1,847.0923', fee: '0.00321', block: 18543120, timestamp: 'Jun 6', status: 'success' },
  { hash: '0x7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c', type: 'contract', from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', value: '0', fee: '0.00894', block: 18543105, timestamp: 'Jun 6', status: 'pending' },
];

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  send: ArrowUp,
  receive: ArrowDown,
  contract: FileText,
};
const statusBadge: Record<string, string> = {
  success: 'badge-success',
  failed: 'badge-error',
  pending: 'badge-warning',
};

export default function HistoryPage() {
  const { connected, connect } = useWallet();

  if (!connected) {
    return (
      <div className="cc-card text-center py-12">
        <h2 className="text-heading-2 text-[var(--cc-ink)]">Transaction history</h2>
        <p className="mt-2 text-body text-mute">Connect your wallet to view your transaction history.</p>
        <button onClick={connect} className="cc-btn-primary mt-6">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-2 text-[var(--cc-ink)]">Transaction history</h1>
        <p className="mt-1 text-body text-mute">Complete record of all your transactions.</p>
      </div>

      <div className="cc-card p-0 overflow-hidden">
        {mockHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <FileText className="mb-4 h-12 w-12 text-mute" aria-hidden="true" />
            <h3 className="text-heading-3 text-[var(--cc-ink)] mb-1">No transaction history.</h3>
            <p className="text-body-sm text-mute max-w-sm">Your transaction history will appear here once you make your first transaction.</p>
          </div>
        ) : (
          mockHistory.map((tx) => (
            <div
              key={tx.hash}
              className="p-5 border-b border-[var(--cc-hairline)] last:border-b-0 transition-colors hover:bg-[var(--cc-canvas-soft)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--cc-canvas-soft-2)]">
                    {(() => {
                      const Icon = typeIcons[tx.type];
                      return Icon ? <Icon className="h-5 w-5" /> : null;
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-caption-mono text-link">
                        {truncateAddress(tx.hash, 10, 8)}
                      </code>
                      <span className={`badge ${statusBadge[tx.status]}`}>
                        {tx.status}
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
                  <p className={`amount text-body-sm ${tx.type === 'send' ? 'amount-negative' : 'amount-positive'}`}>
                    {tx.type === 'send' ? '-' : '+'}{tx.value} CINA
                  </p>
                  <p className="mt-1 text-caption text-mute">{tx.timestamp}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-caption text-mute">
                <span>Block. <span className="text-body font-[var(--font-mono)]">{tx.block.toLocaleString()}</span></span>
                <span>Fee. <span className="text-body font-[var(--font-mono)]">{tx.fee} CINA</span></span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
