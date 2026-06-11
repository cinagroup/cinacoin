import type { Metadata } from 'next';
import { buildFrameMetadata, getAppUrl } from '@/lib/frame-utils';

export const metadata: Metadata = {
  title: 'Cinacoin Farcaster App',
  description: 'Welcome to Cinacoin — Connect your wallet, transfer tokens, and sign messages on Farcaster.',
  other: buildFrameMetadata({
    image: `${getAppUrl()}/og-default.png`,
    title: 'Cinacoin',
    buttons: [
      { label: '🔗 Connect Wallet', action: 'post' },
      { label: '👤 Profile', action: 'post' },
      { label: '📖 Docs', action: 'link', target: 'https://docs.cinacoin.org' },
    ],
    postUrl: `${getAppUrl()}/frame/`,
  }),
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-display-xl font-semibold bg-gradient-to-r from-[var(--color-violet)] to-[var(--color-link)] bg-clip-text text-transparent">
            Cinacoin
          </h1>
          <p className="text-[var(--color-mute)] text-body-lg">Farcaster Mini App</p>
        </div>

        <div className="bg-[var(--color-canvas-soft-2)] rounded-2xl p-6 border border-[var(--color-hairline)] space-y-4">
          <p className="text-[var(--color-body)]">
            Welcome! Interact with Cinacoin directly from your Farcaster feed.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <a
              href="/frame/wallet/"
              className="bg-[var(--color-violet)] hover:bg-[var(--color-violet-deep)] text-[var(--color-on-primary)] py-3 px-4 rounded-xl font-medium transition-colors"
            >
              🔗 Wallet
            </a>
            <a
              href="/frame/transfer/"
              className="bg-[var(--color-link)] hover:bg-[var(--color-link-deep)] text-[var(--color-on-primary)] py-3 px-4 rounded-xl font-medium transition-colors"
            >
              💸 Transfer
            </a>
            <a
              href="/frame/sign/"
              className="bg-[var(--color-success)] hover:bg-[var(--color-success-deep)] text-[var(--color-on-primary)] py-3 px-4 rounded-xl font-medium transition-colors"
            >
              ✍️ Sign
            </a>
            <a
              href="/frame/profile/"
              className="bg-[var(--color-hairline-strong)] hover:bg-[var(--color-mute)] text-[var(--color-on-primary)] py-3 px-4 rounded-xl font-medium transition-colors"
            >
              👤 Profile
            </a>
          </div>
        </div>

        <p className="text-[var(--color-mute)] text-body-sm">
          Open this page inside Farcaster to use the Frame experience.
        </p>
      </div>
    </main>
  );
}
