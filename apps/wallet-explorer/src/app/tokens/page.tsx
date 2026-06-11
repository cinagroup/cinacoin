'use client';

import { useWallet } from '@/hooks/useWallet';
import { Coins } from 'lucide-react';
import type { Token } from '@/types';

const mockTokens: Token[] = [
  { symbol: 'CINA', name: 'CinaCoin', balance: '1,234,567.89', value: '$2,469,135.78', change24h: '+3.2%', changePositive: true },
  { symbol: 'USDC', name: 'USD Coin', balance: '50,000.00', value: '$50,000.00', change24h: '+0.01%', changePositive: true },
  { symbol: 'WETH', name: 'Wrapped Ether', balance: '12.5', value: '$46,875.00', change24h: '-1.4%', changePositive: false },
  { symbol: 'CINA-LP', name: 'CinaCoin LP Token', balance: '1,250.00', value: '$6,250.00', change24h: '+2.1%', changePositive: true },
];

export default function TokensPage() {
  const { connected, connect } = useWallet();

  if (!connected) {
    return (
      <div className="cc-card text-center py-12">
        <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">TOKENS</p>
        <h2 className="text-heading-2 text-ink">Tokens.</h2>
        <p className="mt-2 text-body text-mute">Connect your wallet to view your tokens.</p>
        <button onClick={connect} className="cc-btn-primary mt-6">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs text-[var(--cc-muted)] mb-2">TOKENS</p>
        <h1 className="text-heading-2 text-ink">Tokens.</h1>
        <p className="mt-1 text-body text-mute">Your token balances and portfolio.</p>
      </div>

      <div className="cc-card p-0 overflow-hidden">
        <div className="border-b border-hairline p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-heading-3 text-ink">Your tokens.</h2>
            <span className="text-body-sm text-mute">{mockTokens.length} tokens</span>
          </div>
        </div>

        {mockTokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Coins className="mb-4 h-12 w-12 text-mute" aria-hidden="true" />
            <h3 className="text-heading-3 text-ink mb-1">No tokens found.</h3>
            <p className="text-body-sm text-mute max-w-sm">You don&apos;t have any tokens in this wallet yet.</p>
          </div>
        ) : (
          mockTokens.map((token) => (
            <div
              key={token.symbol}
              className="flex items-center justify-between p-5 border-b border-hairline last:border-b-0 transition-colors hover:bg-canvas-soft"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas-soft-2 text-body-sm font-medium text-ink">
                  {token.symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="text-body font-medium text-ink">{token.name}</p>
                  <p className="text-body-sm text-mute">{token.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-body font-[var(--font-mono)] text-ink">{token.balance}</p>
                <div className="flex items-center justify-end gap-2">
                  <p className="text-body-sm text-mute">{token.value}</p>
                  <span className={`text-body-sm ${token.changePositive ? 'text-success' : 'text-error'}`}>
                    {token.change24h}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
