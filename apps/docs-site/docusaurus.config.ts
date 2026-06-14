import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Cinacoin',
  tagline: 'Onchain access, simplified.',
  favicon: 'img/logo.svg',
  url: 'https://cinacoin.com',
  baseUrl: '/',
  trailingSlash: false,
  organizationName: 'cinagroup',
  projectName: 'cinacoin',
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  i18n: { defaultLocale: 'en', locales: ['en', 'zh', 'ja'] },

  // Meta tags + font loading
  headTags: [
    {
      tagName: 'meta',
      attributes: { name: 'theme-color', content: '#000000' },
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
    // ── SEO: Open Graph & Twitter ──
    {
      tagName: 'meta',
      attributes: { property: 'og:title', content: 'Cinacoin — Onchain UX Toolkit Documentation' },
    },
    {
      tagName: 'meta',
      attributes: { property: 'og:description', content: 'Self-hosted wallet connection toolkit. Complete API reference, guides, and SDK documentation for building onchain applications.' },
    },
    {
      tagName: 'meta',
      attributes: { property: 'og:url', content: 'https://cinacoin.com/' },
    },
    {
      tagName: 'meta',
      attributes: { property: 'og:image', content: 'https://cinacoin.com/img/og-image.png' },
    },
    {
      tagName: 'meta',
      attributes: { property: 'og:locale', content: 'en_US' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'twitter:site', content: '@cinacoin' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'twitter:creator', content: '@cinacoin' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'twitter:title', content: 'Cinacoin — Onchain UX Toolkit Documentation' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'twitter:description', content: 'Self-hosted wallet connection toolkit. Complete API reference, guides, and SDK documentation.' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'twitter:image', content: 'https://cinacoin.com/img/og-image.png' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'keywords', content: 'cinacoin, coin, wallet, web3, blockchain, dapp, walletconnect, eip-6963, erc-4337, smart accounts, defi, sdk' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'author', content: 'Cinacoin Team' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'msapplication-TileColor', content: '#000000' },
    },
    // ── Geist font loaded via @fontsource packages (see package.json) ──
    // Fonts are imported in custom.css to ensure Geist is used per design system
    // DNS prefetch for GitHub (edit links, source code)
    {
      tagName: 'link',
      attributes: {
        rel: 'dns-prefetch',
        href: 'https://github.com',
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
    blog: false,
    theme: { customCss: './src/css/custom.css' },
    sitemap: {
      changefreq: 'weekly',
      priority: 0.5,
    },
  } satisfies Preset.Options]],

  plugins: [
    // Local search (works offline, no external dependencies)
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      /** @type {import('@easyops-cn/docusaurus-search-local').PluginOptions} */
      ({
        hashed: true,
        indexBlog: false,
        docsRouteBasePath: '/',
        searchResultLimits: 8,
        searchResultContextMaxLength: 50,
        explicitSearchResultPath: true,
        searchBarShortcut: true,
        searchBarShortcutHint: true,
        indexPages: true,
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
      }),
    ],
    // PWA support with offline access
    [
      '@docusaurus/plugin-pwa',
      {
        debug: process.env.NODE_ENV === 'development',
        offlineModeActivationStrategies: [
          'appInstalled',
          'standalone',
          'queryString',
        ],
        pwaHead: [
          {
            tagName: 'link',
            attributes: {
              rel: 'icon',
              href: '/img/logo.svg',
            },
          },
          {
            tagName: 'link',
            attributes: {
              rel: 'manifest',
              href: '/manifest.json',
            },
          },
          {
            tagName: 'meta',
            attributes: {
              name: 'theme-color',
              content: '#000000',
            },
          },
          {
            tagName: 'meta',
            attributes: {
              name: 'apple-mobile-web-app-capable',
              content: 'yes',
            },
          },
          {
            tagName: 'meta',
            attributes: {
              name: 'apple-mobile-web-app-status-bar-style',
              content: '#000000',
            },
          },
          {
            tagName: 'link',
            attributes: {
              rel: 'apple-touch-icon',
              href: '/img/logo.svg',
            },
          },
        ],
      },
    ],
  ],

  themeConfig: {
    image: 'img/logo.svg',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Cinacoin',
      logo: { alt: 'Cinacoin', src: 'img/logo.svg', width: 24, height: 24 },
      items: [
        { href: 'https://cinacoin.com', label: 'Home', position: 'left', target: '_self' },
        { type: 'docSidebar', sidebarId: 'guideSidebar', position: 'left', label: 'Docs' },
        { type: 'docSidebar', sidebarId: 'apiSidebar', position: 'left', label: 'API' },
        { type: 'localeDropdown', position: 'right' },
        { href: 'https://github.com/cinagroup/cinacoin', label: 'GitHub', position: 'right', className: 'navbar-github-link' },
      ],
    },
    footer: {
      style: 'dark',
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
    <span>Cinacoin</span>
  </div>
  <span class="footer-bottom-copyright">&copy; ${new Date().getFullYear()} Cinacoin. All rights reserved.</span>
</div>`,
    },
    prism: {
      theme: prismThemes.nightOwl,
      darkTheme: prismThemes.nightOwl,
      additionalLanguages: ['bash', 'json', 'typescript', 'javascript', 'tsx'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
