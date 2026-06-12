import type { Metadata } from 'next';
import { buildFrameMetadata, getAppUrl } from '@/lib/frame-utils';
import { Link, Send, PenLine, User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'CinaCoin Farcaster App',
  description: 'Welcome to CinaCoin — connect your wallet, transfer tokens, and sign messages on Farcaster.',
  other: buildFrameMetadata({
    image: `${getAppUrl()}/og-default.png`,
    title: 'CinaCoin',
    buttons: [
      { label: 'Connect Wallet', action: 'post' },
      { label: 'Profile', action: 'post' },
      { label: 'Docs', action: 'link', target: 'https://docs.cinacoin.org' },
    ],
    postUrl: `${getAppUrl()}/frame/`,
  }),
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-8">
      <div className="max-w-lg w-full space-y-8 text-center">
        <div className="space-y-2">
          <p className="font-[family-name:var(--font-geist-mono)] text-xs text-[var(--cc-mute)] mb-2" aria-label="Application type">Farcaster Mini App</p>
          <h1 className="text-display-xl font-semibold bg-gradient-to-r from-[var(--cc-violet)] to-[var(--cc-link)] bg-clip-text text-transparent">
            CinaCoin.
          </h1>
          <p className="text-[var(--cc-mute)] text-body-lg">Wallet, transfer, sign — from your Farcaster feed.</p>
        </div>

        <div className="bg-[var(--cc-canvas-soft-2)] rounded-2xl p-6 border border-[var(--cc-hairline)] space-y-4">
          <p className="text-[var(--cc-body)]">
            Send CINA, sign messages, and manage your wallet without leaving Warpcast.
          </p>

          <nav aria-label="Main navigation">
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/frame/wallet/"
                aria-label="Open wallet"
                className="bg-[var(--cc-violet)] hover:bg-[var(--cc-violet-deep)] text-[var(--cc-on-primary)] py-3 px-4 rounded-xl font-medium transition-colors"
              >
                <span className="flex items-center gap-2"><Link className="w-5 h-5" aria-hidden="true" /> Wallet.</span>
              </a>
              <a
                href="/frame/transfer/"
                aria-label="Open transfer"
                className="bg-[var(--cc-link)] hover:bg-[var(--cc-link-deep)] text-[var(--cc-on-primary)] py-3 px-4 rounded-xl font-medium transition-colors"
              >
                <span className="flex items-center gap-2"><Send className="w-5 h-5" aria-hidden="true" /> Transfer.</span>
              </a>
              <a
                href="/frame/sign/"
                aria-label="Open sign message"
                className="bg-[var(--cc-success)] hover:bg-[var(--cc-success-deep)] text-[var(--cc-on-primary)] py-3 px-4 rounded-xl font-medium transition-colors"
              >
                <span className="flex items-center gap-2"><PenLine className="w-5 h-5" aria-hidden="true" /> Sign.</span>
              </a>
              <a
                href="/frame/profile/"
                aria-label="Open profile"
                className="bg-[var(--cc-hairline-strong)] hover:bg-[var(--cc-mute)] text-[var(--cc-on-primary)] py-3 px-4 rounded-xl font-medium transition-colors"
              >
                <span className="flex items-center gap-2"><User className="w-5 h-5" aria-hidden="true" /> Profile.</span>
              </a>
            </div>
          </nav>
        </div>

        <p className="text-[var(--cc-mute)] text-body-sm">
          Open this page inside Farcaster to use the Frame experience.
        </p>
      </div>
    </main>
  );
}
