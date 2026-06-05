import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import TermsContent from './TermsContent'

export const metadata: Metadata = {
  title: 'Terms of Service — Cinacoin',
  description: 'Cinacoin Terms of Service — rules and guidelines for using our Services.',
  alternates: {
    canonical: '/terms',
  },
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
      <Navbar />
      <TermsContent />
      <Footer />
    </main>
  )
}
