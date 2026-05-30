import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Logos from '@/components/Logos'
import Features from '@/components/Features'
import Stats from '@/components/Stats'
import Products from '@/components/Products'
import Developers from '@/components/Developers'
import CTA from '@/components/CTA'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Cinacoin — Onchain Access, Simplified',
  description: 'The onchain access layer for wallets, dApps, and chains. Connect, authenticate, and transact across 100+ blockchains.',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-hidden">
      <Navbar />
      <Hero />
      <Logos />
      <Features />
      <Stats />
      <Products />
      <Developers />
      <CTA />
      <Footer />
    </main>
  )
}
