import { defineConfig } from 'vitepress'

const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  title: 'Cinacoin',
  description: 'Onchain Access, Simplified — Self-hosted Wallet Connection Toolkit',
  base: '/',
  lang: 'en',
  lastUpdated: true,
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#3B82F6' }],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en',
    },
    zh: {
      label: '中文',
      lang: 'zh-CN',
    },
  },

  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'Cinacoin',

    nav: [
      { text: 'Guide', link: '/guide/quick-start' },
      { text: 'API', link: '/api/core-sdk' },
      { text: 'Examples', link: '/api/react' },
    ],

    sidebar: [
      // ─── Getting Started ───
      {
        text: '🚀 Getting Started',
        items: [
          { text: 'Quick Start', link: '/guide/quick-start' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Configuration', link: '/guide/configuration' },
          { text: 'Migrate from Reown', link: '/guide/migrate-from-reown' },
          { text: 'Troubleshooting', link: '/guide/troubleshooting' },
        ],
      },

      // ─── Core SDK ───
      {
        text: '📦 Core SDK',
        items: [
          { text: 'Core SDK', link: '/api/core-sdk' },
          { text: 'Config', link: '/api/config' },
          { text: 'Performance Utils', link: '/api/performance-utils' },
          { text: 'Testing', link: '/api/testing' },
        ],
      },

      // ─── Framework Adapters ───
      {
        text: '⚛️ Framework Adapters',
        items: [
          { text: 'React', link: '/api/react' },
          { text: 'Vue', link: '/api/vue' },
          { text: 'Svelte', link: '/api/svelte' },
          { text: 'Next.js', link: '/api/next' },
          { text: 'Nuxt', link: '/api/nuxt' },
          { text: 'Angular', link: '/api/angular' },
          { text: 'React Native', link: '/api/react-native' },
        ],
      },

      // ─── Mobile & Native ───
      {
        text: '📱 Mobile & Native',
        items: [
          { text: 'iOS Swift', link: '/api/ios-swift' },
          { text: 'Android Kotlin', link: '/api/android-kotlin' },
          { text: 'Flutter Dart', link: '/api/flutter-dart' },
          { text: '.NET C#', link: '/api/dotnet' },
          { text: 'Unity C#', link: '/api/unity-csharp' },
        ],
      },

      // ─── UI & Theming ───
      {
        text: '🎨 UI & Theming',
        items: [
          { text: 'Core UI', link: '/api/core-ui' },
          { text: 'UI Theme', link: '/api/ui-theme' },
          { text: 'Cinacoin UI Theme', link: '/api/cinacoin-ui-theme' },
          { text: 'Design Tokens', link: '/api/design-tokens' },
          { text: 'Pay UI', link: '/api/pay-ui' },
          { text: 'Wallet Buttons', link: '/api/wallet-buttons' },
        ],
      },

      // ─── Account Abstraction (ERC-4337) ───
      {
        text: '🔐 Account Abstraction',
        items: [
          { text: 'AA SDK', link: '/api/aa-sdk' },
          { text: 'Bundler', link: '/api/bundler' },
          { text: 'Paymaster', link: '/api/paymaster' },
          { text: 'Session Keys', link: '/api/session-keys' },
          { text: 'ERC-6492', link: '/api/erc6492' },
          { text: 'Gas Sponsorship', link: '/api/gas-sponsorship' },
          { text: 'Safe Decoder', link: '/api/safe-decoder' },
        ],
      },

      // ─── Authentication ───
      {
        text: '🔑 Authentication',
        items: [
          { text: 'SIWE', link: '/api/siwe' },
          { text: 'SIWX', link: '/api/siwx' },
          { text: 'Passkey Auth', link: '/api/passkey-auth' },
          { text: 'Social Login', link: '/api/social-login' },
        ],
      },

      // ─── Wallet Management ───
      {
        text: '👛 Wallet Management',
        items: [
          { text: 'Embedded Wallet', link: '/api/embedded-wallet' },
          { text: 'Multiwallet', link: '/api/multiwallet' },
          { text: 'Wallet Recovery', link: '/api/wallet-recovery' },
          { text: 'WalletConnect V2', link: '/api/walletconnect-v2' },
          { text: 'Custom Connectors', link: '/api/custom-connectors' },
          { text: 'Wallet Recommender', link: '/api/wallet-recommender' },
        ],
      },

      // ─── Blockchain Adapters ───
      {
        text: '🌐 Blockchain Adapters',
        items: [
          { text: 'Bitcoin', link: '/api/adapter-bitcoin' },
          { text: 'Cosmos', link: '/api/adapter-cosmos' },
          { text: 'Hedera', link: '/api/adapter-hedera' },
          { text: 'NEAR', link: '/api/adapter-near' },
          { text: 'Starknet', link: '/api/adapter-starknet' },
          { text: 'Sui', link: '/api/adapter-sui' },
          { text: 'XRPL', link: '/api/adapter-xrpl' },
        ],
      },

      // ─── Payment & DeFi ───
      {
        text: '💰 Payment & DeFi',
        items: [
          { text: 'Swap SDK', link: '/api/swap-sdk' },
          { text: 'On-Ramp SDK', link: '/api/onramp-sdk' },
          { text: 'Payment Flow', link: '/api/payment-flow' },
          { text: 'Deposit', link: '/api/deposit' },
          { text: 'Cross-Chain Sync', link: '/api/cross-chain-sync' },
          { text: 'Batch Transaction', link: '/api/batch-transaction' },
          { text: 'Token List', link: '/api/token-list' },
          { text: 'ENS Resolver', link: '/api/ens-resolver' },
          { text: 'Gas Estimator', link: '/api/gas-estimator' },
          { text: 'KYC', link: '/api/kyc' },
        ],
      },

      // ─── Infrastructure ───
      {
        text: '🏗️ Infrastructure',
        items: [
          { text: 'AppKit', link: '/api/appkit' },
          { text: 'Auth', link: '/api/auth' },
          { text: 'Relay', link: '/api/relay' },
          { text: 'Push', link: '/api/push' },
          { text: 'Keys', link: '/api/keys' },
          { text: 'RPC', link: '/api/rpc' },
          { text: 'Relay Server', link: '/api/relay-server' },
          { text: 'RPC Proxy', link: '/api/rpc-proxy' },
          { text: 'Blockchain API', link: '/api/blockchain-api' },
          { text: 'Keys Server', link: '/api/keys-server' },
          { text: 'CDN', link: '/api/cdn' },
        ],
      },

      // ─── Servers & Services ───
      {
        text: '🖥️ Servers & Services',
        items: [
          { text: 'Notify Server', link: '/api/notify-server' },
          { text: 'Push Server', link: '/api/push-server' },
          { text: 'Explorer', link: '/api/explorer' },
          { text: 'CLI', link: '/api/cli' },
        ],
      },

      // ─── SDK & Utilities ───
      {
        text: '🔧 SDK & Utilities',
        items: [
          { text: 'Analytics', link: '/api/analytics' },
          { text: 'i18n', link: '/api/i18n' },
          { text: 'i18n React', link: '/api/cinacoin-i18n' },
        ],
      },

      // ─── Mini Apps ───
      {
        text: '📲 Mini Apps',
        items: [
          { text: 'Telegram Mini App', link: '/api/telegram-miniapp' },
          { text: 'Farcaster Mini App', link: '/api/farcaster-miniapp' },
        ],
      },

      // ─── Developer Tools ───
      {
        text: '🛠️ Developer Tools',
        items: [
          { text: 'Codemod', link: '/api/codemod' },
          { text: 'Travel Rule Demo', link: '/api/travel-rule-demo' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/cinagroup/cinacoin' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Cinacoin',
    },

    editLink: {
      pattern: 'https://github.com/cinagroup/cinacoin/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
      label: 'On this page',
    },

    lastUpdated: {
      text: 'Last updated',
    },

    docFooter: {
      prev: 'Previous page',
      next: 'Next page',
    },

    darkModeSwitchLabel: 'Appearance',
    lightModeSwitchTitle: 'Switch to light mode',
    darkModeSwitchTitle: 'Switch to dark mode',
    sidebarMenuLabel: 'Menu',
    returnToTopLabel: 'Return to top',
    langMenuLabel: 'Change language',
  },

  markdown: {
    lineNumbers: true,
  },
})
