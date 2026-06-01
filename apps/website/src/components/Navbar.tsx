'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20)
  }, [])

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [handleScroll])

  // Close mobile menu on nav link click
  const closeMobile = () => setMobileOpen(false)

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500 ${
        scrolled
          ? 'border-white/[0.08] bg-[#050505]/90 backdrop-blur-xl shadow-lg shadow-black/20'
          : 'border-white/[0.06] bg-[#050505]/60 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4">
        <a href="/" className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-lg" aria-label="Cinacoin home">
          <Image
            src="/logo.png"
            alt="Cinacoin logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg"
            priority
            unoptimized
          />
          <span className="text-lg font-semibold tracking-tight">Cinacoin</span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          <a href="#products" className="text-sm text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded" aria-label="View products">Products</a>
          <a href="/pricing" className="text-sm text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded" aria-label="View pricing">Pricing</a>
          <a href="https://docs.cinacoin.com" className="text-sm text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded" aria-label="Read documentation">Docs</a>
          <a href="https://github.com/cinagroup" className="text-sm text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded" aria-label="View GitHub repository">GitHub</a>
        </div>

        {/* Desktop actions + mobile toggle */}
        <div className="flex items-center gap-3">
          <a
            href="https://dash.cinacoin.com"
            className="hidden text-sm text-zinc-400 transition-colors hover:text-white sm:inline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
            aria-label="Open dashboard"
          >
            Dashboard
          </a>
          <a
            href="#cta"
            className="hidden sm:inline rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label="Get started with Cinacoin"
          >
            Get Started
          </a>
          <button
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            className="md:hidden rounded-lg p-2 text-zinc-400 transition-colors hover:text-white"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t border-white/[0.06] bg-[#050505]/95 backdrop-blur-xl"
          role="dialog"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-1 px-6 py-4">
            <a href="/" onClick={closeMobile} className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" aria-label="Home">
              Home
            </a>
            <a href="#products" onClick={closeMobile} className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" aria-label="View products">
              Products
            </a>
            <a href="/pricing" onClick={closeMobile} className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" aria-label="View pricing">
              Pricing
            </a>
            <a href="/about" onClick={closeMobile} className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" aria-label="About Cinacoin">
              About
            </a>
            <a href="/changelog" onClick={closeMobile} className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" aria-label="View changelog">
              Changelog
            </a>
            <a href="/contact" onClick={closeMobile} className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" aria-label="Contact us">
              Contact
            </a>
            <a href="https://docs.cinacoin.com" className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" aria-label="Read documentation">
              Docs
            </a>
            <a href="https://github.com/cinagroup" className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" aria-label="View GitHub repository">
              GitHub
            </a>
            <a href="https://dash.cinacoin.com" className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" aria-label="Open dashboard">
              Dashboard
            </a>
            <a
              href="/contact"
              onClick={closeMobile}
              className="mt-2 rounded-full bg-white px-4 py-2.5 text-center text-sm font-medium text-black transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              aria-label="Get started with Cinacoin"
            >
              Get Started
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
