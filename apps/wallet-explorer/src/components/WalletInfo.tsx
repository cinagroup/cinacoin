'use client';

import { memo } from 'react';
import { truncateAddress } from '@/lib/utils';

interface WalletInfoProps {
  address: string;
  balance: string;
  tokenBalance?: string;
  txCount: number;
  firstSeen: string;
}

export default memo(function WalletInfo({ address, balance, tokenBalance, txCount, firstSeen }: WalletInfoProps) {
  return (
    <div className="cc-card">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-heading-3 text-[var(--cc-ink)]">Wallet details</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-body-sm text-mute">Address</span>
            <code className="text-link" title={address}>{truncateAddress(address, 10, 8)}</code>
          </div>
        </div>
        <div className="badge badge-success">
          Active
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-4">
          <p className="text-caption text-mute">Balance</p>
          <p className="mt-1 text-display-sm text-[var(--cc-ink)]">{balance} CINA</p>
          <p className="text-caption text-mute">Native balance</p>
        </div>
        {tokenBalance && (
          <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-4">
            <p className="text-caption text-mute">Token balance</p>
            <p className="mt-1 text-display-sm text-[var(--cc-ink)]">{tokenBalance} CINA</p>
            <p className="text-caption text-mute">CINA-20 tokens.</p>
          </div>
        )}
        <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-4">
          <p className="text-caption text-mute">Transactions</p>
          <p className="mt-1 text-display-sm text-[var(--cc-ink)]">{txCount.toLocaleString()}</p>
          <p className="text-caption text-mute">Total</p>
        </div>
        <div className="bg-[var(--cc-canvas-soft-2)] rounded-sm p-4">
          <p className="text-caption text-mute">First seen</p>
          <p className="mt-1 text-display-sm text-[var(--cc-ink)]">{firstSeen}</p>
          <p className="text-caption text-mute">Date</p>
        </div>
      </div>
    </div>
  );
});
