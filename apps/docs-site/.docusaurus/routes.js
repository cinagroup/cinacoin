import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docs/api-reference',
    component: ComponentCreator('/docs/api-reference', '44b'),
    exact: true
  },
  {
    path: '/docs/search',
    component: ComponentCreator('/docs/search', 'b58'),
    exact: true
  },
  {
    path: '/docs/',
    component: ComponentCreator('/docs/', 'd4e'),
    routes: [
      {
        path: '/docs/',
        component: ComponentCreator('/docs/', '4d4'),
        routes: [
          {
            path: '/docs/',
            component: ComponentCreator('/docs/', 'f6a'),
            routes: [
              {
                path: '/docs/api/aa-sdk',
                component: ComponentCreator('/docs/api/aa-sdk', '745'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/adapter-bitcoin',
                component: ComponentCreator('/docs/api/adapter-bitcoin', '29e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/adapter-cosmos',
                component: ComponentCreator('/docs/api/adapter-cosmos', 'd87'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/adapter-hedera',
                component: ComponentCreator('/docs/api/adapter-hedera', 'd04'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/adapter-near',
                component: ComponentCreator('/docs/api/adapter-near', '4bf'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/adapter-starknet',
                component: ComponentCreator('/docs/api/adapter-starknet', '745'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/adapter-sui',
                component: ComponentCreator('/docs/api/adapter-sui', '55e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/adapter-xrpl',
                component: ComponentCreator('/docs/api/adapter-xrpl', '252'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/analytics',
                component: ComponentCreator('/docs/api/analytics', 'b3f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/android-kotlin',
                component: ComponentCreator('/docs/api/android-kotlin', 'b1a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/angular',
                component: ComponentCreator('/docs/api/angular', '539'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/appkit',
                component: ComponentCreator('/docs/api/appkit', 'a0e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/auth',
                component: ComponentCreator('/docs/api/auth', 'b97'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/authentication',
                component: ComponentCreator('/docs/api/authentication', 'daf'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/batch-transaction',
                component: ComponentCreator('/docs/api/batch-transaction', 'fe1'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/blockchain-api',
                component: ComponentCreator('/docs/api/blockchain-api', 'a3d'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/bundler',
                component: ComponentCreator('/docs/api/bundler', 'c57'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/cdn',
                component: ComponentCreator('/docs/api/cdn', '066'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/cinacoin-i18n',
                component: ComponentCreator('/docs/api/cinacoin-i18n', '609'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/cinacoin-ui-theme',
                component: ComponentCreator('/docs/api/cinacoin-ui-theme', '5c0'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/cli',
                component: ComponentCreator('/docs/api/cli', 'fb0'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/codemod',
                component: ComponentCreator('/docs/api/codemod', 'a5d'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/config',
                component: ComponentCreator('/docs/api/config', 'c30'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/core-sdk',
                component: ComponentCreator('/docs/api/core-sdk', '2bc'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/core-ui',
                component: ComponentCreator('/docs/api/core-ui', '377'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/cross-chain-sync',
                component: ComponentCreator('/docs/api/cross-chain-sync', '574'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/custom-connectors',
                component: ComponentCreator('/docs/api/custom-connectors', '00f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/deposit',
                component: ComponentCreator('/docs/api/deposit', '4b9'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/design-tokens',
                component: ComponentCreator('/docs/api/design-tokens', '97b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/dotnet',
                component: ComponentCreator('/docs/api/dotnet', '943'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/embedded-wallet',
                component: ComponentCreator('/docs/api/embedded-wallet', '330'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/ens-resolver',
                component: ComponentCreator('/docs/api/ens-resolver', '179'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/erc6492',
                component: ComponentCreator('/docs/api/erc6492', '655'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors',
                component: ComponentCreator('/docs/api/errors', '8b3'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/explorer',
                component: ComponentCreator('/docs/api/explorer', '5c8'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/farcaster-miniapp',
                component: ComponentCreator('/docs/api/farcaster-miniapp', 'eef'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/flutter-dart',
                component: ComponentCreator('/docs/api/flutter-dart', 'ecf'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/gas-estimator',
                component: ComponentCreator('/docs/api/gas-estimator', '29f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/gas-sponsorship',
                component: ComponentCreator('/docs/api/gas-sponsorship', 'cfe'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/i18n',
                component: ComponentCreator('/docs/api/i18n', '2a3'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/ios-swift',
                component: ComponentCreator('/docs/api/ios-swift', 'd4b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/keys',
                component: ComponentCreator('/docs/api/keys', '402'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/keys-server',
                component: ComponentCreator('/docs/api/keys-server', '1f2'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/kyc',
                component: ComponentCreator('/docs/api/kyc', '141'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/multiwallet',
                component: ComponentCreator('/docs/api/multiwallet', '738'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/next',
                component: ComponentCreator('/docs/api/next', '029'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/notify-server',
                component: ComponentCreator('/docs/api/notify-server', '5b6'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/nuxt',
                component: ComponentCreator('/docs/api/nuxt', '798'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/onramp-sdk',
                component: ComponentCreator('/docs/api/onramp-sdk', '19c'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/overview',
                component: ComponentCreator('/docs/api/overview', '69c'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/passkey-auth',
                component: ComponentCreator('/docs/api/passkey-auth', 'e15'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/pay-ui',
                component: ComponentCreator('/docs/api/pay-ui', '10a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/paymaster',
                component: ComponentCreator('/docs/api/paymaster', '78d'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/payment-flow',
                component: ComponentCreator('/docs/api/payment-flow', '905'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/performance-utils',
                component: ComponentCreator('/docs/api/performance-utils', '641'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/push',
                component: ComponentCreator('/docs/api/push', '61a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/push-server',
                component: ComponentCreator('/docs/api/push-server', '51a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/rate-limiting',
                component: ComponentCreator('/docs/api/rate-limiting', '1b6'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/react',
                component: ComponentCreator('/docs/api/react', 'eae'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/react-native',
                component: ComponentCreator('/docs/api/react-native', '777'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/relay',
                component: ComponentCreator('/docs/api/relay', '564'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/relay-server',
                component: ComponentCreator('/docs/api/relay-server', 'a28'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/rpc',
                component: ComponentCreator('/docs/api/rpc', '5b7'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/rpc-proxy',
                component: ComponentCreator('/docs/api/rpc-proxy', '03c'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/safe-decoder',
                component: ComponentCreator('/docs/api/safe-decoder', '399'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/session-keys',
                component: ComponentCreator('/docs/api/session-keys', 'e2a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/siwe',
                component: ComponentCreator('/docs/api/siwe', 'afd'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/siwx',
                component: ComponentCreator('/docs/api/siwx', '876'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/social-login',
                component: ComponentCreator('/docs/api/social-login', 'e9e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/svelte',
                component: ComponentCreator('/docs/api/svelte', 'd6d'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/swap-sdk',
                component: ComponentCreator('/docs/api/swap-sdk', '7cd'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/telegram-miniapp',
                component: ComponentCreator('/docs/api/telegram-miniapp', 'eca'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/testing',
                component: ComponentCreator('/docs/api/testing', '248'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/token-list',
                component: ComponentCreator('/docs/api/token-list', 'd20'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/travel-rule-demo',
                component: ComponentCreator('/docs/api/travel-rule-demo', 'd3b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/ui-theme',
                component: ComponentCreator('/docs/api/ui-theme', '20a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/unity-csharp',
                component: ComponentCreator('/docs/api/unity-csharp', 'e51'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/vue',
                component: ComponentCreator('/docs/api/vue', '14d'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/wallet-buttons',
                component: ComponentCreator('/docs/api/wallet-buttons', '7b4'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/wallet-recommender',
                component: ComponentCreator('/docs/api/wallet-recommender', 'e4a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/wallet-recovery',
                component: ComponentCreator('/docs/api/wallet-recovery', 'cfa'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/walletconnect-v2',
                component: ComponentCreator('/docs/api/walletconnect-v2', '73d'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/framework/react',
                component: ComponentCreator('/docs/framework/react', 'c33'),
                exact: true
              },
              {
                path: '/docs/guide',
                component: ComponentCreator('/docs/guide', '774'),
                exact: true
              },
              {
                path: '/docs/guide/configuration',
                component: ComponentCreator('/docs/guide/configuration', '406'),
                exact: true
              },
              {
                path: '/docs/guide/installation',
                component: ComponentCreator('/docs/guide/installation', '74c'),
                exact: true
              },
              {
                path: '/docs/guide/migrate-from-reown',
                component: ComponentCreator('/docs/guide/migrate-from-reown', '32e'),
                exact: true
              },
              {
                path: '/docs/guide/quick-start',
                component: ComponentCreator('/docs/guide/quick-start', '1c6'),
                exact: true
              },
              {
                path: '/docs/guide/troubleshooting',
                component: ComponentCreator('/docs/guide/troubleshooting', '1b1'),
                exact: true
              },
              {
                path: '/docs/',
                component: ComponentCreator('/docs/', '527'),
                exact: true,
                sidebar: "guideSidebar"
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
