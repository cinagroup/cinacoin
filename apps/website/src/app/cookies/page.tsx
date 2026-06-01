import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'

export const metadata: Metadata = {
  title: 'Cookie Policy — Cinacoin',
  description: 'Cinacoin Cookie Policy — how we use cookies and similar technologies.',
  alternates: {
    canonical: '/cookies',
  },
}

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <FadeIn>
          <div className="mx-auto max-w-3xl px-6">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Cookie Policy
            </h1>
            <p className="mt-4 text-zinc-400 text-lg">
              Last updated: June 1, 2026
            </p>
          </div>
        </FadeIn>
      </section>

      <section className="pb-20 sm:pb-32">
        <FadeIn>
          <div className="mx-auto max-w-3xl px-6 prose prose-invert prose-zinc">
            <h2 className="text-2xl font-bold text-white mb-4">1. What Are Cookies</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              Cookies are small text files stored on your device when you visit our website. They help us understand how you use our Services and improve your experience. Similar technologies include web beacons, pixels, and local storage.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Cookies</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              We use cookies and similar technologies for the following purposes:
            </p>

            <h3 className="text-xl font-semibold text-white mb-2 mt-6">Essential Cookies</h3>
            <p className="text-zinc-400 leading-relaxed mb-4">
              These cookies are necessary for the Services to function properly. They enable core features such as authentication, security, and session management.
            </p>
            <ul className="text-zinc-400 leading-relaxed mb-8 list-disc pl-6 space-y-2">
              <li>Authentication session tokens</li>
              <li>Security and fraud prevention</li>
              <li>Load balancing and performance</li>
              <li>CSRF protection</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-2 mt-6">Analytics Cookies</h3>
            <p className="text-zinc-400 leading-relaxed mb-4">
              These cookies help us understand how visitors interact with our Services by collecting and reporting information anonymously.
            </p>
            <ul className="text-zinc-400 leading-relaxed mb-8 list-disc pl-6 space-y-2">
              <li>Page views and navigation patterns</li>
              <li>Feature usage statistics</li>
              <li>Error tracking and performance monitoring</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-2 mt-6">Preference Cookies</h3>
            <p className="text-zinc-400 leading-relaxed mb-4">
              These cookies remember your choices and settings to enhance your experience.
            </p>
            <ul className="text-zinc-400 leading-relaxed mb-8 list-disc pl-6 space-y-2">
              <li>Language and theme preferences</li>
              <li>UI customization settings</li>
              <li>Consent management choices</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mb-4">3. Third-Party Cookies</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              We may use third-party services that set their own cookies. These include:
            </p>
            <ul className="text-zinc-400 leading-relaxed mb-8 list-disc pl-6 space-y-2">
              <li><strong className="text-zinc-200">Cloudflare:</strong> Security and performance optimization</li>
              <li><strong className="text-zinc-200">GitHub:</strong> When you interact with our repositories</li>
              <li><strong className="text-zinc-200">Analytics providers:</strong> Usage statistics and performance monitoring</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mb-4">4. Self-Hosted Deployments</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              If you self-host Cinacoin infrastructure, cookies are set by your own instance and are subject to your own cookie policy. We do not collect or process cookies from self-hosted deployments.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">5. Managing Cookies</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              You can control cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul className="text-zinc-400 leading-relaxed mb-8 list-disc pl-6 space-y-2">
              <li>View and delete existing cookies</li>
              <li>Block all cookies or third-party cookies</li>
              <li>Receive notifications when cookies are set</li>
              <li>Automatically clear cookies on browser exit</li>
            </ul>
            <p className="text-zinc-400 leading-relaxed mb-8">
              Please note that disabling certain cookies may affect the functionality of our Services.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">6. Cookie Duration</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Cookies have different lifespans:
            </p>
            <ul className="text-zinc-400 leading-relaxed mb-8 list-disc pl-6 space-y-2">
              <li><strong className="text-zinc-200">Session cookies:</strong> Deleted when you close your browser</li>
              <li><strong className="text-zinc-200">Persistent cookies:</strong> Remain on your device for a specified period (typically 30 days to 1 year)</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mb-4">7. Updates to This Policy</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              We may update this Cookie Policy periodically. Changes will be posted on this page with an updated "Last updated" date.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">8. Contact Us</h2>
            <p className="text-zinc-400 leading-relaxed">
              If you have questions about our use of cookies, please contact us at{' '}
              <a href="/contact" className="text-blue-400 hover:text-blue-300 underline">
                our Contact page
              </a>.
            </p>
          </div>
        </FadeIn>
      </section>

      <Footer />
    </main>
  )
}
