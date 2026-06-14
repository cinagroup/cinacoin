import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CookiesContent from './CookiesContent'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'Cinacoin Cookie Policy — how we use cookies and similar technologies.',
  alternates: {
    canonical: '/cookies',
  },
}

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
      <Navbar />
      <CookiesContent />
      <Footer />
    </main>
  )
}
