'use client';

import React, { useState } from 'react';
import { useSignMessage, useCinaCoinContext } from '@cinacoin/react';

/** DemoSignMessage — sign arbitrary messages with the connected wallet. */
export function DemoSignMessage(): JSX.Element {
  const { account, status } = useCinaCoinContext();
  const { signMessage, isPending, error, signature } = useSignMessage();

  const [message, setMessage] = useState('Welcome to Cinacoin!');
  const [sigResult, setSigResult] = useState<string | null>(null);
  const [sigError, setSigError] = useState<string | null>(null);

  const handleSign = async () => {
    if (!message.trim()) return;
    setSigError(null);
    setSigResult(null);

    try {
      const sig = await signMessage(message);
      setSigResult(sig);
    } catch (err) {
      setSigError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleCopy = async () => {
    if (sigResult) {
      await navigator.clipboard.writeText(sigResult);
    }
  };

  const isValidSignature = sigResult && /^0x[0-9a-fA-F]{130}$/.test(sigResult);

  if (status !== 'connected') {
    return (
      <section style={sectionStyle}>
        <h3 style={titleStyle}>
          <span style={iconStyle}>✍️</span> Sign Message
        </h3>
        <p style={descStyle}>Connect a wallet to sign messages.</p>
      </section>
    );
  }

  return (
    <section style={sectionStyle}>
      <h3 style={titleStyle}>
        <span style={iconStyle}>✍️</span> Sign Message
      </h3>
      <p style={descStyle}>
        Sign arbitrary messages with your wallet using personal_sign.
      </p>

      {/* Message input */}
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Message to Sign</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={textareaStyle}
          rows={3}
          placeholder="Enter message to sign..."
        />
      </div>

      {/* Sign button */}
      <button
        style={{
          ...btnStyle,
          background: isPending ? '#4f46e5' : '#6366f1',
          opacity: isPending ? 0.7 : 1,
        }}
        onClick={handleSign}
        disabled={isPending || !message.trim()}
      >
        {isPending ? '⏳ Signing...' : 'Sign Message'}
      </button>

      {/* Error display */}
      {(error || sigError) && (
        <div style={errorStyle}>
          {sigError ?? error?.message}
        </div>
      )}

      {/* Signature result */}
      {sigResult && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={labelStyle}>Signature</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isValidSignature && (
                <span style={{ fontSize: '11px', color: '#34d399' }}>✓ Valid format</span>
              )}
              <button style={smallBtnStyle} onClick={handleCopy}>
                Copy
              </button>
            </div>
          </div>
          <div style={sigDisplayStyle}>
            {sigResult.slice(0, 66)}
            <br />
            ...
            <br />
            {sigResult.slice(-20)}
          </div>
        </div>
      )}

      {/* Info */}
      <div style={{ marginTop: '16px', fontSize: '12px', color: '#64748b' }}>
        Uses <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>personal_sign</code> — the wallet will prompt for user confirmation.
      </div>
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

const textareaStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  padding: '12px',
  color: '#e0e0e0',
  fontSize: '14px',
  fontFamily: 'inherit',
  resize: 'vertical',
  boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 24px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
};

const smallBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  color: '#94a3b8',
  border: 'none',
  borderRadius: '6px',
  padding: '4px 10px',
  fontSize: '11px',
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

const sigDisplayStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  padding: '14px',
  fontFamily: 'monospace',
  fontSize: '12px',
  wordBreak: 'break-all',
  lineHeight: 1.6,
  color: '#34d399',
};
