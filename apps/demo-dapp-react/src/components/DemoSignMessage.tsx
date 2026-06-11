'use client';

import React, { useState } from 'react';
import { useSignMessage, useCinacoinContext } from '@cinacoin/react';

/** DemoSignMessage — sign arbitrary messages with the connected wallet. */
export function DemoSignMessage(): JSX.Element {
  const { account, status } = useCinacoinContext();
  const { signMessage, isPending, error, signature } = useSignMessage();

  const [message, setMessage] = useState('Welcome to CinaCoin.');
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
      try {
        await navigator.clipboard.writeText(sigResult);
      } catch {
        // Clipboard access may fail in some contexts
      }
    }
  };

  const isValidSignature = sigResult && /^0x[0-9a-fA-F]{130}$/.test(sigResult);

  if (status !== 'connected') {
    return (
      <section className="cc-card cc-fade-in" aria-labelledby="sign-heading">
        <h3 id="sign-heading" className="cc-section-title">
          <span style={{ fontSize: 'var(--cc-text-lg)' }} aria-hidden="true">✍️</span> Sign message.
        </h3>
        <p className="cc-section-desc">Connect a wallet to sign messages.</p>
      </section>
    );
  }

  return (
    <section className="cc-card cc-fade-in" aria-labelledby="sign-heading">
      <h3 id="sign-heading" className="cc-section-title">
        <span style={{ fontSize: 'var(--cc-text-lg)' }} aria-hidden="true">✍️</span> Sign message.
      </h3>
      <p className="cc-section-desc">
        Sign arbitrary messages with your wallet using personal_sign.
      </p>

      {/* Message input */}
      <div style={{ marginBottom: 'var(--cc-space-md)' }}>
        <label className="cc-label" htmlFor="sign-message-input">Message to sign.</label>
        <textarea
          id="sign-message-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="cc-input cc-textarea"
          rows={3}
          placeholder="Enter message to sign..."
          aria-required="true"
        />
      </div>

      {/* Sign button */}
      <button
        className="cc-btn cc-btn--primary"
        style={{ width: '100%' }}
        onClick={handleSign}
        disabled={isPending || !message.trim()}
        aria-label="Sign the message with your wallet."
      >
        {isPending ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--cc-space-xs)' }}>
            <span className="cc-spinner" /> Signing...
          </span>
        ) : (
          'Sign message.'
        )}
      </button>

      {/* Error display */}
      {(error || sigError) && (
        <div className="cc-error" role="alert">
          {sigError ?? error?.message}
        </div>
      )}

      {/* Signature result */}
      {sigResult && (
        <div style={{ marginTop: 'var(--cc-space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--cc-space-xs)', flexWrap: 'wrap', gap: 'var(--cc-space-xs)' }}>
            <span className="cc-label" style={{ marginBottom: 0 }} id="signature-label">Signature.</span>
            <div style={{ display: 'flex', gap: 'var(--cc-space-xs)', alignItems: 'center' }}>
              {isValidSignature && (
                <span style={{ fontSize: 'var(--cc-text-xs)', color: 'var(--cc-success)' }}>✓ Valid format</span>
              )}
              <button className="cc-btn cc-btn--ghost" onClick={handleCopy} aria-label="Copy signature to clipboard.">
                Copy
              </button>
            </div>
          </div>
          <div style={{ background: 'var(--cc-surface)', border: '1px solid var(--cc-hairline)', borderRadius: 'var(--cc-radius-md)', padding: 'var(--cc-space-sm)', fontFamily: 'var(--cc-font-mono)', fontSize: 'var(--cc-text-xs)', wordBreak: 'break-all', lineHeight: 1.6, color: 'var(--cc-success)' }} aria-labelledby="signature-label">
            {sigResult.slice(0, 66)}
            <br />
            ...
            <br />
            {sigResult.slice(-20)}
          </div>
        </div>
      )}

      {/* Info */}
      <p style={{ marginTop: 'var(--cc-space-md)', fontSize: 'var(--cc-text-xs)', color: 'var(--cc-muted)' }}>
        Uses <code className="cc-code">personal_sign</code>. The wallet will prompt for user confirmation.
      </p>
    </section>
  );
}
