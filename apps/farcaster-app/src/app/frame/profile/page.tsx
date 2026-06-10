import type { Metadata } from 'next';
import { buildFrameMetadata, getAppUrl } from '@/lib/frame-utils';

export const metadata: Metadata = {
  title: 'Cinacoin - Profile',
  description: 'View your Farcaster profile and wallet connections.',
  other: buildFrameMetadata({
    image: `${getAppUrl()}/og-profile.png`,
    title: 'Your Profile',
    buttons: [
      { label: '🔗 Connect Wallet', action: 'post' },
      { label: '🔄 Refresh', action: 'post' },
      { label: '🏠 Home', action: 'post' },
    ],
    postUrl: `${getAppUrl()}/frame/profile/`,
  }),
};

export default function ProfileFramePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-6 text-center">
        <h1 className="text-[32px] font-bold text-[var(--color-ink)]">👤 Profile</h1>
        <div className="bg-[var(--color-canvas-soft-2)] rounded-2xl p-6 border border-[var(--color-hairline)] space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-[24px]">
              ?
            </div>
            <div className="text-left">
              <p className="text-[18px] font-medium text-white">Not Connected</p>
              <p className="text-[14px] text-[var(--color-mute)]">Connect via Farcaster</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[14px]">
            <div className="bg-[var(--color-canvas-soft-2)] rounded-lg p-3">
              <p className="text-[var(--color-mute)]">FID</p>
              <p className="text-white font-[var(--font-mono)]">—</p>
            </div>
            <div className="bg-[var(--color-canvas-soft-2)] rounded-lg p-3">
              <p className="text-[var(--color-mute)]">Wallet</p>
              <p className="text-white font-[var(--font-mono)] text-[12px]">Not linked</p>
            </div>
          </div>
          <div className="bg-[var(--color-canvas-soft-2)] rounded-lg p-3 text-[14px]">
            <p className="text-[var(--color-mute)] mb-1">Verified Addresses</p>
            <p className="text-[var(--color-mute)] font-[var(--font-mono)] text-[12px]">None</p>
          </div>
        </div>
      </div>
    </main>
  );
}
