'use client';

import React, { useState } from 'react';
import { useSendCalls, useCallsStatus, useCinacoinContext } from '@cinacoin/react';

type BatchStep = {
  label: string;
  to: string;
  data: string;
  description: string;
};

/** DemoBatchTransactions — multi-step batch transaction demo via EIP-5792. */
export function DemoBatchTransactions(): JSX.Element {
  const { status, account } = useCinacoinContext();
  const { sendCalls, isSending, error, lastCallId } = useSendCalls();
  const {
    status: batchStatus,
    isPolling,
    startPolling,
    allSucceeded,
  } = useCallsStatus({ intervalMs: 2000 });

  const defaultTarget = account.address ?? '0x0000000000000000000000000000000000000000';

  const [batchSteps] = useState<BatchStep[]>([
    {
      label: 'Step 1: Approval',
      to: defaultTarget,
      data: '0x',
      description: 'Mock token approval call.',
    },
    {
      label: 'Step 2: Transfer',
      to: defaultTarget,
      data: '0x',
      description: 'Mock token transfer call.',
    },
    {
      label: 'Step 3: Swap',
      to: defaultTarget,
      data: '0x',
      description: 'Mock DEX swap call.',
    },
  ]);

  const handleExecuteBatch = async () => {
    try {
      const calls = batchSteps.map((step) => ({
        to: step.to as `0x${string}`,
        data: step.data as `0x${string}`,
        value: `0x0` as `0x${string}`,
      }));

      const batchId = await sendCalls(calls);
      startPolling(batchId);
    } catch {
      // error handled by hook
    }
  };

  if (status !== 'connected') {
    return (
      <section className="cc-card cc-fade-in" aria-labelledby="batch-heading">
        <p className="cc-eyebrow">EIP-5792.</p>
        <h3 id="batch-heading" className="cc-section-title">
          <svg className="cc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          Batch transactions.
        </h3>
        <p className="cc-section-desc">Connect a wallet to execute batch transactions.</p>
      </section>
    );
  }

  return (
    <section className="cc-card cc-fade-in" aria-labelledby="batch-heading">
      <p className="cc-eyebrow">EIP-5792.</p>
      <h3 id="batch-heading" className="cc-section-title">
        <svg className="cc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        Batch transactions.
      </h3>
      <p className="cc-section-desc">
        Execute multiple calls atomically via EIP-5792 <code className="cc-code">wallet_sendCalls</code>.
      </p>

      {/* Batch steps display */}
      <div style={{ marginBottom: 'var(--cc-space-lg)' }} role="list" aria-label="Batch transaction steps.">
        {batchSteps.map((step, i) => (
          <div
            key={i}
            role="listitem"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--cc-space-sm)',
              padding: 'var(--cc-space-sm)',
              background: 'var(--cc-surface)',
              borderRadius: 'var(--cc-radius-md)',
              marginBottom: 'var(--cc-space-xs)',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--cc-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--cc-text-xs)',
                fontWeight: 'var(--cc-weight-semibold)',
                flexShrink: 0,
                color: 'var(--cc-on-primary)',
              }}
              aria-hidden="true"
            >
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 'var(--cc-weight-semibold)', fontSize: 'var(--cc-text-sm)', color: 'var(--cc-ink)' }}>{step.label}</div>
              <div style={{ fontSize: 'var(--cc-text-xs)', color: 'var(--cc-body)' }}>{step.description}</div>
            </div>
            {batchStatus === 'CONFIRMED' && allSucceeded && (
              <svg style={{ width: '20px', height: '20px', color: 'var(--cc-success)', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-label="Step completed.">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )}
            {isPolling && (
              <span className="cc-spinner" style={{ color: 'var(--cc-warning)' }} aria-label="Processing." />
            )}
          </div>
        ))}
      </div>

      {/* Progress indicator */}
      {isPolling && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cc-space-sm)', padding: 'var(--cc-space-xs) var(--cc-space-sm)', background: 'var(--cc-warning-soft)', borderRadius: 'var(--cc-radius-md)', marginBottom: 'var(--cc-space-md)' }}>
          <span className="cc-spinner" style={{ color: 'var(--cc-warning)' }} />
          <span style={{ fontSize: 'var(--cc-text-sm)', color: 'var(--cc-body)' }}>Processing batch...</span>
        </div>
      )}

      {/* Execute button */}
      <button
        className="cc-btn cc-btn--primary"
        style={{ width: '100%' }}
        onClick={handleExecuteBatch}
        disabled={isSending || isPolling}
        aria-label="Execute all batch transaction steps."
      >
        {isSending ? 'Sending batch...' : isPolling ? 'Processing...' : 'Execute all steps.'}
      </button>

      {/* Error */}
      {error && (
        <div className="cc-error" role="alert">
          {error.message}
        </div>
      )}

      {/* Result */}
      {batchStatus === 'CONFIRMED' && allSucceeded && (
        <div className="cc-success" style={{ display: 'flex', alignItems: 'center', gap: 'var(--cc-space-xs)' }}>
          <svg style={{ width: '20px', height: '20px', color: 'var(--cc-success)', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          All {batchSteps.length} batch calls confirmed successfully.
        </div>
      )}

      {lastCallId && (
        <div style={{ marginTop: 'var(--cc-space-xs)', fontSize: 'var(--cc-text-xs)', fontFamily: 'var(--cc-font-mono)', color: 'var(--cc-muted)' }}>
          Batch ID: {lastCallId}
        </div>
      )}
    </section>
  );
}
