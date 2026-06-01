import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'

export const metadata: Metadata = {
  title: 'Privacy Policy — Cinacoin',
  description: 'Cinacoin Privacy Policy — how we collect, use, and protect your data.',
  alternates: {
    canonical: '/privacy',
  },
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <FadeIn>
          <div className="mx-auto max-w-3xl px-6">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Privacy Policy
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
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              Cinacoin ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services, SDKs, and related infrastructure (collectively, the "Services").
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              We collect information that you provide directly to us and information collected automatically:
            </p>
            <ul className="text-zinc-400 leading-relaxed mb-8 list-disc pl-6 space-y-2">
              <li><strong className="text-zinc-200">Account Information:</strong> Email address, name, and organization details when you create an account.</li>
              <li><strong className="text-zinc-200">Usage Data:</strong> API usage metrics, request counts, and service interaction logs.</li>
              <li><strong className="text-zinc-200">Technical Data:</strong> IP addresses, browser type, operating system, and device information.</li>
              <li><strong className="text-zinc-200">Blockchain Data:</strong> Public wallet addresses and transaction hashes processed through our infrastructure (note: blockchain data is inherently public).</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              We use the collected information for the following purposes:
            </p>
            <ul className="text-zinc-400 leading-relaxed mb-8 list-disc pl-6 space-y-2">
              <li>Providing, maintaining, and improving our Services</li>
              <li>Processing transactions and sending related communications</li>
              <li>Monitoring usage patterns and analyzing performance</li>
              <li>Preventing fraud and ensuring security</li>
              <li>Complying with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mb-4">4. Self-Hosted Deployments</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              If you self-host Cinacoin infrastructure on your own servers, we do not collect or have access to data processed through your self-hosted instances. You are solely responsible for the data processed in your self-hosted environment.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              We do not sell your personal information. We may share information in the following circumstances:
            </p>
            <ul className="text-zinc-400 leading-relaxed mb-8 list-disc pl-6 space-y-2">
              <li>With service providers who assist in operating our Services</li>
              <li>To comply with applicable laws, regulations, or legal processes</li>
              <li>To protect the rights, property, or safety of Cinacoin or others</li>
              <li>In connection with a merger, acquisition, or sale of assets</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mb-4">6. Data Security</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">7. Data Retention</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              We retain your personal information for as long as necessary to provide our Services and fulfill the purposes described in this policy. You may request deletion of your account and associated personal data at any time.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">8. Your Rights</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Depending on your jurisdiction, you may have the right to:
            </p>
            <ul className="text-zinc-400 leading-relaxed mb-8 list-disc pl-6 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction or deletion of your data</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Data portability</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mb-4">9. Cookies</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              We use cookies and similar tracking technologies. For more information, please see our <a href="/cookies" className="text-blue-400 hover:text-blue-300 underline">Cookie Policy</a>.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">10. International Data Transfers</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers in accordance with applicable data protection laws.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">11. Children's Privacy</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              Our Services are not intended for individuals under the age of 16. We do not knowingly collect personal information from children.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">12. Changes to This Policy</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on this page and updating the "Last updated" date.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">13. Contact Us</h2>
            <p className="text-zinc-400 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at{' '}
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
