import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#fafafa]">
      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-[64px] font-semibold mb-6 tracking-tight text-[#171717] leading-[1.05]">
          About CinaCoin
        </h1>
        <p className="text-lg text-[#4d4d4d] max-w-2xl mx-auto leading-relaxed">
          Building the infrastructure for the next generation of finance.
        </p>
      </section>

      {/* Mission */}
      <section className="max-w-[1200px] mx-auto px-6 pb-16">
        <div className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h2 className="text-[24px] font-semibold mb-4 text-[#171717]">Our Mission</h2>
          <p className="text-[#4d4d4d] text-[16px] leading-relaxed mb-4">
            CinaCoin was founded with a simple belief: digital currency should be fast, secure, and accessible to everyone. We&apos;re building the infrastructure to make that a reality.
          </p>
          <p className="text-[#4d4d4d] text-[16px] leading-relaxed">
            Our team of engineers, researchers, and designers is dedicated to pushing the boundaries of blockchain technology while maintaining the simplicity that makes it useful.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-[1200px] mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '100K+', label: 'Transactions/sec' },
            { value: '50+', label: 'Global Regions' },
            { value: '<1s', label: 'Finality' },
            { value: '99.99%', label: 'Uptime' },
          ].map((stat) => (
            <div key={stat.label} className="p-6 bg-white border border-[#ebebeb] rounded-[8px] text-center">
              <div className="text-[32px] font-semibold text-[#171717] mb-1">{stat.value}</div>
              <div className="text-[14px] text-[#888888]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="max-w-[1200px] mx-auto px-6 pb-24">
        <div className="p-8 bg-white border border-[#ebebeb] rounded-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h2 className="text-[24px] font-semibold mb-4 text-[#171717]">Get in Touch</h2>
          <p className="text-[#4d4d4d] text-[14px] leading-relaxed mb-6">
            Have questions or want to partner with us? We&apos;d love to hear from you.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/resources" className="inline-flex items-center justify-center px-4 py-2 bg-[#171717] hover:bg-[#000] text-white rounded-[6px] font-medium text-[14px] transition-colors duration-150 h-10">
              Contact Us
            </Link>
            <Link href="/developers" className="inline-flex items-center justify-center px-4 py-2 border border-[#ebebeb] hover:border-[#a1a1a1] rounded-[6px] font-medium text-[14px] transition-colors duration-150 text-[#171717] bg-white h-10">
              Join Community
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
