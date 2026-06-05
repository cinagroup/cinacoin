import type { Metadata } from 'next'
import AboutContent from './AboutContent'

export const metadata: Metadata = {
  title: 'About — Cinacoin',
  description:
    'Cinacoin is an open-source onchain access layer built by CINA Group. Self-hosted, zero vendor lock-in.',
  alternates: {
    canonical: '/about',
  },
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
      <AboutContent />
    </main>
  )
}
