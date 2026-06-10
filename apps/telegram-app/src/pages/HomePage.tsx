import type { TelegramUser } from '@cinacoin/telegram-miniapp';
import BalanceCard from '../components/BalanceCard';
import QuickActions from '../components/QuickActions';
import TransactionItem from '../components/TransactionItem';
import type { Transaction } from '../components/TransactionItem';
import '../styles/pages.css';

interface HomePageProps {
  user: TelegramUser | null;
  account: string | null;
  balance: string;
  onNavigate: (tab: 'home' | 'wallet' | 'transfer' | 'sign') => void;
}

// Demo transactions for display
const DEMO_TRANSACTIONS: Transaction[] = [
  {
    hash: '0xabc123def456789012345678901234567890abcdef1234567890abcdef123456',
    from: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
    to: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    value: '0.05',
    timestamp: Date.now() - 3600000,
    status: 'confirmed',
    type: 'receive',
  },
  {
    hash: '0xdef456789012345678901234567890abcdef1234567890abcdef123456789012',
    from: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    to: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
    value: '0.02',
    timestamp: Date.now() - 86400000,
    status: 'confirmed',
    type: 'send',
  },
  {
    hash: '0x789012345678901234567890abcdef1234567890abcdef12345678901234abcd',
    from: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
    to: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    value: '0.10',
    timestamp: Date.now() - 172800000,
    status: 'confirmed',
    type: 'swap',
  },
];

export default function HomePage({ user, account, balance, onNavigate }: HomePageProps) {
  const displayName = user
    ? user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.first_name
    : 'Welcome';

  return (
    <div className="page home-page">
      <div className="page-greeting">
        <h1>Hello, {displayName} 👋</h1>
        <p className="greeting-subtitle">Your Cinacoin dashboard</p>
      </div>

      <BalanceCard
        balance={balance}
        address={account}
        currency="ETH"
      />

      <QuickActions
        onSend={() => onNavigate('transfer')}
        onReceive={() => onNavigate('wallet')}
        onSwap={() => onNavigate('transfer')}
        disabled={!account}
      />

      <section className="section">
        <h2 className="section-title">Recent Activity</h2>
        {account ? (
          <div className="transaction-list">
            {DEMO_TRANSACTIONS.map((tx) => (
              <TransactionItem
                key={tx.hash}
                transaction={tx}
                currentAddress={account}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Connect your wallet to see transactions</p>
            <button className="cc-btn-primary" onClick={() => onNavigate('wallet')}>
              Connect Wallet
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
