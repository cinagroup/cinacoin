"use client";

import { SiteHeader, SiteFooter } from "@cinacoin/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
      <SiteHeader
        logoSrc="/wallets/logo.svg"
        sublabel="Wallet Explorer"
        links={[
          { label: 'Docs', href: 'https://docs.cinacoin.com' },
          { label: '← Back to Cinacoin', href: 'https://cinacoin.com' },
        ]}
      />
      <main className="cc-container px-4 py-24 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="cc-display-xl text-[var(--cc-ink)] mb-4">404</h1>
          <p className="cc-body-lg text-[var(--cc-body)] mb-8 max-w-md">
            Page not found. The wallet explorer you&apos;re looking for doesn&apos;t exist.
          </p>
          <a
            href="/wallets"
            className="cc-btn-primary"
          >
            Back to Wallet Explorer
          </a>
        </div>
      </main>
      <SiteFooter
        logoSrc="/wallets/logo.svg"
        tagline="Discover 100+ wallets for every chain and platform."
        columns={[
          {
            heading: 'Explorer',
            links: [
              { label: 'All wallets', href: 'https://wallet.cinacoin.com' },
              { label: 'Docs', href: 'https://docs.cinacoin.com' },
            ],
          },
          {
            heading: 'Developers',
            links: [
              { label: 'GitHub', href: 'https://github.com/cinagroup' },
              { label: 'Demo', href: 'https://demo.cinacoin.com' },
            ],
          },
          {
            heading: 'Company',
            links: [{ label: 'Back to Cinacoin', href: 'https://cinacoin.com' }],
          },
        ]}
      />
    </div>
  );
}
