import { useState, useCallback } from 'react';
import type { TelegramProvider } from '@cinacoin/telegram-miniapp';
import { generateSignInMessage } from '@cinacoin/telegram-miniapp';
import { Lock, Pencil, ClipboardCopy } from 'lucide-react';
import '../styles/pages.css';

interface SignPageProps {
  provider: TelegramProvider;
  account: string | null;
}

export default function SignPage({ provider, account }: SignPageProps) {
  const [message, setMessage] = useState('');
  const [signing, setSigning] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignMessage = useCallback(async () => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    if (!message) {
      setError('Please enter a message to sign');
      provider.triggerHaptic('error');
      return;
    }

    setSigning(true);
    setError(null);
    setSignature(null);

    try {
      provider.triggerHaptic('medium');

      // Simulate signing
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Generate demo signature
      const demoSignature = `0x${Array.from({ length: 130 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      setSignature(demoSignature);
      provider.triggerHaptic('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signing failed';
      setError(errorMessage);
      provider.triggerHaptic('error');
    } finally {
      setSigning(false);
    }
  }, [account, message, provider]);

  const handleSignInWithTelegram = useCallback(async () => {
    if (!account) {
      setError('Please connect your wallet first');
      return;
    }

    setSigning(true);
    setError(null);
    setSignature(null);

    try {
      const user = provider.getUser();
      if (!user) {
        throw new Error('No Telegram user found');
      }

      provider.triggerHaptic('medium');

      // Generate SIWE message for verification
      const nonce = Math.random().toString(36).slice(2);
      generateSignInMessage(user, 'cinacoin.com', nonce);

      // Simulate signing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const demoSignature = `0x${Array.from({ length: 130 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      setSignature(`Signed SIWE message!\n\nSignature: ${demoSignature.slice(0, 40)}...`);
      provider.triggerHaptic('success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign-in failed';
      setError(errorMessage);
      provider.triggerHaptic('error');
    } finally {
      setSigning(false);
    }
  }, [account, provider]);

  const handleCopySignature = useCallback(() => {
    if (!signature) return;
    navigator.clipboard.writeText(signature).then(() => {
      provider.triggerHaptic('success');
    }).catch(() => {
      provider.showAlert(`Signature: ${signature}`);
    });
  }, [signature, provider]);

  if (!account) {
    return (
      <div className="page sign-page">
        <p className="font-mono text-xs mb-2" style={{ color: 'var(--cc-muted)' }}>CRYPTOGRAPHY</p>
        <h1 className="page-title font-semibold">Sign.</h1>
        <div className="empty-state">
          <p>Connect your wallet to sign messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page sign-page">
      <p className="font-mono text-xs mb-2" style={{ color: 'var(--cc-muted)' }}>CRYPTOGRAPHY</p>
      <h1 className="page-title font-semibold">Sign messages.</h1>

      <div className="sign-section">
        <h2 className="section-subtitle">Sign in with Telegram.</h2>
        <p className="section-description">
          Verify your identity by signing a message with your Telegram account.
        </p>
        <button
          className="cc-btn-primary"
          onClick={handleSignInWithTelegram}
          disabled={signing}
          aria-busy={signing}
        >
          {signing ? (
            <>
              <span className="btn-spinner" aria-hidden="true" />
              Signing...
            </>
          ) : (
            <><Lock className="w-4 h-4 inline-block mr-1" aria-hidden="true" /> Sign in with Telegram.</>
          )}
        </button>
      </div>

      <div className="sign-section">
        <h2 className="section-subtitle">Custom message.</h2>
        <div className="form-group">
          <label className="form-label" htmlFor="sign-message">Message to sign.</label>
          <textarea
            id="sign-message"
            className="form-textarea"
            placeholder="Enter your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={signing}
            rows={4}
          />
        </div>
        <button
          className="cc-btn-secondary"
          onClick={handleSignMessage}
          disabled={signing || !message}
          aria-busy={signing}
        >
          {signing ? (
            <>
              <span className="btn-spinner" aria-hidden="true" />
              Signing...
            </>
          ) : (
            <><Pencil className="w-4 h-4 inline-block mr-1" aria-hidden="true" /> Sign message.</>
          )}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {signature && (
        <div className="signature-result">
          <div className="signature-header">
            <h3>Signature.</h3>
            <button className="cc-btn-secondary-sm" onClick={handleCopySignature} aria-label="Copy signature">
              <ClipboardCopy className="w-4 h-4 inline-block mr-1" aria-hidden="true" /> Copy.
            </button>
          </div>
          <div className="signature-value">{signature}</div>
        </div>
      )}
    </div>
  );
}
