interface WalletInfoProps {
  address: string;
  balance: string;
  tokenBalance?: string;
  txCount: number;
  firstSeen: string;
}

export default function WalletInfo({ address, balance, tokenBalance, txCount, firstSeen }: WalletInfoProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-heading-3 text-ink">Wallet Details</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-body-sm text-mute">Address:</span>
            <code className="text-link">{address}</code>
          </div>
        </div>
        <div className="badge badge-success">
          Active
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-canvas-soft-2 rounded-lg p-4">
          <p className="text-caption text-mute">Balance</p>
          <p className="mt-1 text-display-sm text-ink">{balance}</p>
          <p className="text-caption text-mute">CINA</p>
        </div>
        {tokenBalance && (
          <div className="bg-canvas-soft-2 rounded-lg p-4">
            <p className="text-caption text-mute">Token Balance</p>
            <p className="mt-1 text-display-sm text-ink">{tokenBalance}</p>
            <p className="text-caption text-mute">CINA-20</p>
          </div>
        )}
        <div className="bg-canvas-soft-2 rounded-lg p-4">
          <p className="text-caption text-mute">Transactions</p>
          <p className="mt-1 text-display-sm text-ink">{txCount.toLocaleString()}</p>
          <p className="text-caption text-mute">Total</p>
        </div>
        <div className="bg-canvas-soft-2 rounded-lg p-4">
          <p className="text-caption text-mute">First Seen</p>
          <p className="mt-1 text-display-sm text-ink">{firstSeen}</p>
          <p className="text-caption text-mute">Date</p>
        </div>
      </div>
    </div>
  );
}
