import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Cinacoin',
  tagline: 'Onchain Access, Simplified',
  favicon: 'img/logo.svg',
  url: 'https://cinacoin.com',
  baseUrl: '/docs/',
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
      logo: { alt: 'Cinacoin', src: 'img/logo.svg' },
      items: [
        { type: 'docSidebar', sidebarId: 'guideSidebar', position: 'left', label: 'Guide' },
        { type: 'docSidebar', sidebarId: 'apiSidebar', position: 'left', label: 'API' },
        { href: 'https://github.com/cinagroup/cinacoin', label: 'GitHub', position: 'right', className: 'navbar-github-link' },
      ],
    },
    footer: {
      style: 'light',
      links: [
        { title: 'Docs', items: [
          { label: 'Quick Start', to: '/guide/quick-start' },
          { label: 'API', to: '/api/core-sdk' },
        ]},
        { title: 'More', items: [
          { label: 'Cinacoin', href: 'https://cinacoin.com' },
        ]},
      ],
      copyright: `© ${new Date().getFullYear()} Cinacoin`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
