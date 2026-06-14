'use client';

import { useSignMessage, useCinacoinContext } from '@cinacoin/react';
import { PenLine } from 'lucide-react';
import React, { useState } from 'react';

/** DemoSignMessage — sign arbitrary messages with the connected wallet. */
export function DemoSignMessage(): JSX.Element {
  const { status } = useCinacoinContext();
  const { signMessage, isPending, error } = useSignMessage();

  const [message, setMessage] = useState('Welcome to Cinacoin.');
  const [sigResult, setSigResult] = useState<string | null>(null);
  const [sigError, setSigError] = useState<string | null>(null);

  const handleSign = () => {
    if (!message.trim()) return;
    setSigError(null);
    setSigResult(null);

    signMessage(message)
      .then((sig) => {
        setSigResult(sig);
      })
      .catch((err) => {
        setSigError(err instanceof Error ? err.message : String(err));
      });
  };

  const handleCopy = () => {
    if (sigResult) {
      navigator.clipboard.writeText(sigResult).catch(() => {
        // Clipboard access may fail in some contexts
      });
    }
  };

  const isValidSignature = sigResult && /^0x[0-9a-fA-F]{130}$/.test(sigResult);

  if (status !== 'connected') {
    return (
      <section className="cc-card cc-fade-in" aria-labelledby="sign-heading">
        <h3 id="sign-heading" className="cc-section-title">
          <PenLine className="cc-icon" aria-hidden="true" /> Sign message.
        </h3>
        <p className="cc-section-desc">Connect a wallet to sign messages.</p>
      </section>
    );
  }

  return (
    <section className="cc-card cc-fade-in" aria-labelledby="sign-heading">
      <h3 id="sign-heading" className="cc-section-title">
        <PenLine className="cc-icon" aria-hidden="true" /> Sign message.
      </h3>
      <p className="cc-section-desc">
        Sign arbitrary messages with your wallet using personal_sign.
      </p>

      {/* Message input */}
      <div className="cc-field">
        <label className="cc-label" htmlFor="sign-message-input">
          Message to sign.
        </label>
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
        className="cc-btn cc-btn--primary cc-btn--full"
        onClick={handleSign}
        disabled={isPending || !message.trim()}
        aria-label="Sign the message with your wallet."
      >
        {isPending ? (
          <span className="cc-balance-loading">
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
        <div className="cc-signature-box">
          <div className="cc-signature-header">
            <span className="cc-label" style={{ marginBottom: 0 }} id="signature-label">
              Signature.
            </span>
            <div className="cc-button-group" style={{ gap: 'var(--cc-space-xs)' }}>
              {isValidSignature && <span className="cc-signature-valid">✓ Valid format</span>}
              <button
                className="cc-btn cc-btn--ghost"
                onClick={handleCopy}
                aria-label="Copy signature to clipboard."
              >
                Copy
              </button>
            </div>
          </div>
          <div className="cc-signature-value" aria-labelledby="signature-label">
            {sigResult.slice(0, 66)}
            <br />
            ...
            <br />
            {sigResult.slice(-20)}
          </div>
        </div>
      )}

      {/* Info */}
      <p className="cc-info-note">
        Uses <code className="cc-code">personal_sign</code>. The wallet will prompt for user
        confirmation.
      </p>
    </section>
  );
}
