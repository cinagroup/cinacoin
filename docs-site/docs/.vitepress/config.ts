import { defineConfig } from 'vitepress'

const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  title: 'Cinacoin',
  description: 'Onchain Access, Simplified — Self-hosted Wallet Connection Toolkit',
  // Served under cinacoin.com/docs via the consolidation router Worker
  // (Phase 3 Multi-Zone). VitePress `base` nests the built output under /docs/.
  base: '/docs/',
  lang: 'en',
  lastUpdated: true,
  cleanUrls: true,
  // Brand is a light, ink-on-near-white system (DESIGN.md) — force light.
  appearance: false,

  head: [
    ['link', { rel: 'icon', href: '/docs/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#171717', media: '(prefers-color-scheme: light)' }],
    ['meta', { name: 'theme-color', content: '#0a0a0a', media: '(prefers-color-scheme: dark)' }],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/quick-start' },
          { text: 'API', link: '/api/core-sdk' },
          { text: 'Examples', link: '/api/react' },
        ],
        sidebar: [
          {
            text: '🚀 Getting Started',
            items: [
              { text: 'Quick Start', link: '/guide/quick-start' },
              { text: 'Installation', link: '/guide/installation' },
              { text: 'Configuration', link: '/guide/configuration' },
              { text: 'Migrate from Cinacoin', link: '/guide/migrate-from-cinacoin' },
              { text: 'Troubleshooting', link: '/guide/troubleshooting' },
            ],
          },
          {
            text: '📦 Core SDK',
            items: [
              { text: 'Core SDK', link: '/api/core-sdk' },
              { text: 'Config', link: '/api/config' },
              { text: 'Performance Utils', link: '/api/performance-utils' },
              { text: 'Testing', link: '/api/testing' },
            ],
          },
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
          {
            text: '🔑 Authentication',
            items: [
              { text: 'SIWE', link: '/api/siwe' },
              { text: 'SIWX', link: '/api/siwx' },
              { text: 'Passkey Auth', link: '/api/passkey-auth' },
              { text: 'Social Login', link: '/api/social-login' },
            ],
          },
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
          {
            text: '🖥️ Servers & Services',
            items: [
              { text: 'Notify Server', link: '/api/notify-server' },
              { text: 'Push Server', link: '/api/push-server' },
              { text: 'Explorer', link: '/api/explorer' },
              { text: 'CLI', link: '/api/cli' },
            ],
          },
          {
            text: '🔧 SDK & Utilities',
            items: [
              { text: 'Analytics', link: '/api/analytics' },
              { text: 'i18n', link: '/api/i18n' },
              { text: 'i18n React', link: '/api/cinacoin-i18n' },
            ],
          },
          {
            text: '📲 Mini Apps',
            items: [
              { text: 'Telegram Mini App', link: '/api/telegram-miniapp' },
              { text: 'Farcaster Mini App', link: '/api/farcaster-miniapp' },
            ],
          },
          {
            text: '🛠️ Developer Tools',
            items: [
              { text: 'Codemod', link: '/api/codemod' },
              { text: 'Travel Rule Demo', link: '/api/travel-rule-demo' },
            ],
          },
        ],
      },
    },
    zh: {
      label: '中文',
      lang: 'zh-CN',
      themeConfig: {
        nav: [
          { text: '指南', link: '/guide/quick-start' },
          { text: 'API', link: '/api/core-sdk' },
          { text: '示例', link: '/api/react' },
        ],
        sidebar: [
          {
            text: '🚀 快速开始',
            items: [
              { text: '快速开始', link: '/guide/quick-start' },
              { text: '安装', link: '/guide/installation' },
              { text: '配置', link: '/guide/configuration' },
              { text: '从 Cinacoin 迁移', link: '/guide/migrate-from-cinacoin' },
              { text: '故障排除', link: '/guide/troubleshooting' },
            ],
          },
          {
            text: '📦 核心 SDK',
            items: [
              { text: '核心 SDK', link: '/api/core-sdk' },
              { text: '配置', link: '/api/config' },
              { text: '性能工具', link: '/api/performance-utils' },
              { text: '测试', link: '/api/testing' },
            ],
          },
          {
            text: '⚛️ 框架适配器',
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
          {
            text: '📱 移动端与原生',
            items: [
              { text: 'iOS Swift', link: '/api/ios-swift' },
              { text: 'Android Kotlin', link: '/api/android-kotlin' },
              { text: 'Flutter Dart', link: '/api/flutter-dart' },
              { text: '.NET C#', link: '/api/dotnet' },
              { text: 'Unity C#', link: '/api/unity-csharp' },
            ],
          },
          {
            text: '🎨 UI 与主题',
            items: [
              { text: '核心 UI', link: '/api/core-ui' },
              { text: 'UI 主题', link: '/api/ui-theme' },
              { text: 'Cinacoin UI 主题', link: '/api/cinacoin-ui-theme' },
              { text: '设计令牌', link: '/api/design-tokens' },
              { text: '支付 UI', link: '/api/pay-ui' },
              { text: '钱包按钮', link: '/api/wallet-buttons' },
            ],
          },
          {
            text: '🔐 账户抽象',
            items: [
              { text: 'AA SDK', link: '/api/aa-sdk' },
              { text: 'Bundler', link: '/api/bundler' },
              { text: 'Paymaster', link: '/api/paymaster' },
              { text: '会话密钥', link: '/api/session-keys' },
              { text: 'ERC-6492', link: '/api/erc6492' },
              { text: 'Gas 代付', link: '/api/gas-sponsorship' },
              { text: 'Safe 解码器', link: '/api/safe-decoder' },
            ],
          },
          {
            text: '🔑 认证',
            items: [
              { text: 'SIWE', link: '/api/siwe' },
              { text: 'SIWX', link: '/api/siwx' },
              { text: 'Passkey 认证', link: '/api/passkey-auth' },
              { text: '社交登录', link: '/api/social-login' },
            ],
          },
          {
            text: '👛 钱包管理',
            items: [
              { text: '内嵌钱包', link: '/api/embedded-wallet' },
              { text: '多钱包', link: '/api/multiwallet' },
              { text: '钱包恢复', link: '/api/wallet-recovery' },
              { text: 'WalletConnect V2', link: '/api/walletconnect-v2' },
              { text: '自定义连接器', link: '/api/custom-connectors' },
              { text: '钱包推荐', link: '/api/wallet-recommender' },
            ],
          },
          {
            text: '🌐 区块链适配器',
            items: [
              { text: '比特币', link: '/api/adapter-bitcoin' },
              { text: 'Cosmos', link: '/api/adapter-cosmos' },
              { text: 'Hedera', link: '/api/adapter-hedera' },
              { text: 'NEAR', link: '/api/adapter-near' },
              { text: 'Starknet', link: '/api/adapter-starknet' },
              { text: 'Sui', link: '/api/adapter-sui' },
              { text: 'XRPL', link: '/api/adapter-xrpl' },
            ],
          },
          {
            text: '💰 支付与 DeFi',
            items: [
              { text: 'Swap SDK', link: '/api/swap-sdk' },
              { text: '法币入金 SDK', link: '/api/onramp-sdk' },
              { text: '支付流程', link: '/api/payment-flow' },
              { text: '充值', link: '/api/deposit' },
              { text: '跨链同步', link: '/api/cross-chain-sync' },
              { text: '批量交易', link: '/api/batch-transaction' },
              { text: '代币列表', link: '/api/token-list' },
              { text: 'ENS 解析器', link: '/api/ens-resolver' },
              { text: 'Gas 估算器', link: '/api/gas-estimator' },
              { text: 'KYC', link: '/api/kyc' },
            ],
          },
          {
            text: '🏗️ 基础设施',
            items: [
              { text: 'AppKit', link: '/api/appkit' },
              { text: 'Auth', link: '/api/auth' },
              { text: 'Relay', link: '/api/relay' },
              { text: 'Push', link: '/api/push' },
              { text: 'Keys', link: '/api/keys' },
              { text: 'RPC', link: '/api/rpc' },
              { text: 'Relay 服务器', link: '/api/relay-server' },
              { text: 'RPC 代理', link: '/api/rpc-proxy' },
              { text: '区块链 API', link: '/api/blockchain-api' },
              { text: 'Keys 服务器', link: '/api/keys-server' },
              { text: 'CDN', link: '/api/cdn' },
            ],
          },
          {
            text: '🖥️ 服务器与服务',
            items: [
              { text: '通知服务器', link: '/api/notify-server' },
              { text: '推送服务器', link: '/api/push-server' },
              { text: '浏览器', link: '/api/explorer' },
              { text: 'CLI', link: '/api/cli' },
            ],
          },
          {
            text: '🔧 SDK 与工具',
            items: [
              { text: '分析', link: '/api/analytics' },
              { text: '国际化', link: '/api/i18n' },
              { text: '国际化 React', link: '/api/cinacoin-i18n' },
            ],
          },
          {
            text: '📲 小程序',
            items: [
              { text: 'Telegram 小程序', link: '/api/telegram-miniapp' },
              { text: 'Farcaster 小程序', link: '/api/farcaster-miniapp' },
            ],
          },
          {
            text: '🛠️ 开发者工具',
            items: [
              { text: 'Codemod', link: '/api/codemod' },
              { text: '旅行规则演示', link: '/api/travel-rule-demo' },
            ],
          },
        ],
      },
    },
  },

  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'Cinacoin',



    socialLinks: [
      { icon: 'github', link: 'https://github.com/cinagroup/cinacoin' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Cinacoin',
    },

    editLink: {
      pattern: 'https://github.com/cinagroup/cinacoin/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    colors: {
      primary: '#171717',
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
