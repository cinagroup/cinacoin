'use client';

import React, { useState, useCallback } from 'react';
import { useSendTransaction, useBalance, useCinaCoinContext } from '@cinacoin/react';

/** DemoSendTransaction — ETH transfer form with gas estimation and tracking. */
export function DemoSendTransaction(): JSX.Element {
  const { account, status, config } = useCinaCoinContext();
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
      // Rough estimate: ~21000 gas for simple transfer
      const gasUnits = 21000;
      // Assume ~30 gwei for estimation
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
      // Convert ETH amount to wei hex
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

  if (status !== 'connected') {
    return (
      <section style={sectionStyle}>
        <h3 style={titleStyle}>
          <span style={iconStyle}>📤</span> Send Transaction
        </h3>
        <p style={descStyle}>Connect a wallet to send transactions.</p>
      </section>
    );
  }

  return (
    <section style={sectionStyle}>
      <h3 style={titleStyle}>
        <span style={iconStyle}>📤</span> Send Transaction
      </h3>
      <p style={descStyle}>
        Send {symbol} to another address with gas estimation and status tracking.
      </p>

      {/* Recipient */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Recipient Address</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          style={inputStyle}
        />
      </div>

      {/* Amount */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>
          Amount ({symbol})
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button style={maxBtnStyle} onClick={setMax} title="Set max">
            MAX
          </button>
        </div>
        {balance && (
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Available: {balance} {symbol}
          </div>
        )}
      </div>

      {/* Gas estimation */}
      <div style={{ marginBottom: '16px' }}>
        <button style={estimateBtnStyle} onClick={estimateGas} disabled={!recipient || !amount}>
          Estimate Gas
        </button>
        {estimatedGas && (
          <div style={{ marginTop: '8px', fontSize: '13px', color: '#94a3b8' }}>
            Gas: {estimatedGas} {gasFee && ` · Fee: ${gasFee}`}
          </div>
        )}
      </div>

      {/* Send button */}
      <button
        style={{
          ...sendBtnStyle,
          opacity: isPending || sending ? 0.7 : 1,
        }}
        onClick={handleSend}
        disabled={isPending || sending || !recipient || !amount}
      >
        {sending ? '⏳ Sending...' : `Send ${symbol}`}
      </button>

      {/* Error */}
      {(error || sendError) && (
        <div style={errorStyle}>
          {sendError ?? error?.message}
        </div>
      )}

      {/* Transaction status */}
      {txHash && (
        <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px' }}>
          <div style={{ fontSize: '13px', color: '#34d399', marginBottom: '6px' }}>
            {txStatus}
          </div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all', color: '#94a3b8' }}>
            {txHash}
          </div>
          {explorerUrl && (
            <a
              href={`${explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', marginTop: '8px', fontSize: '13px', color: '#818cf8', textDecoration: 'none' }}
            >
              View on Explorer →
            </a>
          )}
        </div>
      )}
    </section>
  );
}

const sectionStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  padding: '24px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  margin: '0 0 8px 0',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const iconStyle: React.CSSProperties = { fontSize: '20px' };

const descStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#94a3b8',
  margin: '0 0 20px 0',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#818cf8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  display: 'block',
  marginBottom: '8px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '10px 14px',
  color: '#e0e0e0',
  fontSize: '14px',
  fontFamily: 'monospace',
  boxSizing: 'border-box',
};

const maxBtnStyle: React.CSSProperties = {
  background: 'rgba(99,102,241,0.15)',
  color: '#818cf8',
  border: '1px solid rgba(99,102,241,0.3)',
  borderRadius: '8px',
  padding: '8px 14px',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer',
};

const estimateBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  color: '#94a3b8',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '13px',
  cursor: 'pointer',
};

const sendBtnStyle: React.CSSProperties = {
  width: '100%',
  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  padding: '14px',
  fontSize: '15px',
  fontWeight: 700,
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  marginTop: '12px',
  padding: '10px 14px',
  background: 'rgba(239,68,68,0.1)',
  border: '1px solid rgba(239,68,68,0.3)',
  borderRadius: '8px',
  color: '#f87171',
  fontSize: '13px',
};
