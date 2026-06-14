import { User } from 'lucide-react';
import type { Metadata } from 'next';

import { buildFrameMetadata, getAppUrl } from '@/lib/frame-utils';

export const metadata: Metadata = {
  title: 'Cinacoin — Profile',
  description: 'View your Farcaster profile and wallet connections.',
  other: buildFrameMetadata({
    image: `${getAppUrl()}/og-profile.png`,
    title: 'Your Profile',
    buttons: [
      { label: 'Connect Wallet', action: 'post' },
      { label: 'Refresh', action: 'post' },
      { label: 'Home', action: 'post' },
    ],
    postUrl: `${getAppUrl()}/frame/profile/`,
  }),
};

export default function ProfileFramePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-8">
      <div className="max-w-lg w-full space-y-6 text-center">
        <p
          className="font-[family-name:var(--font-geist-mono)] text-xs text-[var(--cc-mute)] mb-2"
          aria-label="Page type"
        >
          Profile
        </p>
        <h1 className="text-display-lg font-semibold text-[var(--cc-ink)] flex items-center justify-center gap-2">
          <User className="w-5 h-5" aria-hidden="true" /> Profile.
        </h1>
        <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-6 border border-[var(--cc-hairline)] space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="w-16 h-16 bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-[var(--cc-mute)]" aria-hidden="true" />
            </div>
            <div className="text-left">
              <p className="text-body-lg font-medium text-[var(--cc-ink)]">Not Connected.</p>
              <p className="text-body-sm text-[var(--cc-mute)]">Connect via Farcaster.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-body-sm">
            <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-3">
              <p className="text-[var(--cc-mute)]">FID.</p>
              <p className="text-[var(--cc-ink)] font-[family-name:var(--font-geist-mono)]">—</p>
            </div>
            <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-3">
              <p className="text-[var(--cc-mute)]">Wallet</p>
              <p className="text-[var(--cc-ink)] font-[family-name:var(--font-geist-mono)] text-caption">
                Not linked.
              </p>
            </div>
          </div>
          <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-3 text-body-sm">
            <p className="text-[var(--cc-mute)] mb-1">Verified Addresses</p>
            <p className="text-[var(--cc-mute)] font-[family-name:var(--font-geist-mono)] text-caption">
              None.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
