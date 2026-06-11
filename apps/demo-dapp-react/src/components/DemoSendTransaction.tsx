'use client';

import React, { useState, useCallback } from 'react';
import { useSendTransaction, useBalance, useCinacoinContext } from '@cinacoin/react';
import { Send } from 'lucide-react';

/** DemoSendTransaction — ETH transfer form with gas estimation and tracking. */
export function DemoSendTransaction(): JSX.Element {
  const { account, status, config } = useCinacoinContext();
  const { balance } = useBalance();
  const { sendTransaction, isPending, error, txHash } = useSendTransaction();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [gasFee, setGasFee] = useState<string | null>(null);

  const chain = config.chains?.find((c) => c.id === account.chainId);
  const explorerUrl = chain?.blockExplorerUrl;
  const symbol = account.chainSymbol ?? 'ETH';

  const estimateGas = useCallback(async () => {
    if (!recipient || !amount) return;
    try {
      const gasUnits = 21000;
      const gweiPrice = 30;
      const feeEther = (gasUnits * gweiPrice) / 1e9;
      setEstimatedGas(`${gasUnits.toLocaleString()} gas`);
      setGasFee(`~${feeEther.toFixed(6)} ${symbol}`);
    } catch {
      setEstimatedGas(null);
    }
  }, [recipient, amount, symbol]);

  const handleSend = async () => {
    setSendError(null);
    setTxStatus(null);
    setSending(true);

    try {
      const wei = BigInt(Math.floor(parseFloat(amount) * 1e18)).toString(16);
      const hash = await sendTransaction({
        to: recipient,
        value: `0x${wei}`,
      });
      setTxStatus(`Transaction submitted: ${hash.slice(0, 20)}...${hash.slice(-8)}`);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  const setMax = () => {
    if (balance) {
      setAmount(balance);
    }
  };

  const isFormValid = recipient.trim() !== '' && amount.trim() !== '';

  if (status !== 'connected') {
    return (
      <section className="cc-card cc-fade-in" aria-labelledby="send-heading">
        <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">TRANSFER</p>
        <h3 id="send-heading" className="cc-section-title">
          <Send className="w-5 h-5" /> Send Transaction
        </h3>
        <p className="cc-section-desc">Connect a wallet to send transactions.</p>
      </section>
    );
  }

  return (
    <section className="cc-card cc-fade-in" aria-labelledby="send-heading">
      <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">TRANSFER</p>
      <h3 id="send-heading" className="cc-section-title">
        <Send className="w-5 h-5" /> Send Transaction
      </h3>
      <p className="cc-section-desc">
        Send {symbol} to another address with gas estimation and status tracking.
      </p>

      {/* Recipient */}
      <div className="mb-[var(--cc-space-md)]">
        <label className="cc-label" htmlFor="recipient-input">Recipient Address</label>
        <input
          id="recipient-input"
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          className="cc-input"
          aria-required="true"
        />
      </div>

      {/* Amount */}
      <div className="mb-[var(--cc-space-md)]">
        <label className="cc-label" htmlFor="amount-input">
          Amount ({symbol})
        </label>
        <div className="flex gap-[var(--cc-space-xs)]">
          <input
            id="amount-input"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="cc-input flex-1"
            aria-required="true"
          />
          <button
            className="cc-btn cc-btn--ghost min-w-[var(--cc-touch-target)]"
            onClick={setMax}
            title="Set maximum balance"
            aria-label="Set maximum balance"
          >
            MAX
          </button>
        </div>
        {balance && (
          <p className="text-[var(--cc-text-xs)] text-[var(--cc-muted)] mt-[var(--cc-space-xxs)]">
            Available: {balance} {symbol}
          </p>
        )}
      </div>

      {/* Gas estimation */}
      <div className="mb-[var(--cc-space-md)]">
        <button
          className="cc-btn cc-btn--ghost"
          onClick={estimateGas}
          disabled={!isFormValid}
          aria-label="Estimate gas fees"
        >
          Estimate Gas
        </button>
        {estimatedGas && (
          <p className="mt-[var(--cc-space-xs)] text-[var(--cc-text-sm)] text-[var(--cc-body)]" aria-live="polite">
            Gas: {estimatedGas} {gasFee && ` · Fee: ${gasFee}`}
          </p>
        )}
      </div>

      {/* Send button */}
      <button
        className="cc-btn cc-btn--primary w-full"
        onClick={handleSend}
        disabled={isPending || sending || !isFormValid}
        aria-label={`Send ${amount} ${symbol} to ${recipient}`}
      >
        {sending ? (
          <span className="flex items-center gap-[var(--cc-space-xs)]">
            <span className="cc-spinner" /> Sending...
          </span>
        ) : (
          `Send ${symbol}`
        )}
      </button>

      {/* Error */}
      {(error || sendError) && (
        <div className="cc-error" role="alert">
          {sendError ?? error?.message}
        </div>
      )}

      {/* Transaction status */}
      {txHash && (
        <div className="mt-[var(--cc-space-md)] p-[var(--cc-space-sm)] bg-[var(--cc-success-soft)] border border-[var(--cc-success-border)] rounded-[var(--cc-radius-md)]">
          <div className="text-[var(--cc-text-sm)] text-[var(--cc-success)] mb-[var(--cc-space-xs)]">
            {txStatus}
          </div>
          <div className="text-[var(--cc-text-xs)] font-mono break-all text-[var(--cc-body)]">
            {txHash}
          </div>
          {explorerUrl && (
            <a
              href={`${explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex mt-[var(--cc-space-xs)] text-[var(--cc-text-sm)] text-[var(--cc-accent-soft)] no-underline"
            >
              View on Explorer <span aria-hidden="true">→</span>
            </a>
          )}
        </div>
      )}
    </section>
  );
}
