'use client'

import FadeIn from '@/components/FadeIn'

export default function Footer() {
  const columns = [
    {
      title: 'Products',
      links: ['AppKit', 'Auth', 'Relay', 'Push', 'Keys', 'RPC Proxy'],
    },
    {
      title: 'Developers',
      links: ['Documentation', 'API Reference', 'SDKs', 'Examples', 'Changelog'],
    },
    {
      title: 'Company',
      links: ['About', 'Blog', 'Careers', 'Press'],
    },
    {
      title: 'Legal',
      links: ['Privacy', 'Terms', 'Cookie Policy'],
    },
  ];

  return (
    <footer className="border-t border-white/[0.06] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 md:grid-cols-5">
          {/* Brand */}
          <FadeIn direction="up" duration={600}>
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500" />
                <span className="text-base font-semibold">Cinacoin</span>
              </div>
              <p className="mt-4 text-sm text-zinc-500">
                Onchain access, simplified.
              </p>
            </div>
          </FadeIn>

          {/* Links */}
          {columns.map((col, ci) => (
            <FadeIn key={col.title} delay={100 + ci * 80} direction="up" duration={600}>
              <div>
                <h4 className="mb-4 text-sm font-medium text-zinc-300">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-zinc-500 transition-colors hover:text-white">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Bottom */}
        <FadeIn delay={500} direction="up">
          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 md:flex-row">
            <p className="text-xs text-zinc-600">
              © {new Date().getFullYear()} Cinacoin. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="https://twitter.com/cinacoin" className="text-zinc-600 transition-colors hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href="https://github.com/cinagroup" className="text-zinc-600 transition-colors hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              </a>
              <a href="https://discord.gg/cinacoin" className="text-zinc-600 transition-colors hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.8 19.8 0 00-4.89-1.52.07.07 0 00-.08.04c-.21.38-.44.87-.61 1.25a18.36 18.36 0 00-5.49 0c-.17-.39-.4-.87-.62-1.25a.07.07 0 00-.08-.04 19.8 19.8 0 00-4.88 1.52.07.07 0 00-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 00.03.06 19.9 19.9 0 006 3.03.08.08 0 00.08-.03c.46-.63.87-1.3 1.23-1.99a.08.08 0 00-.04-.11c-.65-.25-1.28-.55-1.88-.9a.08.08 0 01-.01-.13l.37-.29a.07.07 0 01.08-.01c3.93 1.8 8.18 1.8 12.07 0a.07.07 0 01.08.01c.12.1.25.2.37.29a.08.08 0 01-.01.13c-.6.35-1.23.65-1.88.9a.08.08 0 00-.04.11c.36.7.77 1.36 1.23 1.99a.08.08 0 00.08.03 19.9 19.9 0 006-3.03.08.08 0 00.03-.06c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 00-.03-.03zM8.02 15.33c-1.18 0-2.16-1.09-2.16-2.42s.95-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.42-2.16 2.42zm7.97 0c-1.18 0-2.16-1.09-2.16-2.42s.95-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.42-2.16 2.42z" /></svg>
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </footer>
  );
}
