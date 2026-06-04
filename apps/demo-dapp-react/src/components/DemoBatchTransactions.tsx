'use client';

import React, { useState } from 'react';
import { useSendCalls, useCallsStatus, useCinaCoinContext } from '@cinacoin/react';

type BatchStep = {
  label: string;
  to: string;
  data: string;
  description: string;
};

/** DemoBatchTransactions — multi-step batch transaction demo via EIP-5792. */
export function DemoBatchTransactions(): JSX.Element {
  const { status, account } = useCinaCoinContext();
  const { sendCalls, isSending, error, lastCallId } = useSendCalls();
  const {
    status: batchStatus,
    isPolling,
    startPolling,
    stopPolling,
    allSucceeded,
  } = useCallsStatus({ intervalMs: 2000 });

  const [batchSteps, setBatchSteps] = useState<BatchStep[]>([
    {
      label: 'Step 1: Approval',
      to: account.address ?? '0x0000000000000000000000000000000000000000',
      data: '0x',
      description: 'Mock token approval call',
    },
    {
      label: 'Step 2: Transfer',
      to: account.address ?? '0x0000000000000000000000000000000000000000',
      data: '0x',
      description: 'Mock token transfer call',
    },
    {
      label: 'Step 3: Swap',
      to: account.address ?? '0x0000000000000000000000000000000000000000',
      data: '0x',
      description: 'Mock DEX swap call',
    },
  ]);

  const [executed, setExecuted] = useState(false);

  const handleExecuteBatch = async () => {
    setExecuted(false);
    try {
      const calls = batchSteps.map((step) => ({
        to: step.to as `0x${string}`,
        data: step.data as `0x${string}`,
        value: '0x0',
      }));

      const batchId = await sendCalls(calls);
      startPolling(batchId);
    } catch {
      // error handled by hook
    }
  };

  if (status !== 'connected') {
    return (
      <section style={sectionStyle}>
        <h3 style={titleStyle}>
          <span style={iconStyle}>📦</span> Batch Transactions
        </h3>
        <p style={descStyle}>Connect a wallet to execute batch transactions.</p>
      </section>
    );
  }

  return (
    <section style={sectionStyle}>
      <h3 style={titleStyle}>
        <span style={iconStyle}>📦</span> Batch Transactions
      </h3>
      <p style={descStyle}>
        Execute multiple calls atomically via EIP-5792 <code style={codeStyle}>wallet_sendCalls</code>.
      </p>

      {/* Batch steps display */}
      <div style={{ marginBottom: '20px' }}>
        {batchSteps.map((step, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{step.label}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{step.description}</div>
            </div>
            {batchStatus === 'CONFIRMED' && allSucceeded && (
              <span style={{ fontSize: '18px' }}>✅</span>
            )}
            {isPolling && (
              <span style={{ fontSize: '14px' }}>⏳</span>
            )}
          </div>
        ))}
      </div>

      {/* Progress indicator */}
      {isPolling && (
        <div style={progressStyle}>
          <div style={progressBarStyle} />
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Processing batch...</span>
        </div>
      )}

      {/* Execute button */}
      <button
        style={{
          ...btnStyle,
          opacity: isSending || isPolling ? 0.6 : 1,
        }}
        onClick={handleExecuteBatch}
        disabled={isSending || isPolling}
      >
        {isSending ? '⏳ Sending Batch...' : isPolling ? '⏳ Processing...' : 'Execute All Steps'}
      </button>

      {/* Error */}
      {error && (
        <div style={errorStyle}>{error.message}</div>
      )}

      {/* Result */}
      {batchStatus === 'CONFIRMED' && allSucceeded && (
        <div style={successStyle}>
          ✅ All {batchSteps.length} batch calls confirmed successfully!
        </div>
      )}

      {lastCallId && (
        <div style={{ marginTop: '8px', fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>
          Batch ID: {lastCallId}
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

const codeStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '12px',
};

const progressStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 14px',
  background: 'rgba(250,204,21,0.08)',
  borderRadius: '8px',
  marginBottom: '16px',
};

const progressBarStyle: React.CSSProperties = {
  width: '60px',
  height: '4px',
  background: 'rgba(250,204,21,0.3)',
  borderRadius: '2px',
  overflow: 'hidden',
  position: 'relative',
};

const btnStyle: React.CSSProperties = {
  width: '100%',
  background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
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

const successStyle: React.CSSProperties = {
  marginTop: '12px',
  padding: '14px',
  background: 'rgba(52,211,153,0.08)',
  border: '1px solid rgba(52,211,153,0.2)',
  borderRadius: '8px',
  color: '#34d399',
  fontSize: '14px',
  fontWeight: 600,
};
