'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';

export default function Navigation() {
  const pathname = usePathname();
  const { connected, address, connect, disconnect } = useWallet();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/send', label: 'Send' },
    { href: '/receive', label: 'Receive' },
    { href: '/tokens', label: 'Tokens' },
    { href: '/history', label: 'History' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <nav className="mb-8 border-b border-hairline pb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="CinaCoin" className="h-6 w-auto" />
          <span className="text-heading-3 text-ink">Wallet Explorer</span>
        </div>
        <div>
          {connected ? (
            <div className="flex items-center gap-3">
              <code className="text-caption-mono text-mute">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </code>
              <button onClick={disconnect} className="cc-btn-secondary">
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
      <div className="flex gap-2 overflow-x-auto pb-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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
}
