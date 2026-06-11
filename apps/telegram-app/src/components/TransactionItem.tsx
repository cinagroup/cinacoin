import { Send, Download, RefreshCw, Check, Loader2, X } from 'lucide-react';

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'send' | 'receive' | 'swap';
}

interface TransactionItemProps {
  transaction: Transaction;
  currentAddress?: string;
}

export default function TransactionItem({ transaction, currentAddress }: TransactionItemProps) {
  const { hash, from, to, value, timestamp, status, type } = transaction;

  const isIncoming = type === 'receive' || (to.toLowerCase() === currentAddress?.toLowerCase());
  const shortHash = `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const timeAgo = getTimeAgo(timestamp);

  const StatusIcon = status === 'confirmed' ? Check : status === 'pending' ? Loader2 : X;
  const TypeIcon = type === 'send' ? Send : type === 'receive' ? Download : RefreshCw;

  return (
    <div className={`transaction-item transaction-${status}`}>
      <div className="tx-icon">
        <TypeIcon className="w-5 h-5" />
      </div>
      <div className="tx-details">
        <div className="tx-top">
          <span className="tx-type">
            {isIncoming ? 'Received' : 'Sent'}
          </span>
          <span className={`tx-value ${isIncoming ? 'positive' : 'negative'}`}>
            {isIncoming ? '+' : '-'}{value} ETH
          </span>
        </div>
        <div className="tx-bottom">
          <span className="tx-hash" title={hash}>
            {shortHash}
          </span>
          <span className="tx-meta">
            <StatusIcon className="w-4 h-4 inline-block mr-1" />{timeAgo}
          </span>
        </div>
        <div className="tx-address">
          {isIncoming ? `From: ${shortAddr(from)}` : `To: ${shortAddr(to)}`}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
