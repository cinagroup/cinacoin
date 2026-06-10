import type { Metadata } from 'next';
import { buildFrameMetadata, getAppUrl } from '@/lib/frame-utils';

export const metadata: Metadata = {
  title: 'Cinacoin - Wallet',
  description: 'Connect and manage your wallet in Cinacoin Farcaster Mini App.',
  other: buildFrameMetadata({
    image: `${getAppUrl()}/og-wallet.png`,
    title: 'Cinacoin Wallet',
    buttons: [
      { label: '💰 View Balance', action: 'post' },
      { label: '💸 Transfer', action: 'post' },
      { label: '✍️ Sign Message', action: 'post' },
      { label: '🏠 Home', action: 'post' },
    ],
    postUrl: `${getAppUrl()}/frame/wallet/`,
  }),
};

export default function WalletFramePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold text-purple-400">💰 Wallet</h1>
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <p className="text-gray-300">
            Connect your wallet to view balance, transfer tokens, and sign messages.
          </p>
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <p className="text-lg font-mono text-yellow-400">Not Connected</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-500">Chain</p>
              <p className="text-white font-medium">Base (8453)</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-500">Balance</p>
              <p className="text-white font-medium">— CINA</p>
            </div>
          </div>
        </div>
        <p className="text-gray-500 text-sm">
          Open in Farcaster to interact with this Frame.
        </p>
      </div>
    </main>
  );
}
