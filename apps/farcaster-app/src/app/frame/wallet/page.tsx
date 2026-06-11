import type { Metadata } from 'next';
import { buildFrameMetadata, getAppUrl } from '@/lib/frame-utils';
import { Wallet } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cinacoin - Wallet',
  description: 'Connect and manage your wallet in Cinacoin Farcaster Mini App.',
  other: buildFrameMetadata({
    image: `${getAppUrl()}/og-wallet.png`,
    title: 'Cinacoin Wallet',
    buttons: [
      { label: 'View Balance', action: 'post' },
      { label: 'Transfer', action: 'post' },
      { label: '✍️ Sign Message', action: 'post' },
      { label: 'Home', action: 'post' },
    ],
    postUrl: `${getAppUrl()}/frame/wallet/`,
  }),
};

export default function WalletFramePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-6 text-center">
        <p className="font-mono text-xs text-[var(--color-mute)] mb-2">WALLET</p>
        <h1 className="text-display-lg font-semibold text-[var(--color-violet)] flex items-center justify-center gap-2"><Wallet className="w-5 h-5" /> Wallet</h1>
        <div className="bg-[var(--color-canvas-soft-2)] rounded-2xl p-6 border border-[var(--color-hairline)] space-y-4">
          <p className="text-[var(--color-body)]">
            Connect your wallet to view balance, transfer tokens, and sign messages.
          </p>
          <div className="bg-[var(--color-canvas-soft-2)] rounded-xl p-4">
            <p className="text-body-sm text-[var(--color-mute)] mb-1">Status</p>
            <p className="text-body-lg font-[var(--font-mono)] text-[var(--color-warning)]">Not Connected</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-body-sm">
            <div className="bg-[var(--color-canvas-soft-2)] rounded-lg p-3">
              <p className="text-[var(--color-mute)]">Chain</p>
              <p className="text-[var(--color-on-primary)] font-medium">Base (8453)</p>
            </div>
            <div className="bg-[var(--color-canvas-soft-2)] rounded-lg p-3">
              <p className="text-[var(--color-mute)]">Balance</p>
              <p className="text-[var(--color-on-primary)] font-medium">— CINA</p>
            </div>
          </div>
        </div>
        <p className="text-[var(--color-mute)] text-body-sm">
          Open in Farcaster to interact with this Frame.
        </p>
      </div>
    </main>
  );
}
