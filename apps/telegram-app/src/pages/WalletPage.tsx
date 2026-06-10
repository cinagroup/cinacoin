import { useState, useCallback } from 'react';
import type { TelegramProvider } from '@cinacoin/telegram-miniapp';
import '../styles/pages.css';

interface WalletPageProps {
  provider: TelegramProvider;
  account: string | null;
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  onBalanceUpdate: (balance: string) => void;
}

export default function WalletPage({
  provider,
  account,
  onConnect,
  onDisconnect,
  onBalanceUpdate,
}: WalletPageProps) {
  const [connecting, setConnecting] = useState(false);
  const [fetchingBalance, setFetchingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    setError(null);

    try {
      // Simulate wallet connection via Telegram
      // In production, this would use the Telegram Wallet API or a connected dApp bridge
      provider.triggerHaptic('medium');

      // Generate a demo address from Telegram user ID
      const userId = provider.getUserId();
      if (!userId) {
        throw new Error('No Telegram user found. Please open this app from Telegram.');
      }

      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const demoAddress = `0x${userId.toString(16).padStart(40, '0')}`;
      onConnect(demoAddress);
      provider.triggerHaptic('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
      provider.triggerHaptic('error');
    } finally {
      setConnecting(false);
    }
  }, [provider, onConnect]);

  const handleFetchBalance = useCallback(async () => {
    if (!account) return;

    setFetchingBalance(true);
    setError(null);

    try {
      provider.triggerHaptic('light');

      // Simulate RPC balance fetch
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Demo balance
      const demoBalance = (Math.random() * 10).toFixed(4);
      onBalanceUpdate(demoBalance);
      provider.triggerHaptic('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(message);
      provider.triggerHaptic('error');
    } finally {
      setFetchingBalance(false);
    }
  }, [account, provider, onBalanceUpdate]);

  const handleDisconnect = useCallback(() => {
    provider.triggerHaptic('warning');
    onDisconnect();
  }, [provider, onDisconnect]);

  const handleCopyAddress = useCallback(() => {
    if (!account) return;
    navigator.clipboard.writeText(account).then(() => {
      provider.triggerHaptic('success');
    }).catch(() => {
      // Fallback
      provider.showAlert(`Address: ${account}`);
    });
  }, [account, provider]);

  return (
    <div className="page wallet-page">
      <h1 className="page-title">Wallet</h1>

      {!account ? (
        <div className="connect-section">
          <div className="connect-icon">💳</div>
          <h2>Connect Your Wallet</h2>
          <p className="connect-description">
            Link your wallet to send, receive, and manage your tokens directly within Telegram.
          </p>

          {error && <div className="error-message">{error}</div>}

          <button
            className="cc-btn-primary btn-large"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? (
              <>
                <span className="btn-spinner" />
                Connecting...
              </>
            ) : (
              'Connect Wallet'
            )}
          </button>

          <div className="wallet-options">
            <div className="wallet-option">
              <span className="wallet-option-icon">🔵</span>
              <span>Telegram Wallet</span>
            </div>
            <div className="wallet-option">
              <span className="wallet-option-icon">🦊</span>
              <span>MetaMask</span>
            </div>
            <div className="wallet-option">
              <span className="wallet-option-icon">🔗</span>
              <span>WalletConnect</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="wallet-connected">
          <div className="wallet-status-card">
            <div className="status-indicator connected" />
            <div className="wallet-info">
              <span className="wallet-label">Connected</span>
              <span className="wallet-address" title={account}>
                {account.slice(0, 10)}...{account.slice(-8)}
              </span>
            </div>
          </div>

          <div className="wallet-actions">
            <button className="cc-btn-secondary" onClick={handleCopyAddress}>
              📋 Copy Address
            </button>
            <button
              className="cc-btn-secondary"
              onClick={handleFetchBalance}
              disabled={fetchingBalance}
            >
              {fetchingBalance ? '⟳ Fetching...' : '↻ Refresh Balance'}
            </button>
            <button className="cc-btn-danger" onClick={handleDisconnect}>
              Disconnect
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="chain-info">
            <h3>Network</h3>
            <div className="chain-badge">
              <span className="chain-dot" />
              Ethereum Mainnet (Chain ID: {provider.getChainId()})
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
