import type { Metadata } from 'next';
import { buildFrameMetadata, getAppUrl } from '@/lib/frame-utils';
import { Wallet } from 'lucide-react';

export const metadata: Metadata = {
  title: 'CinaCoin — Wallet',
  description: 'Connect and manage your wallet in the CinaCoin Farcaster Mini App.',
  other: buildFrameMetadata({
    image: `${getAppUrl()}/og-wallet.png`,
    title: 'CinaCoin Wallet',
    buttons: [
      { label: 'View Balance', action: 'post' },
      { label: 'Transfer', action: 'post' },
      { label: 'Sign Message', action: 'post' },
      { label: 'Home', action: 'post' },
    ],
    postUrl: `${getAppUrl()}/frame/wallet/`,
  }),
};

export default function WalletFramePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-8">
      <div className="max-w-lg w-full space-y-6 text-center">
        <p className="font-[family-name:var(--font-geist-mono)] text-xs text-[var(--cc-mute)] mb-2" aria-label="Page type">Wallet</p>
        <h1 className="text-display-lg font-semibold text-[var(--cc-ink)] flex items-center justify-center gap-2">
          <Wallet className="w-5 h-5" aria-hidden="true" /> Wallet.
        </h1>
        <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-6 border border-[var(--cc-hairline)] space-y-4">
          <p className="text-[var(--cc-body)]">
            Connect your wallet to check balances and initiate transfers.
          </p>
          <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-4">
            <p className="text-body-sm text-[var(--cc-mute)] mb-1">Status</p>
            <p className="text-body-lg font-[family-name:var(--font-geist-mono)] text-[var(--cc-warning)]">Not Connected.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-body-sm">
            <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-3">
              <p className="text-[var(--cc-mute)]">Chain</p>
              <p className="text-[var(--cc-ink)] font-medium">Base (8453).</p>
            </div>
            <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-3">
              <p className="text-[var(--cc-mute)]">Balance</p>
              <p className="text-[var(--cc-ink)] font-medium">— CINA.</p>
            </div>
          </div>
        </div>
        <p className="text-[var(--cc-mute)] text-body-sm">
          Open in Farcaster to interact with this Frame.
        </p>
      </div>
    </main>
  );
}
