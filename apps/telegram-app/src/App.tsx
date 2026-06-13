import { TelegramProvider } from '@cinacoin/telegram-miniapp';
import type { TelegramUser } from '@cinacoin/telegram-miniapp';
import { Home, CreditCard, ArrowRightLeft, Pencil } from 'lucide-react';
import { useState, useEffect, useCallback, type ReactNode } from 'react';

import TelegramHeader from './components/TelegramHeader';
import HomePage from './pages/HomePage';
import SignPage from './pages/SignPage';
import TransferPage from './pages/TransferPage';
import WalletPage from './pages/WalletPage';
import './styles/App.css';

type TabId = 'home' | 'wallet' | 'transfer' | 'sign';

interface TabConfig {
  id: TabId;
  label: string;
  icon: ReactNode;
}

const TABS: TabConfig[] = [
  { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
  { id: 'wallet', label: 'Wallet', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'transfer', label: 'Transfer', icon: <ArrowRightLeft className="w-5 h-5" /> },
  { id: 'sign', label: 'Sign', icon: <Pencil className="w-5 h-5" /> },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [provider] = useState(() => new TelegramProvider({ appName: 'CinaCoin Mini App' }));
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
    void init();
  }, [provider]);

  const handleConnect = useCallback(
    (addr: string) => {
      setAccount(addr);
      provider.connect(addr as `0x${string}`);
    },
    [provider]
  );

  const handleDisconnect = useCallback(() => {
    setAccount(null);
    setBalance('0.00');
    provider.disconnect();
  }, [provider]);

  const handleBalanceUpdate = useCallback((bal: string) => {
    setBalance(bal);
  }, []);

  const handleTabChange = useCallback(
    (tab: TabId) => {
      setActiveTab(tab);
      provider.triggerHaptic('light');
    },
    [provider]
  );

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomePage user={user} account={account} balance={balance} onNavigate={handleTabChange} />
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
        return <TransferPage provider={provider} account={account} balance={balance} />;
      case 'sign':
        return <SignPage provider={provider} account={account} />;
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
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <TelegramHeader user={user} account={account} />
      <main
        className="app-content"
        role="tabpanel"
        id="main-content"
        aria-labelledby={activeTab}
      >
        {renderPage()}
      </main>
      <nav className="tab-bar" role="tablist" aria-label="Main navigation">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            id={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
          >
            <span className="tab-icon" aria-hidden="true">
              {tab.icon}
            </span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
