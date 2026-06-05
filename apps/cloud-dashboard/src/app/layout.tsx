import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cinacoin Cloud Dashboard',
  description: 'Developer portal for Cinacoin — manage projects, API keys, and usage analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--cc-canvas)] text-[var(--cc-ink)] antialiased">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="hidden w-64 flex-shrink-0 border-r border-[var(--cc-hairline)] bg-[var(--cc-canvas-soft)]/50 md:block">
            <nav className="flex h-full flex-col p-4">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--cc-primary)] font-semibold text-[var(--cc-ink)]">
                  C
                </div>
                <div>
                  <div className="text-lg font-semibold tracking-tight">Cinacoin Cloud</div>
                  <div className="text-xs text-[var(--cc-muted)]">Developer Portal</div>
                </div>
              </div>
              <ul className="space-y-1">
                <NavItem href="/" label="Dashboard" icon="grid" />
                <NavItem href="/projects" label="Projects" icon="folder" />
                <NavItem href="/settings" label="Settings" icon="settings" />
              </ul>
            </nav>
          </aside>
          {/* Main content */}
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}

function NavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  const icons: Record<string, React.ReactNode> = {
    grid: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    folder: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    settings: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  };

  return (
    <li>
      <a
        href={href}
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--cc-body)] transition-colors hover:bg-[var(--cc-canvas-soft-2)] hover:text-[var(--cc-ink)]"
      >
        {icons[icon]}
        {label}
      </a>
    </li>
  );
}
