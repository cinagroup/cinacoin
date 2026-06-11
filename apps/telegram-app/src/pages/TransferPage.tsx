import { useState, useCallback } from 'react';
import type { TelegramProvider } from '@cinacoin/telegram-miniapp';
import '../styles/pages.css';

interface TransferPageProps {
  provider: TelegramProvider;
  account: string | null;
  balance: string;
}

export default function TransferPage({ provider, account, balance }: TransferPageProps) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = useCallback(async () => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    if (!to || !amount) {
      setError('Please fill in all fields');
      provider.triggerHaptic('error');
      return;
    }

    if (parseFloat(amount) > parseFloat(balance)) {
      setError('Insufficient balance');
      provider.triggerHaptic('error');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      provider.triggerHaptic('medium');

      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const txHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
      setSuccess(`Transaction sent! Hash: ${txHash.slice(0, 20)}...`);
      provider.triggerHaptic('success');

      // Clear form
      setTo('');
      setAmount('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      setError(message);
      provider.triggerHaptic('error');
    } finally {
      setSending(false);
    }
  }, [account, to, amount, balance, provider]);

  const handleMaxAmount = useCallback(() => {
    setAmount(balance);
    provider.triggerHaptic('light');
  }, [balance, provider]);

  if (!account) {
    return (
      <div className="page transfer-page">
        <h1 className="page-title">Transfer</h1>
        <div className="empty-state">
          <p>Connect your wallet to send tokens</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page transfer-page">
      <h1 className="page-title">Transfer</h1>

      <div className="transfer-form">
        <div className="form-group">
          <label className="form-label">From</label>
          <div className="form-value">
            {account.slice(0, 10)}...{account.slice(-8)}
          </div>
          <div className="form-hint">Balance: {balance} ETH</div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="transfer-to">To</label>
          <input
            id="transfer-to"
            type="text"
            className="form-input"
            placeholder="0x... or username"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={sending}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="transfer-amount">Amount</label>
          <div className="input-with-button">
            <input
              id="transfer-amount"
              type="number"
              className="form-input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={sending}
              step="0.0001"
              min="0"
            />
            <button className="cc-btn-secondary-sm" onClick={handleMaxAmount} disabled={sending}>
              MAX
            </button>
          </div>
          <div className="form-hint">Available: {balance} ETH</div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button
          className="cc-btn-primary btn-large"
          onClick={handleSend}
          disabled={sending || !to || !amount}
        >
          {sending ? (
            <>
              <span className="btn-spinner" />
              Sending...
            </>
          ) : (
            'Send Tokens'
          )}
        </button>
      </div>
    </div>
  );
}
