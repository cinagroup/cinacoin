import type { Metadata } from 'next'
import ChangelogContent from './ChangelogContent'

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Release history and updates for Cinacoin SDK and infrastructure.',
  alternates: {
    canonical: '/changelog',
  },
}

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
      <ChangelogContent />
    </main>
  )
}
