import type { TransactionDetail as TransactionDetailType } from '@/types';

interface TransactionDetailProps {
  tx: TransactionDetailType;
}

export default function TransactionDetail({ tx }: TransactionDetailProps) {
  const statusConfig = {
    success: { badge: 'badge-success', label: 'Success' },
    failed: { badge: 'badge-error', label: 'Failed' },
    pending: { badge: 'badge-warning', label: 'Pending' },
  };

  const status = statusConfig[tx.status];

  return (
    <div className="cc-card">
      <div className="flex items-start justify-between">
        <h2 className="text-heading-3 text-ink">Transaction detail.</h2>
        <span className={`badge ${status.badge}`}>
          {status.label}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-caption text-mute">Transaction hash.</p>
            <code className="mt-1 block break-all text-link">{tx.hash}</code>
          </div>
          <div>
            <p className="text-caption text-mute">Block.</p>
            <p className="mt-1 text-body font-[var(--font-mono)] text-ink">{tx.block.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-caption text-mute">From.</p>
            <code className="mt-1 block break-all text-link">{tx.from}</code>
          </div>
          <div>
            <p className="text-caption text-mute">To.</p>
            <code className="mt-1 block break-all text-link">{tx.to}</code>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-canvas-soft-2 rounded-lg p-4">
            <p className="text-caption text-mute">Value.</p>
            <p className="mt-1 text-display-sm text-ink">{tx.value} CINA</p>
          </div>
          <div className="bg-canvas-soft-2 rounded-lg p-4">
            <p className="text-caption text-mute">Transaction fee.</p>
            <p className="mt-1 text-display-sm text-ink">{tx.fee} CINA</p>
          </div>
          <div className="bg-canvas-soft-2 rounded-lg p-4">
            <p className="text-caption text-mute">Confirmations.</p>
            <p className="mt-1 text-display-sm text-ink">{tx.confirmations.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-caption text-mute">Gas used.</p>
            <p className="mt-1 text-body font-[var(--font-mono)] text-ink">{tx.gasUsed}</p>
          </div>
          <div>
            <p className="text-caption text-mute">Gas price.</p>
            <p className="mt-1 text-body font-[var(--font-mono)] text-ink">{tx.gasPrice} Gwei</p>
          </div>
        </div>

        <div>
          <p className="text-caption text-mute">Timestamp.</p>
          <p className="mt-1 text-body text-ink">{tx.timestamp}</p>
        </div>

        <div>
          <p className="text-caption text-mute">Input data.</p>
          <code className="mt-1 block rounded bg-canvas-soft-2 p-3 text-code text-body break-all">
            {tx.input}
          </code>
        </div>
      </div>
    </div>
  );
}
