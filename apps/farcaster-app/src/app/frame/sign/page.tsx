import type { Metadata } from 'next';
import { buildFrameMetadata, getAppUrl } from '@/lib/frame-utils';
import { PenLine } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cinacoin — Sign',
  description: 'Sign messages with your wallet in the Cinacoin Farcaster Mini App.',
  other: buildFrameMetadata({
    image: `${getAppUrl()}/og-sign.png`,
    title: 'Sign Message',
    input: 'Enter message to sign...',
    buttons: [
      { label: 'Sign', action: 'post' },
      { label: 'Template', action: 'post' },
      { label: 'Back', action: 'post' },
    ],
    postUrl: `${getAppUrl()}/frame/sign/`,
  }),
};

export default function SignFramePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-8">
      <div className="max-w-lg w-full space-y-6 text-center">
        <p className="font-[family-name:var(--font-geist-mono)] text-xs text-[var(--cc-mute)] mb-2" aria-label="Page type">Cryptography</p>
        <h1 className="text-display-lg font-semibold text-[var(--cc-ink)] flex items-center justify-center gap-2">
          <PenLine className="w-5 h-5" aria-hidden="true" /> Sign message.
        </h1>
        <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-6 border border-[var(--cc-hairline)] space-y-4">
          <p className="text-[var(--cc-body)]">
            Prove wallet ownership by signing an arbitrary message.
          </p>
          <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-4 text-left">
            <label htmlFor="sign-message" className="text-body-sm text-[var(--cc-mute)] block mb-1">Message</label>
            <textarea
              id="sign-message"
              placeholder="Enter message to sign..."
              rows={4}
              aria-label="Message to sign"
              className="w-full bg-[var(--cc-hairline-strong)] rounded-sm px-3 py-2 text-[var(--cc-on-primary)] text-body-sm focus:outline-none focus:ring-2 focus:ring-[var(--cc-success)] resize-none"
            />
          </div>
          <button
            aria-label="Sign message"
            className="w-full bg-[var(--cc-ink)] hover:bg-[var(--cc-ink)]/90 text-[var(--cc-canvas)] py-3 rounded-sm font-medium transition-colors"
          >
            Sign message.
          </button>
        </div>
      </div>
    </main>
  );
}
