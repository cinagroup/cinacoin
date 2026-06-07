import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/blog',
    component: ComponentCreator('/blog', '98b'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', 'f11'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '102'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', 'aa5'),
            routes: [
              {
                path: '/api/aa-sdk',
                component: ComponentCreator('/api/aa-sdk', 'd03'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/adapter-bitcoin',
                component: ComponentCreator('/api/adapter-bitcoin', '316'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/adapter-cosmos',
                component: ComponentCreator('/api/adapter-cosmos', '75a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/adapter-hedera',
                component: ComponentCreator('/api/adapter-hedera', '16d'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/adapter-near',
                component: ComponentCreator('/api/adapter-near', '3cd'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/adapter-starknet',
                component: ComponentCreator('/api/adapter-starknet', '7cb'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/adapter-sui',
                component: ComponentCreator('/api/adapter-sui', 'b5b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/adapter-xrpl',
                component: ComponentCreator('/api/adapter-xrpl', 'a53'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/analytics',
                component: ComponentCreator('/api/analytics', '84d'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/android-kotlin',
                component: ComponentCreator('/api/android-kotlin', '821'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/angular',
                component: ComponentCreator('/api/angular', '0d6'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/appkit',
                component: ComponentCreator('/api/appkit', '3e7'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/auth',
                component: ComponentCreator('/api/auth', '63e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/batch-transaction',
                component: ComponentCreator('/api/batch-transaction', '839'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/blockchain-api',
                component: ComponentCreator('/api/blockchain-api', '021'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/bundler',
                component: ComponentCreator('/api/bundler', '333'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/cdn',
                component: ComponentCreator('/api/cdn', 'ff6'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/cinacoin-i18n',
                component: ComponentCreator('/api/cinacoin-i18n', '129'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/cinacoin-ui-theme',
                component: ComponentCreator('/api/cinacoin-ui-theme', 'f6a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/cli',
                component: ComponentCreator('/api/cli', '1f3'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/codemod',
                component: ComponentCreator('/api/codemod', '374'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/config',
                component: ComponentCreator('/api/config', 'a1c'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/core-sdk',
                component: ComponentCreator('/api/core-sdk', 'e47'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/core-ui',
                component: ComponentCreator('/api/core-ui', '8c4'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/cross-chain-sync',
                component: ComponentCreator('/api/cross-chain-sync', 'eff'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/custom-connectors',
                component: ComponentCreator('/api/custom-connectors', '150'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/deposit',
                component: ComponentCreator('/api/deposit', '636'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/design-tokens',
                component: ComponentCreator('/api/design-tokens', '2bd'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/dotnet',
                component: ComponentCreator('/api/dotnet', 'ee2'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/embedded-wallet',
                component: ComponentCreator('/api/embedded-wallet', '21b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/ens-resolver',
                component: ComponentCreator('/api/ens-resolver', 'f37'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/erc6492',
                component: ComponentCreator('/api/erc6492', '134'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/explorer',
                component: ComponentCreator('/api/explorer', '73a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/farcaster-miniapp',
                component: ComponentCreator('/api/farcaster-miniapp', 'fe3'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/flutter-dart',
                component: ComponentCreator('/api/flutter-dart', 'f2b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/gas-estimator',
                component: ComponentCreator('/api/gas-estimator', '545'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/gas-sponsorship',
                component: ComponentCreator('/api/gas-sponsorship', '006'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/i18n',
                component: ComponentCreator('/api/i18n', '6ea'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/ios-swift',
                component: ComponentCreator('/api/ios-swift', 'a15'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/keys',
                component: ComponentCreator('/api/keys', 'd8c'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/keys-server',
                component: ComponentCreator('/api/keys-server', '5a1'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/kyc',
                component: ComponentCreator('/api/kyc', '0c8'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/multiwallet',
                component: ComponentCreator('/api/multiwallet', 'cb7'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/next',
                component: ComponentCreator('/api/next', 'a1d'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/notify-server',
                component: ComponentCreator('/api/notify-server', 'e22'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/nuxt',
                component: ComponentCreator('/api/nuxt', '00d'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/onramp-sdk',
                component: ComponentCreator('/api/onramp-sdk', '8b2'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/passkey-auth',
                component: ComponentCreator('/api/passkey-auth', '92b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/pay-ui',
                component: ComponentCreator('/api/pay-ui', '027'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/paymaster',
                component: ComponentCreator('/api/paymaster', 'b7c'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/payment-flow',
                component: ComponentCreator('/api/payment-flow', '8eb'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/performance-utils',
                component: ComponentCreator('/api/performance-utils', 'e48'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/push',
                component: ComponentCreator('/api/push', '223'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/push-server',
                component: ComponentCreator('/api/push-server', 'cfe'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/react',
                component: ComponentCreator('/api/react', 'e9e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/react-native',
                component: ComponentCreator('/api/react-native', '851'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/relay',
                component: ComponentCreator('/api/relay', '19e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/relay-server',
                component: ComponentCreator('/api/relay-server', '1b1'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/rpc',
                component: ComponentCreator('/api/rpc', '5df'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/rpc-proxy',
                component: ComponentCreator('/api/rpc-proxy', '006'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/safe-decoder',
                component: ComponentCreator('/api/safe-decoder', 'dc9'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/session-keys',
                component: ComponentCreator('/api/session-keys', '661'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/siwe',
                component: ComponentCreator('/api/siwe', '70a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/siwx',
                component: ComponentCreator('/api/siwx', 'f29'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/social-login',
                component: ComponentCreator('/api/social-login', '905'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/svelte',
                component: ComponentCreator('/api/svelte', '0b1'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/swap-sdk',
                component: ComponentCreator('/api/swap-sdk', 'fe5'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/telegram-miniapp',
                component: ComponentCreator('/api/telegram-miniapp', '64a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/testing',
                component: ComponentCreator('/api/testing', '329'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/token-list',
                component: ComponentCreator('/api/token-list', '435'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/travel-rule-demo',
                component: ComponentCreator('/api/travel-rule-demo', 'f81'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/ui-theme',
                component: ComponentCreator('/api/ui-theme', 'a5e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/unity-csharp',
                component: ComponentCreator('/api/unity-csharp', '68f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/vue',
                component: ComponentCreator('/api/vue', 'a64'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/wallet-buttons',
                component: ComponentCreator('/api/wallet-buttons', '821'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/wallet-recommender',
                component: ComponentCreator('/api/wallet-recommender', 'b53'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/wallet-recovery',
                component: ComponentCreator('/api/wallet-recovery', 'c73'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/walletconnect-v2',
                component: ComponentCreator('/api/walletconnect-v2', '39b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/framework/react',
                component: ComponentCreator('/framework/react', 'cf7'),
                exact: true,
                sidebar: "frameworkSidebar"
              },
              {
                path: '/guide/',
                component: ComponentCreator('/guide/', '7ab'),
                exact: true,
                sidebar: "guideSidebar"
              },
              {
                path: '/guide/configuration',
                component: ComponentCreator('/guide/configuration', '3a1'),
                exact: true,
                sidebar: "guideSidebar"
              },
              {
                path: '/guide/installation',
                component: ComponentCreator('/guide/installation', '0e9'),
                exact: true,
                sidebar: "guideSidebar"
              },
              {
                path: '/guide/migrate-from-reown',
                component: ComponentCreator('/guide/migrate-from-reown', '532'),
                exact: true,
                sidebar: "guideSidebar"
              },
              {
                path: '/guide/quick-start',
                component: ComponentCreator('/guide/quick-start', '3f1'),
                exact: true,
                sidebar: "guideSidebar"
              },
              {
                path: '/guide/troubleshooting',
                component: ComponentCreator('/guide/troubleshooting', 'a4e'),
                exact: true,
                sidebar: "guideSidebar"
              },
              {
                path: '/',
                component: ComponentCreator('/', '422'),
                exact: true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
