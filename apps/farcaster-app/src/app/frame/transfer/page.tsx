import type { Metadata } from 'next';
import { buildFrameMetadata, getAppUrl } from '@/lib/frame-utils';

export const metadata: Metadata = {
  title: 'Cinacoin - Transfer',
  description: 'Transfer Cinacoin tokens to any address from Farcaster.',
  other: buildFrameMetadata({
    image: `${getAppUrl()}/og-transfer.png`,
    title: 'Transfer Cinacoin',
    input: 'Recipient address (0x...)',
    buttons: [
      { label: '💸 Send', action: 'post' },
      { label: '📋 Recent', action: 'post' },
      { label: '🔙 Back', action: 'post' },
    ],
    postUrl: `${getAppUrl()}/frame/transfer/`,
  }),
};

export default function TransferFramePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-6 text-center">
        <h1 className="text-display-lg font-bold text-[var(--color-link)]">💸 Transfer</h1>
        <div className="bg-[var(--color-canvas-soft-2)] rounded-2xl p-6 border border-[var(--color-hairline)] space-y-4">
          <p className="text-[var(--color-body)]">
            Send Cinacoin tokens to any Ethereum address.
          </p>
          <div className="space-y-3">
            <div className="bg-[var(--color-canvas-soft-2)] rounded-xl p-4 text-left">
              <label className="text-body-sm text-[var(--color-mute)] block mb-1">To</label>
              <input
                type="text"
                placeholder="0x..."
                className="w-full bg-[var(--color-hairline-strong)] rounded-lg px-3 py-2 text-[var(--color-on-primary)] font-[var(--font-mono)] text-body-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-link)]"
              />
            </div>
            <div className="bg-[var(--color-canvas-soft-2)] rounded-xl p-4 text-left">
              <label className="text-body-sm text-[var(--color-mute)] block mb-1">Amount</label>
              <input
                type="text"
                placeholder="0.00"
                className="w-full bg-[var(--color-hairline-strong)] rounded-lg px-3 py-2 text-[var(--color-on-primary)] font-[var(--font-mono)] text-body-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-link)]"
              />
            </div>
          </div>
          <button className="w-full bg-[var(--color-link)] hover:bg-[var(--color-link-deep)] text-[var(--color-on-primary)] py-3 rounded-xl font-medium transition-colors">
            Send Transfer
          </button>
        </div>
      </div>
    </main>
  );
}
