'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tutorials = [
  { href: '/basics', label: 'Web3 basics', category: 'Fundamentals', progress: 100 },
  {
    href: '/wallet-integration',
    label: 'Wallet integration',
    category: 'Fundamentals',
    progress: 60,
  },
  { href: '/multichain', label: 'Multichain development', category: 'Advanced', progress: 0 },
  { href: '/best-practices', label: 'Best practices', category: 'Advanced', progress: 0 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="h-screen w-64 overflow-y-auto"
      style={{
        backgroundColor: 'var(--cc-canvas-soft)',
        borderRight: '1px solid var(--cc-hairline)',
      }}
      aria-label="Tutorial navigation"
    >
      <div style={{ padding: 'var(--cc-space-lg)' }}>
        <Link href="/" className="block" style={{ marginBottom: 'var(--cc-space-xl)' }}>
          <div className="text-display-md" style={{ color: 'var(--cc-link)' }}>
            CinaCoin
          </div>
          <p className="text-body-sm" style={{ color: 'var(--cc-body)' }}>
            Learn platform
          </p>
        </Link>

        <nav className="space-y-6">
          {['Fundamentals', 'Advanced'].map((category) => (
            <div key={category}>
              <h3
                className="text-caption tracking-wider"
                style={{
                  color: 'var(--cc-mute)',
                  marginBottom: 'var(--cc-space-sm)',
                  fontWeight: 500,
                }}
              >
                {category}
              </h3>
              <ul className="space-y-1">
                {tutorials
                  .filter((t) => t.category === category)
                  .map((tutorial) => {
                    const isActive = pathname === tutorial.href;
                    return (
                      <li key={tutorial.href}>
                        <Link
                          href={tutorial.href}
                          className={`block text-body-sm transition-colors ${isActive ? 'sidebar-link-active' : 'sidebar-link'}`}
                          aria-current={isActive ? 'page' : undefined}
                          style={{
                            padding: 'var(--cc-space-xs) var(--cc-space-sm)',
                            borderRadius: 'var(--cc-radius-md)',
                            backgroundColor: isActive ? 'rgba(0, 112, 243, 0.1)' : 'transparent',
                            color: isActive ? 'var(--cc-link)' : 'var(--cc-body)',
                            fontWeight: isActive ? 500 : 400,
                          }}
                        >
                          {tutorial.label}
                          {tutorial.progress > 0 && tutorial.progress < 100 && (
                            <span
                              className="ml-auto text-xs font-mono"
                              style={{ color: 'var(--cc-link)' }}
                            >
                              {tutorial.progress}%
                            </span>
                          )}
                          {tutorial.progress === 100 && (
                            <Check
                              className="ml-auto h-3.5 w-3.5"
                              style={{ color: 'var(--cc-success)' }}
                              aria-hidden="true"
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>

        <div
          style={{
            marginTop: 'var(--cc-space-xl)',
            paddingTop: 'var(--cc-space-lg)',
            borderTop: '1px solid var(--cc-hairline)',
          }}
        >
          <a
            href="https://cinacoin.com"
            className="text-body-sm cc-link-hover"
            style={{ color: 'var(--cc-body)' }}
          >
            ← Back to CinaCoin
          </a>
        </div>
      </div>
    </aside>
  );
}
