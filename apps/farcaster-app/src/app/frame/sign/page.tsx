import type { Metadata } from 'next';
import { buildFrameMetadata, getAppUrl } from '@/lib/frame-utils';

export const metadata: Metadata = {
  title: 'Cinacoin - Sign',
  description: 'Sign messages with your wallet in Cinacoin Farcaster Mini App.',
  other: buildFrameMetadata({
    image: `${getAppUrl()}/og-sign.png`,
    title: 'Sign Message',
    input: 'Enter message to sign...',
    buttons: [
      { label: '✍️ Sign', action: 'post' },
      { label: '📝 Template', action: 'post' },
      { label: '🔙 Back', action: 'post' },
    ],
    postUrl: `${getAppUrl()}/frame/sign/`,
  }),
};

export default function SignFramePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-6 text-center">
        <h1 className="text-display-lg font-bold text-[var(--color-success)]">✍️ Sign Message</h1>
        <div className="bg-[var(--color-canvas-soft-2)] rounded-2xl p-6 border border-[var(--color-hairline)] space-y-4">
          <p className="text-[var(--color-body)]">
            Sign a message with your connected wallet to prove ownership.
          </p>
          <div className="bg-[var(--color-canvas-soft-2)] rounded-xl p-4 text-left">
            <label htmlFor="sign-message" className="text-body-sm text-[var(--color-mute)] block mb-1">Message</label>
            <textarea
              id="sign-message"
              placeholder="Enter message to sign..."
              rows={4}
              className="w-full bg-[var(--color-hairline-strong)] rounded-lg px-3 py-2 text-[var(--color-on-primary)] text-body-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-success)] resize-none"
            />
          </div>
          <button className="w-full bg-[var(--color-success)] hover:bg-[var(--color-success-deep)] text-[var(--color-on-primary)] py-3 rounded-xl font-medium transition-colors">
            Sign Message
          </button>
        </div>
      </div>
    </main>
  );
}
