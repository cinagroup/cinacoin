'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';

export default function SendPage() {
  const { connected, address, balance, connect } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;
    setSending(true);
    // TODO: 集成真实交易发送
    await new Promise((r) => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setRecipient('');
    setAmount('');
  };

  if (!connected) {
    return (
      <div className="card text-center py-12">
        <h2 className="text-heading-2 text-ink">Send CINA</h2>
        <p className="mt-2 text-body text-mute">Connect your wallet to send tokens.</p>
        <button onClick={connect} className="btn btn-primary mt-6">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-2 text-ink">Send CINA</h1>
        <p className="mt-1 text-body text-mute">Transfer tokens to another address.</p>
      </div>

      <div className="card">
        <div className="mb-6 flex items-center justify-between rounded-lg bg-canvas-soft-2 p-4">
          <div>
            <p className="text-caption text-mute">Available Balance</p>
            <p className="mt-1 text-display-sm text-ink">{balance} CINA</p>
          </div>
          <code className="text-caption-mono text-mute">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </code>
        </div>

        {sent && (
          <div className="mb-6 rounded-lg bg-success-light p-4 text-body-sm" style={{ color: 'var(--color-success)' }}>
            ✓ Transaction submitted successfully!
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-5">
          <div>
            <label className="block text-caption text-mute mb-2">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
              className="search-bar"
              required
            />
          </div>

          <div>
            <label className="block text-caption text-mute mb-2">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="search-bar pr-16"
                step="0.01"
                min="0"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-body-sm text-mute">
                CINA
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-canvas-soft-2 p-4 space-y-2">
            <div className="flex justify-between text-body-sm">
              <span className="text-mute">Network Fee (est.)</span>
              <span className="text-ink font-[var(--font-mono)]">~0.0021 CINA</span>
            </div>
            <div className="flex justify-between text-body-sm">
              <span className="text-mute">Total</span>
              <span className="text-ink font-medium font-[var(--font-mono)]">
                {amount ? `${(parseFloat(amount) + 0.0021).toFixed(4)}` : '0.00'} CINA
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={sending || !recipient || !amount}
            className="btn btn-primary w-full py-3"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
