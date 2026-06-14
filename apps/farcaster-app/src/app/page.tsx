import { Link, Send, PenLine, User } from 'lucide-react';
import type { Metadata } from 'next';

import { buildFrameMetadata, getAppUrl } from '@/lib/frame-utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';

export const metadata: Metadata = {
  title: 'Cinacoin Farcaster App',
  description:
    'Welcome to Cinacoin — connect your wallet, transfer tokens, and sign messages on Farcaster.',
  other: buildFrameMetadata({
    image: `${getAppUrl()}/og-default.png`,
    title: 'Cinacoin',
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
    <main className="flex min-h-screen flex-col items-center p-6 sm:p-8">
      {/* Mono eyebrow band */}
      <div className="w-full max-w-2xl mb-8 pt-6 flex items-center justify-between">
        <span className="font-[family-name:var(--font-geist-mono)] text-xs text-[var(--cc-mute)] tracking-wide uppercase">
          farcaster mini app
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>

      {/* Asymmetric hero — left-aligned */}
      <div className="max-w-2xl w-full space-y-8">
        <div className="space-y-3">
          <h1 className="text-display-xl font-semibold text-[var(--cc-ink)]">Cinacoin.</h1>
          <p className="text-[var(--cc-body)] text-body-lg max-w-md">
            Wallet, transfer, sign — from your Farcaster feed.
          </p>
        </div>

        {/* Dark band with code mockup */}
        <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm border border-[var(--cc-hairline)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--cc-hairline)] flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[var(--cc-hairline-strong)]" />
            <span className="w-3 h-3 rounded-full bg-[var(--cc-hairline-strong)]" />
            <span className="w-3 h-3 rounded-full bg-[var(--cc-hairline-strong)]" />
            <span className="ml-4 font-[family-name:var(--font-geist-mono)] text-xs text-[var(--cc-mute)]">
              frame config
            </span>
          </div>
          <pre className="p-6 text-sm font-[family-name:var(--font-geist-mono)] text-[var(--cc-body)] overflow-x-auto">
            <code>{`{
  "title": "Cinacoin",
  "image": "/og-default.png",
  "buttons": ["Connect Wallet", "Profile", "Docs"]
}`}</code>
          </pre>
        </div>

        {/* Action grid — left-aligned */}
        <div className="space-y-4">
          <p className="text-[var(--cc-body)] text-body-sm">
            Send CINA, sign messages, and manage your wallet without leaving Warpcast.
          </p>
          <nav aria-label="Main navigation">
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/frame/wallet/"
                aria-label="Open wallet application"
                className="bg-[var(--cc-ink)] hover:bg-[var(--cc-ink)]/90 text-[var(--cc-canvas)] py-3 px-4 rounded-sm font-medium transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Link className="w-5 h-5" aria-hidden="true" /> Wallet.
                </span>
              </a>
              <a
                href="/frame/transfer/"
                aria-label="Open transfer page"
                className="bg-[var(--cc-ink)] hover:bg-[var(--cc-ink)]/90 text-[var(--cc-canvas)] py-3 px-4 rounded-sm font-medium transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Send className="w-5 h-5" aria-hidden="true" /> Transfer.
                </span>
              </a>
              <a
                href="/frame/sign/"
                aria-label="Open sign message page"
                className="bg-[var(--cc-ink)] hover:bg-[var(--cc-ink)]/90 text-[var(--cc-canvas)] py-3 px-4 rounded-sm font-medium transition-colors"
              >
                <span className="flex items-center gap-2">
                  <PenLine className="w-5 h-5" aria-hidden="true" /> Sign.
                </span>
              </a>
              <a
                href="/frame/profile/"
                aria-label="Open profile page"
                className="bg-[var(--cc-canvas-soft-2)] hover:bg-[var(--cc-hairline-strong)] text-[var(--cc-ink)] py-3 px-4 rounded-sm font-medium transition-colors border border-[var(--cc-hairline)]"
              >
                <span className="flex items-center gap-2">
                  <User className="w-5 h-5" aria-hidden="true" /> Profile.
                </span>
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
