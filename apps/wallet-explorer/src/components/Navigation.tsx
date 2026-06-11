'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { truncateAddress } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/send', label: 'Send' },
  { href: '/receive', label: 'Receive' },
  { href: '/tokens', label: 'Tokens' },
  { href: '/history', label: 'History' },
  { href: '/swap', label: 'Swap' },
  { href: '/settings', label: 'Settings' },
];

export default memo(function Navigation() {
  const pathname = usePathname();
  const { connected, address, connect, disconnect } = useWallet();

  return (
    <nav className="mb-8 border-b border-hairline pb-4" aria-label="Main navigation">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="CinaCoin" width={24} height={24} className="h-6 w-auto" priority />
          <span className="text-heading-3 text-ink">Wallet Explorer</span>
        </div>
        <div>
          {connected ? (
            <div className="flex items-center gap-3">
              <code className="text-caption-mono text-mute" title={address || ''}>
                {truncateAddress(address || '')}
              </code>
              <button onClick={disconnect} className="cc-btn-secondary" aria-label="Disconnect wallet">
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={connect} className="cc-btn-primary">
              Connect Wallet
            </button>
          )}
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? 'page' : undefined}
              className={`px-4 py-2 rounded-md text-body-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-on-primary'
                  : 'text-body hover:bg-canvas-soft-2'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
});
