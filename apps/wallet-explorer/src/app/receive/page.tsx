'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { copyToClipboard, truncateAddress } from '@/lib/utils';
import { COPY_FEEDBACK_DURATION } from '@/lib/constants';

export default function ReceivePage() {
  const { connected, address, connect } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    const success = await copyToClipboard(address);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
    }
  };

  if (!connected) {
    return (
      <div className="cc-card text-center py-12">
        <h2 className="text-heading-2 text-ink">Receive CINA</h2>
        <p className="mt-2 text-body text-mute">Connect your wallet to view your receive address.</p>
        <button onClick={connect} className="cc-btn-primary mt-6">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-2 text-ink">Receive CINA</h1>
        <p className="mt-1 text-body text-mute">Share your address to receive tokens.</p>
      </div>

      <div className="cc-card text-center">
        {/* QR Code placeholder */}
        <div className="mx-auto mb-6 flex h-48 w-48 items-center justify-center rounded-lg bg-canvas-soft-2 border border-hairline">
          <div className="grid grid-cols-5 gap-1 p-4">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className={`h-6 w-6 rounded-sm ${
                  [0,1,3,5,6,8,10,12,14,16,18,20,21,23,24].includes(i)
                    ? 'bg-primary'
                    : 'bg-canvas-soft-2'
                }`}
              />
            ))}
          </div>
        </div>

        <p className="text-caption text-mute mb-3">Your Wallet Address</p>
        <div className="flex items-center justify-center gap-3">
          <code className="rounded-lg bg-canvas-soft-2 px-4 py-3 text-body font-[var(--font-mono)] text-ink break-all">
            {address}
          </code>
        </div>

        <button
          onClick={handleCopy}
          className="cc-btn-primary mt-6"
          aria-label={copied ? 'Address copied' : 'Copy address to clipboard'}
        >
          {copied ? '✓ Copied!' : 'Copy Address'}
        </button>

        <p className="mt-6 text-body-sm text-mute">
          Only send CINA and CINA-20 tokens to this address. Sending other assets may result in permanent loss.
        </p>
      </div>
    </div>
  );
}
