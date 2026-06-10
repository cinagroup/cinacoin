import Link from 'next/link';
import { NewsletterForm } from './NewsletterForm';

const footerLinks = {
  Product: [
    { label: 'Overview', href: '/products' },
    { label: 'Wallet', href: '/products#wallet' },
    { label: 'Exchange', href: '/products#exchange' },
    { label: 'Staking', href: '/products#staking' },
  ],
  Solutions: [
    { label: 'Enterprise', href: '/solutions#enterprise' },
    { label: 'DeFi', href: '/solutions#defi' },
    { label: 'Payments', href: '/solutions#payments' },
  ],
  Developers: [
    { label: 'Documentation', href: '/developers' },
    { label: 'API Reference', href: '/developers#api' },
    { label: 'SDKs', href: '/developers#sdks' },
    { label: 'GitHub', href: '/developers#github' },
  ],
  Resources: [
    { label: 'Blog', href: '/resources' },
    { label: 'Whitepaper', href: '/resources#whitepaper' },
    { label: 'Community', href: '/resources#community' },
    { label: 'Support', href: '/resources#support' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/about#careers' },
    { label: 'Contact', href: '/about#contact' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[var(--cc-canvas-soft)] border-t border-[var(--cc-hairline)]">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        {/* Footer Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-caption font-medium text-[var(--cc-muted)] uppercase tracking-wider mb-4">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-body-sm text-[var(--cc-body)] hover:text-[var(--cc-ink)] transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter in Footer */}
        <div className="mb-12 pb-12 border-b border-[var(--cc-hairline)]">
          <div className="max-w-md mx-auto text-center">
            <h4 className="text-body-sm font-semibold text-[var(--cc-ink)] mb-2">Stay Updated</h4>
            <p className="text-caption text-[var(--cc-muted)] mb-4">Get the latest news and updates</p>
            <NewsletterForm source="footer" />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--cc-hairline)] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[var(--cc-ink)] font-semibold text-body-sm">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="6" fill="currentColor"/>
              <text x="16" y="22" fontFamily="Inter,system-ui,sans-serif" fontSize="18" fontWeight="600" fill="var(--cc-canvas)" textAnchor="middle">C</text>
            </svg>
            CinaCoin
          </div>
          <p className="text-caption text-[var(--cc-muted)]">
            &copy; {new Date().getFullYear()} CinaCoin. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
