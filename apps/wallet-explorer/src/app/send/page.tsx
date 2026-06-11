'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { isValidAddress, isValidAmount } from '@/lib/utils';
import { NETWORK_FEE_NUMBER, TOAST_DURATION } from '@/lib/constants';

export default function SendPage() {
  const { connected, address, balance, connect } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<{ recipient?: string; amount?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { recipient?: string; amount?: string } = {};

    if (!recipient) {
      newErrors.recipient = 'Recipient address is required';
    } else if (!isValidAddress(recipient)) {
      newErrors.recipient = 'Invalid Ethereum address format';
    }

    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (!isValidAmount(amount)) {
      newErrors.amount = 'Invalid amount';
    } else if (parseFloat(amount) + NETWORK_FEE_NUMBER > parseFloat(balance.replace(/,/g, ''))) {
      newErrors.amount = 'Insufficient balance';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSending(true);
    // TODO: 集成真实交易发送
    await new Promise((r) => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), TOAST_DURATION);
    setRecipient('');
    setAmount('');
    setErrors({});
  };

  if (!connected) {
    return (
      <div className="cc-card text-center py-12">
        <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">SEND</p>
        <h2 className="text-heading-2 text-ink">Send CINA</h2>
        <p className="mt-2 text-body text-mute">Connect your wallet to send tokens.</p>
        <button onClick={connect} className="cc-btn-primary mt-6">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">SEND</p>
        <h1 className="text-heading-2 text-ink">Send CINA</h1>
        <p className="mt-1 text-body text-mute">Transfer tokens to another address.</p>
      </div>

      <div className="cc-card">
        <div className="mb-6 flex items-center justify-between rounded-lg bg-canvas-soft-2 p-4">
          <div>
            <p className="text-caption text-mute">Available Balance</p>
            <p className="mt-1 text-display-sm text-ink">{balance} CINA</p>
          </div>
          <code className="text-caption-mono text-mute" title={address || ''}>
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
          </code>
        </div>

        {sent && (
          <div className="mb-6 rounded-lg bg-success-light p-4 text-body-sm" role="alert" style={{ color: 'var(--color-success)' }}>
            ✓ Transaction submitted successfully!
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-5" noValidate>
          <div>
            <label htmlFor="recipient" className="block text-caption text-mute mb-2">
              Recipient Address
            </label>
            <input
              id="recipient"
              type="text"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                if (errors.recipient) setErrors({ ...errors, recipient: undefined });
              }}
              placeholder="0x..."
              className={`search-bar ${errors.recipient ? 'border-error' : ''}`}
              aria-invalid={!!errors.recipient}
              aria-describedby={errors.recipient ? 'recipient-error' : undefined}
              required
            />
            {errors.recipient && (
              <p id="recipient-error" className="mt-1 text-caption text-error" role="alert">
                {errors.recipient}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="amount" className="block text-caption text-mute mb-2">
              Amount
            </label>
            <div className="relative">
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors({ ...errors, amount: undefined });
                }}
                placeholder="0.00"
                className={`search-bar pr-16 ${errors.amount ? 'border-error' : ''}`}
                step="0.01"
                min="0"
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? 'amount-error' : undefined}
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-body-sm text-mute">
                CINA
              </span>
            </div>
            {errors.amount && (
              <p id="amount-error" className="mt-1 text-caption text-error" role="alert">
                {errors.amount}
              </p>
            )}
          </div>

          <div className="rounded-lg bg-canvas-soft-2 p-4 space-y-2">
            <div className="flex justify-between text-body-sm">
              <span className="text-mute">Network Fee (est.)</span>
              <span className="text-ink font-[var(--font-mono)]">~{NETWORK_FEE_NUMBER} CINA</span>
            </div>
            <div className="flex justify-between text-body-sm">
              <span className="text-mute">Total</span>
              <span className="text-ink font-medium font-[var(--font-mono)]">
                {amount && isValidAmount(amount)
                  ? `${(parseFloat(amount) + NETWORK_FEE_NUMBER).toFixed(4)}`
                  : '0.00'}{' '}
                CINA
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={sending || !recipient || !amount}
            className="cc-btn-primary w-full py-3"
            aria-busy={sending}
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
