import { useState, useEffect, useCallback } from 'react';
import { TelegramProvider } from '@cinacoin/telegram-miniapp';
import type { TelegramUser } from '@cinacoin/telegram-miniapp';
import TelegramHeader from './components/TelegramHeader';
import HomePage from './pages/HomePage';
import WalletPage from './pages/WalletPage';
import TransferPage from './pages/TransferPage';
import SignPage from './pages/SignPage';
import './styles/App.css';

type TabId = 'home' | 'wallet' | 'transfer' | 'sign';

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'wallet', label: 'Wallet', icon: '💳' },
  { id: 'transfer', label: 'Transfer', icon: '💸' },
  { id: 'sign', label: 'Sign', icon: '✍️' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [provider] = useState(() => new TelegramProvider({ appName: 'Cinacoin Mini App' }));
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0.00');

  useEffect(() => {
    const init = async () => {
      const initialized = await provider.initialize();
      if (initialized) {
        setUser(provider.getUser() ?? null);
        setIsReady(true);
      } else {
        // Fallback for development outside Telegram
        setIsReady(true);
      }
    };
    init();
  }, [provider]);

  const handleConnect = useCallback((addr: string) => {
    setAccount(addr);
    provider.connect(addr as `0x${string}`);
  }, [provider]);

  const handleDisconnect = useCallback(() => {
    setAccount(null);
    setBalance('0.00');
    provider.disconnect();
  }, [provider]);

  const handleBalanceUpdate = useCallback((bal: string) => {
    setBalance(bal);
  }, []);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    provider.triggerHaptic('light');
  }, [provider]);

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage
            user={user}
            account={account}
            balance={balance}
            onNavigate={handleTabChange}
          />
        );
      case 'wallet':
        return (
          <WalletPage
            provider={provider}
            account={account}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onBalanceUpdate={handleBalanceUpdate}
          />
        );
      case 'transfer':
        return (
          <TransferPage
            provider={provider}
            account={account}
            balance={balance}
          />
        );
      case 'sign':
        return (
          <SignPage
            provider={provider}
            account={account}
          />
        );
      default:
        return null;
    }
  };

  if (!isReady) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <TelegramHeader user={user} account={account} />
      <main className="app-content">
        {renderPage()}
      </main>
      <nav className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
