import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PricingContent from './PricingContent'

export const metadata: Metadata = {
  title: 'Pricing — Cinacoin',
  description:
    'Transparent, usage-based pricing for Cinacoin. Free tier for developers, scalable plans for teams and enterprises.',
  alternates: {
    canonical: '/pricing',
  },
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
      <Navbar />
      <div id="main-content">
      <PricingContent />
      </div>
      <Footer />
    </main>
  )
}
