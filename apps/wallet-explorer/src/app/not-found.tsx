"use client";

import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas-soft text-ink">
      <main className="flex-1 flex items-center justify-center py-24">
        <div className="flex flex-col items-center justify-center text-center">
          <h1 className="text-display text-ink mb-4">404</h1>
          <p className="text-body-lg text-body mb-8 max-w-md">
            Page not found. The wallet explorer page you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/" className="cc-btn-primary">
            ← Back to Wallet Explorer
          </Link>
        </div>
      </main>

      <footer className="border-t border-hairline bg-canvas py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-12 justify-between">
            <div className="max-w-[280px] flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="CinaCoin" width={20} height={20} className="h-5 w-auto" />
                <span className="text-body-sm font-medium text-ink">CinaCoin</span>
              </div>
              <p className="text-body-sm text-mute">
                Discover wallets for every chain and platform.
              </p>
            </div>
            <div className="flex flex-wrap gap-12">
              <div>
                <p className="caption text-mute mb-3">EXPLORER</p>
                <Link href="/" className="block text-body-sm py-1 text-body hover:text-ink">All wallets</Link>
                <Link href="/tokens" className="block text-body-sm py-1 text-body hover:text-ink">Tokens</Link>
              </div>
              <div>
                <p className="caption text-mute mb-3">DEVELOPERS</p>
                <a href="https://github.com/cinagroup" className="block text-body-sm py-1 text-body hover:text-ink">GitHub</a>
                <a href="https://demo.cinacoin.com" className="block text-body-sm py-1 text-body hover:text-ink">Demo</a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-hairline">
            <p className="caption text-mute">
              © {new Date().getFullYear()} CinaCoin. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
