'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LanguageToggle } from '@/providers';
import { ThemeToggle } from './ThemeToggle';

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
      <div style={{ padding: 'var(--cc-lg)' }}>
        <Link href="/" className="block" style={{ marginBottom: 'var(--cc-xl)' }}>
          <div className="text-display-md" style={{ color: 'var(--cc-link)' }}>
            Cinacoin
          </div>
          <p className="text-body-sm" style={{ color: 'var(--cc-body)' }}>
            Learn platform
          </p>
        </Link>

        <nav className="space-y-6">
          {['Fundamentals', 'Advanced'].map((category) => (
            <div key={category}>
              <h3
                className="cc-mono text-caption tracking-wider"
                style={{
                  color: 'var(--cc-muted)',
                  marginBottom: 'var(--cc-sm)',
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
                            padding: 'var(--cc-xs) var(--cc-sm)',
                            borderRadius: 'var(--cc-radius-md)',
                            backgroundColor: isActive ? 'var(--cc-link-bg-soft)' : 'transparent',
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
            marginTop: 'var(--cc-xl)',
            paddingTop: 'var(--cc-lg)',
            borderTop: '1px solid var(--cc-hairline)',
          }}
        >
          <div style={{ marginBottom: 'var(--cc-md)', display: 'flex', alignItems: 'center', gap: 'var(--cc-sm)' }}>
            <ThemeToggle />
            <LanguageToggle />
          </div>
          <a
            href="https://cinacoin.com"
            className="text-body-sm cc-link-hover"
            style={{ color: 'var(--cc-body)' }}
          >
            ← Back to Cinacoin
          </a>
        </div>
      </div>
    </aside>
  );
}
