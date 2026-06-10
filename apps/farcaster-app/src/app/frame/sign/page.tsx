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
        <h1 className="text-3xl font-bold text-green-400">✍️ Sign Message</h1>
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <p className="text-gray-300">
            Sign a message with your connected wallet to prove ownership.
          </p>
          <div className="bg-gray-800 rounded-xl p-4 text-left">
            <label className="text-sm text-gray-500 block mb-1">Message</label>
            <textarea
              placeholder="Enter message to sign..."
              rows={4}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>
          <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition-colors">
            Sign Message
          </button>
        </div>
      </div>
    </main>
  );
}
