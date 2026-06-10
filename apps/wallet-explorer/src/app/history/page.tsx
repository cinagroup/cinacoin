'use client';

import { useWallet } from '@/hooks/useWallet';

type TxType = 'send' | 'receive' | 'contract';

interface HistoryTx {
  hash: string;
  type: TxType;
  from: string;
  to: string;
  value: string;
  fee: string;
  block: number;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
}

const mockHistory: HistoryTx[] = [
  { hash: '0x8ba1f109551bD432803012645Ac136ddd64DBA72', type: 'receive', from: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: '100.50', fee: '0.0021', block: 18543210, timestamp: 'Jun 8, 2026 23:00 UTC', status: 'success' },
  { hash: '0x1f4e2d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e', type: 'send', from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', to: '0xDeaDBeeF00000000000000000000000000000000', value: '50.25', fee: '0.0018', block: 18543195, timestamp: 'Jun 8, 2026 20:00 UTC', status: 'success' },
  { hash: '0x2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d', type: 'contract', from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', to: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', value: '0', fee: '0.0045', block: 18543180, timestamp: 'Jun 8, 2026 17:00 UTC', status: 'success' },
  { hash: '0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e', type: 'receive', from: '0x1234567890AbCdEf1234567890aBcDeF12345678', to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: '250.00', fee: '0.0023', block: 18543165, timestamp: 'Jun 8, 2026 13:00 UTC', status: 'success' },
  { hash: '0x4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f', type: 'send', from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', to: '0xFEDCBA0987654321FEDCBA0987654321FEDCBA09', value: '75.80', fee: '0.0019', block: 18543150, timestamp: 'Jun 7, 2026 18:00 UTC', status: 'failed' },
  { hash: '0x5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a', type: 'receive', from: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12', to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', value: '500.00', fee: '0.0020', block: 18543135, timestamp: 'Jun 7, 2026 10:00 UTC', status: 'success' },
  { hash: '0x6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b', type: 'send', from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', to: '0x11111112542D8803e1B2C7a8e3F1d4C5B6A79800', value: '1,000.00', fee: '0.0032', block: 18543120, timestamp: 'Jun 6, 2026 22:00 UTC', status: 'success' },
  { hash: '0x7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c', type: 'contract', from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', value: '0', fee: '0.0089', block: 18543105, timestamp: 'Jun 6, 2026 14:00 UTC', status: 'pending' },
];

const typeIcons: Record<TxType, string> = { send: '↑', receive: '↓', contract: '📄' };
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
        <h2 className="text-heading-2 text-ink">Transaction History</h2>
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
        <h1 className="text-heading-2 text-ink">Transaction History</h1>
        <p className="mt-1 text-body text-mute">Complete record of all your transactions.</p>
      </div>

      <div className="cc-card p-0 overflow-hidden">
        {mockHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="mb-4 text-4xl" aria-hidden="true">📜</div>
            <h3 className="text-heading-3 text-ink mb-1">No transaction history</h3>
            <p className="text-body-sm text-mute max-w-sm">Your transaction history will appear here once you make your first transaction.</p>
          </div>
        ) : mockHistory.map((tx) => (
          <div
            key={tx.hash}
            className="p-5 border-b border-hairline last:border-b-0 transition-colors hover:bg-canvas-soft"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-canvas-soft-2 text-body-lg">
                  {typeIcons[tx.type]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <code className="text-caption-mono text-link">
                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                    </code>
                    <span className={`badge ${statusBadge[tx.status]}`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-body-sm text-mute">
                    <code className="text-caption-mono">
                      {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
                    </code>
                    <span>→</span>
                    <code className="text-caption-mono">
                      {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
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
              <span>Block: <span className="text-body font-[var(--font-mono)]">{tx.block.toLocaleString()}</span></span>
              <span>Fee: <span className="text-body font-[var(--font-mono)]">{tx.fee} CINA</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
