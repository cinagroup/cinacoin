import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Page Not Found — Cinacoin',
  description: 'The page you are looking for does not exist.',
}

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
      <Navbar />
      <div id="main-content" className="flex flex-col items-center justify-center px-6 pt-40 pb-20 text-center">
        <p className="cc-caption-mono text-[var(--cc-link)] mb-4">404</p>
        <h1 className="cc-display-xl">Page not found.</h1>
        <p className="mt-6 cc-body-lg text-[var(--cc-body)] max-w-xl">
          The page you are looking for does not exist, or has been moved.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="cc-btn-primary">
            Go Home
          </Link>
          <a href="https://docs.cinacoin.com" className="cc-btn-secondary" target="_blank" rel="noopener noreferrer">
            View Docs
          </a>
        </div>
      </div>
      <Footer />
    </main>
  )
}
