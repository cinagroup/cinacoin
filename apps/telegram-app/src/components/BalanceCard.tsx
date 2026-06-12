interface BalanceCardProps {
  balance: string;
  address?: string | null;
  currency?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

export default function BalanceCard({
  balance,
  address,
  currency = 'ETH',
  onRefresh,
  loading = false,
}: BalanceCardProps) {
  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <div className="balance-card" role="region" aria-label="Balance information">
      <div className="balance-card-inner">
        <div className="balance-label">Total balance</div>
        <div className="balance-amount">
          {loading ? (
            <span className="balance-loading">···</span>
          ) : (
            <>
              <span className="balance-value">{balance}</span>
              <span className="balance-currency">{currency}</span>
            </>
          )}
        </div>
        {shortAddress && (
          <div className="balance-address">{shortAddress}</div>
        )}
        {onRefresh && (
          <button className="balance-refresh" onClick={onRefresh} disabled={loading}>
            {loading ? '⟳' : '↻'} Refresh
          </button>
        )}
      </div>
    </div>
  );
}
