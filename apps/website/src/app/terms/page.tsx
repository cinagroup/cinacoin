import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import FadeIn from '@/components/FadeIn'

export const metadata: Metadata = {
  title: 'Terms of Service — Cinacoin',
  description: 'Cinacoin Terms of Service — rules and guidelines for using our Services.',
  alternates: {
    canonical: '/terms',
  },
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <FadeIn>
          <div className="mx-auto max-w-3xl px-6">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Terms of Service
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
            <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              These Terms of Service ("Terms") constitute a legally binding agreement between you and Cinacoin ("we," "our," or "us") governing your use of our services, SDKs, APIs, and related infrastructure (collectively, the "Services"). By accessing or using the Services, you agree to be bound by these Terms.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">2. Description of Services</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Cinacoin provides:
            </p>
            <ul className="text-zinc-400 leading-relaxed mb-8 list-disc pl-6 space-y-2">
              <li>SDKs and APIs for wallet connectivity and blockchain interaction</li>
              <li>Authentication services (SIWE, SIWX, passkey auth)</li>
              <li>Cross-chain routing and transaction infrastructure</li>
              <li>Developer tools, dashboards, and documentation</li>
              <li>Self-hosted infrastructure components</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mb-4">3. Open Source Software</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              Cinacoin SDKs and tools are provided under the MIT License. You are free to use, modify, and distribute the open source components in accordance with the license terms. Contributions to our open source projects are governed by our Contributor License Agreement.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">4. Acceptable Use</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              You agree not to use the Services to:
            </p>
            <ul className="text-zinc-400 leading-relaxed mb-8 list-disc pl-6 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Engage in fraudulent or deceptive activities</li>
              <li>Interfere with or disrupt the Services or servers</li>
              <li>Attempt to gain unauthorized access to systems or data</li>
              <li>Use the Services for money laundering or terrorism financing</li>
              <li>Exploit vulnerabilities or security weaknesses</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mb-4">5. API Usage and Rate Limits</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              We may impose rate limits and usage quotas on API access. Free tier users are limited to 10,000 API calls per month. Exceeding these limits may result in throttling or suspension. Paid tiers offer higher limits as described in our <a href="/pricing" className="text-blue-400 hover:text-blue-300 underline">Pricing page</a>.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">6. Intellectual Property</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              Cinacoin retains all rights to its trademarks, logos, and branding. The open source components are licensed under the MIT License. You may not use our trademarks without prior written consent.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CINACOIN SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICES.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">9. Blockchain Risk Acknowledgment</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              You acknowledge that blockchain technology and cryptocurrency transactions involve inherent risks, including but not limited to smart contract vulnerabilities, network congestion, and price volatility. Cinacoin provides infrastructure tools but is not responsible for losses arising from blockchain operations.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">10. Self-Hosted Deployments</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              If you choose to self-host Cinacoin infrastructure, you are solely responsible for the operation, security, and compliance of your self-hosted instances. We provide the software but do not guarantee its performance in your environment.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">11. Termination</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              We may suspend or terminate your access to the Services at any time, with or without cause, including for violation of these Terms. Upon termination, your right to use the Services will immediately cease.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">12. Governing Law</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Cinacoin operates, without regard to conflict of law principles.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">13. Changes to Terms</h2>
            <p className="text-zinc-400 leading-relaxed mb-8">
              We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page. Continued use of the Services after such changes constitutes acceptance.
            </p>

            <h2 className="text-2xl font-bold text-white mb-4">14. Contact</h2>
            <p className="text-zinc-400 leading-relaxed">
              For questions about these Terms, please contact us at{' '}
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
