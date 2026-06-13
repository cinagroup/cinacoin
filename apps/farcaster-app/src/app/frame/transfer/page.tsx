import type { Metadata } from 'next';
import { buildFrameMetadata, getAppUrl } from '@/lib/frame-utils';
import { Send } from 'lucide-react';

export const metadata: Metadata = {
  title: 'CinaCoin — Transfer',
  description: 'Transfer CinaCoin tokens to any address from Farcaster.',
  other: buildFrameMetadata({
    image: `${getAppUrl()}/og-transfer.png`,
    title: 'Transfer CinaCoin',
    input: 'Recipient address (0x...)',
    buttons: [
      { label: 'Send', action: 'post' },
      { label: 'Recent', action: 'post' },
      { label: 'Back', action: 'post' },
    ],
    postUrl: `${getAppUrl()}/frame/transfer/`,
  }),
};

export default function TransferFramePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-8">
      <div className="max-w-lg w-full space-y-6 text-center">
        <p className="font-[family-name:var(--font-geist-mono)] text-xs text-[var(--cc-mute)] mb-2" aria-label="Page type">Transaction</p>
        <h1 className="text-display-lg font-semibold text-[var(--cc-ink)] flex items-center justify-center gap-2">
          <Send className="w-5 h-5" aria-hidden="true" /> Transfer.
        </h1>
        <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-6 border border-[var(--cc-hairline)] space-y-4">
          <p className="text-[var(--cc-body)]">
            Send CINA to any address. Gas estimated at ~0.0021 CINA.
          </p>
          <div className="space-y-3">
            <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-4 text-left">
              <label htmlFor="transfer-to" className="text-body-sm text-[var(--cc-mute)] block mb-1">To</label>
              <input
                id="transfer-to"
                type="text"
                placeholder="0x..."
                aria-label="Recipient address"
                className="w-full bg-[var(--cc-hairline-strong)] rounded-sm px-3 py-2 text-[var(--cc-on-primary)] font-[family-name:var(--font-geist-mono)] text-body-sm focus:outline-none focus:ring-2 focus:ring-[var(--cc-link)]"
              />
            </div>
            <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-4 text-left">
              <label htmlFor="transfer-amount" className="text-body-sm text-[var(--cc-mute)] block mb-1">Amount</label>
              <input
                id="transfer-amount"
                type="text"
                placeholder="0.00"
                aria-label="Transfer amount"
                className="w-full bg-[var(--cc-hairline-strong)] rounded-sm px-3 py-2 text-[var(--cc-on-primary)] font-[family-name:var(--font-geist-mono)] text-body-sm focus:outline-none focus:ring-2 focus:ring-[var(--cc-link)]"
              />
            </div>
          </div>
          <button
            aria-label="Send transfer"
            className="w-full bg-[var(--cc-ink)] hover:bg-[var(--cc-ink)]/90 text-[var(--cc-canvas)] py-3 rounded-sm font-medium transition-colors"
          >
            Send transfer.
          </button>
        </div>
      </div>
    </main>
  );
}
