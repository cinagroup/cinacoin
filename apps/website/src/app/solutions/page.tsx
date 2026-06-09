'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useI18n } from '@/providers/I18nProvider';

export default function SolutionsPage() {
  const { t } = useI18n();

  const solutions = [
    {
      id: 'enterprise',
      titleKey: 'solutions-enterprise-title',
      descKey: 'solutions-enterprise-desc',
      features: ['solutions-enterprise-f1', 'solutions-enterprise-f2', 'solutions-enterprise-f3', 'solutions-enterprise-f4'],
    },
    {
      id: 'defi',
      titleKey: 'solutions-defi-title',
      descKey: 'solutions-defi-desc',
      features: ['solutions-defi-f1', 'solutions-defi-f2', 'solutions-defi-f3', 'solutions-defi-f4'],
    },
    {
      id: 'payments',
      titleKey: 'solutions-payments-title',
      descKey: 'solutions-payments-desc',
      features: ['solutions-payments-f1', 'solutions-payments-f2', 'solutions-payments-f3', 'solutions-payments-f4'],
    },
    {
      id: 'performance',
      titleKey: 'solutions-performance-title',
      descKey: 'solutions-performance-desc',
      features: ['solutions-performance-f1', 'solutions-performance-f2', 'solutions-performance-f3', 'solutions-performance-f4'],
    },
    {
      id: 'security',
      titleKey: 'solutions-security-title',
      descKey: 'solutions-security-desc',
      features: ['solutions-security-f1', 'solutions-security-f2', 'solutions-security-f3', 'solutions-security-f4'],
    },
    {
      id: 'scale',
      titleKey: 'solutions-scale-title',
      descKey: 'solutions-scale-desc',
      features: ['solutions-scale-f1', 'solutions-scale-f2', 'solutions-scale-f3', 'solutions-scale-f4'],
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--cc-canvas-soft)] text-[var(--cc-ink)]">
      <Navbar />
      <Breadcrumbs />
      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-[64px] font-semibold mb-6 tracking-tight text-[#171717] leading-[1.05]">
          {t('solutions-hero-title')}
        </h1>
        <p className="text-lg text-[#4d4d4d] max-w-2xl mx-auto leading-relaxed">
          {t('solutions-hero-subtitle')}
        </p>
      </section>

      {/* Solutions Grid */}
      <section className="max-w-[1200px] mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((solution) => (
            <div key={solution.id} id={solution.id} className="p-6 bg-white border border-[#ebebeb] rounded-[8px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200">
              <h2 className="text-[20px] font-semibold mb-2 text-[#171717]">{t(solution.titleKey)}</h2>
              <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-4">{t(solution.descKey)}</p>
              <ul className="space-y-2">
                {solution.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[14px] text-[#4d4d4d]">
                    <span className="text-[#0070f3]">✓</span> {t(f)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#f5f5f5] border-y border-[#ebebeb]">
        <div className="max-w-[1200px] mx-auto px-6 py-16 text-center">
          <h2 className="text-[32px] font-semibold mb-4 tracking-tight text-[#171717]">
            {t('solutions-cta-title')}
          </h2>
          <p className="text-[#4d4d4d] text-lg mb-8 max-w-xl mx-auto">
            {t('solutions-cta-subtitle')}
          </p>
          <Link href="/about" className="inline-flex items-center justify-center px-8 py-3 bg-[#171717] hover:bg-[#2a2a2a] text-white rounded-[6px] font-medium text-[14px] transition-colors duration-150 h-10">
            {t('solutions-cta-btn')}
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
