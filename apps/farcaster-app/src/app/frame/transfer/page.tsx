import type { Metadata } from 'next';
import { buildFrameMetadata, getAppUrl } from '@/lib/frame-utils';

export const metadata: Metadata = {
  title: 'Cinacoin - Transfer',
  description: 'Transfer Cinacoin tokens to any address from Farcaster.',
  other: buildFrameMetadata({
    image: `${getAppUrl()}/og-transfer.png`,
    title: 'Transfer Cinacoin',
    input: 'Recipient address (0x...)',
    buttons: [
      { label: '💸 Send', action: 'post' },
      { label: '📋 Recent', action: 'post' },
      { label: '🔙 Back', action: 'post' },
    ],
    postUrl: `${getAppUrl()}/frame/transfer/`,
  }),
};

export default function TransferFramePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold text-blue-400">💸 Transfer</h1>
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <p className="text-gray-300">
            Send Cinacoin tokens to any Ethereum address.
          </p>
          <div className="space-y-3">
            <div className="bg-gray-800 rounded-xl p-4 text-left">
              <label className="text-sm text-gray-500 block mb-1">To</label>
              <input
                type="text"
                placeholder="0x..."
                className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="bg-gray-800 rounded-xl p-4 text-left">
              <label className="text-sm text-gray-500 block mb-1">Amount</label>
              <input
                type="text"
                placeholder="0.00"
                className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors">
            Send Transfer
          </button>
        </div>
      </div>
    </main>
  );
}
