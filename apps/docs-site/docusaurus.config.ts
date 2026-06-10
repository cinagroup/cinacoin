import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Cinacoin',
  tagline: 'Onchain Access, Simplified',
  favicon: 'img/logo.svg',
  url: 'https://cinacoin.com',
  baseUrl: '/docs/',
  trailingSlash: false,
  organizationName: 'cinagroup',
  projectName: 'cinacoin',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  i18n: { defaultLocale: 'en', locales: ['en'] },

  // Meta tags + font loading
  headTags: [
    {
      tagName: 'meta',
      attributes: { name: 'theme-color', content: '#ffffff' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'color-scheme', content: 'light dark' },
    },
    {
      tagName: 'meta',
      attributes: { property: 'og:type', content: 'website' },
    },
    {
      tagName: 'meta',
      attributes: { property: 'og:site_name', content: 'Cinacoin Docs' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'twitter:card', content: 'summary_large_image' },
    },
    // Google Fonts: Inter (Geist substitute) + JetBrains Mono (Geist Mono substitute)
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap',
      },
    },
  ],

  presets: [['classic', {
    docs: {
      sidebarPath: './sidebars.ts',
      editUrl: 'https://github.com/cinagroup/cinacoin/tree/main/docs-site/docs/',
      routeBasePath: '/',
      showLastUpdateTime: true,
    },
    theme: { customCss: './src/css/custom.css' },
  } satisfies Preset.Options]],

  themeConfig: {
    image: 'img/logo.svg',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Cinacoin',
      logo: { alt: 'Cinacoin', src: 'img/logo.svg', width: 24, height: 24 },
      items: [
        { href: 'https://cinacoin.com', label: 'Home', position: 'left', target: '_self' },
        { type: 'docSidebar', sidebarId: 'guideSidebar', position: 'left', label: 'Docs' },
        { type: 'docSidebar', sidebarId: 'apiSidebar', position: 'left', label: 'API' },
        { href: 'https://github.com/cinagroup/cinacoin', label: 'GitHub', position: 'right', className: 'navbar-github-link' },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Product',
          items: [
            { label: 'Overview', href: 'https://cinacoin.com/products' },
            { label: 'Wallet', href: 'https://cinacoin.com/products#wallet' },
            { label: 'Exchange', href: 'https://cinacoin.com/products#exchange' },
            { label: 'Staking', href: 'https://cinacoin.com/products#staking' },
          ],
        },
        {
          title: 'Solutions',
          items: [
            { label: 'Enterprise', href: 'https://cinacoin.com/solutions#enterprise' },
            { label: 'DeFi', href: 'https://cinacoin.com/solutions#defi' },
            { label: 'Payments', href: 'https://cinacoin.com/solutions#payments' },
          ],
        },
        {
          title: 'Developers',
          items: [
            { label: 'Documentation', to: '/' },
            { label: 'API Reference', to: '/api/core-sdk' },
            { label: 'SDKs', href: 'https://github.com/cinagroup/cinacoin' },
            { label: 'GitHub', href: 'https://github.com/cinagroup/cinacoin' },
          ],
        },
        {
          title: 'Resources',
          items: [
            { label: 'Blog', href: 'https://cinacoin.com/resources' },
            { label: 'Whitepaper', href: 'https://cinacoin.com/resources#whitepaper' },
            { label: 'Community', href: 'https://cinacoin.com/resources#community' },
            { label: 'Support', href: 'https://cinacoin.com/resources#support' },
          ],
        },
        {
          title: 'Company',
          items: [
            { label: 'About', href: 'https://cinacoin.com/about' },
            { label: 'Careers', href: 'https://cinacoin.com/about#careers' },
            { label: 'Contact', href: 'https://cinacoin.com/about#contact' },
          ],
        },
      ],
      copyright: `<div class="footer-newsletter">
  <h4>Stay Updated</h4>
  <p>Get the latest news and updates</p>
  <form class="footer-newsletter-form" onsubmit="event.preventDefault()">
    <input type="email" placeholder="Enter your email" aria-label="Email for newsletter" />
    <button type="submit">Subscribe</button>
  </form>
</div>
<div class="footer-bottom-bar">
  <div class="footer-bottom-logo">
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="6" fill="currentColor"/>
      <text x="16" y="22" font-family="Inter,system-ui,sans-serif" font-size="18" font-weight="600" fill="var(--ifm-background-color)" text-anchor="middle">C</text>
    </svg>
    <span>CinaCoin</span>
  </div>
  <span class="footer-bottom-copyright">&copy; ${new Date().getFullYear()} CinaCoin. All rights reserved.</span>
</div>`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
