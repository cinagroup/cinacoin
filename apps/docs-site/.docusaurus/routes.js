import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/api-reference',
    component: ComponentCreator('/api-reference', 'a8b'),
    exact: true
  },
  {
    path: '/search',
    component: ComponentCreator('/search', '822'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '847'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', 'd0d'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '52f'),
            routes: [
              {
                path: '/api/aa-sdk',
                component: ComponentCreator('/api/aa-sdk', '708'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/adapter-bitcoin',
                component: ComponentCreator('/api/adapter-bitcoin', 'd1a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/adapter-cosmos',
                component: ComponentCreator('/api/adapter-cosmos', 'a4c'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/adapter-hedera',
                component: ComponentCreator('/api/adapter-hedera', '417'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/adapter-near',
                component: ComponentCreator('/api/adapter-near', '59d'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/adapter-starknet',
                component: ComponentCreator('/api/adapter-starknet', '862'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/adapter-sui',
                component: ComponentCreator('/api/adapter-sui', '490'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/adapter-xrpl',
                component: ComponentCreator('/api/adapter-xrpl', 'da3'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/analytics',
                component: ComponentCreator('/api/analytics', '7f3'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/android-kotlin',
                component: ComponentCreator('/api/android-kotlin', '397'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/angular',
                component: ComponentCreator('/api/angular', '222'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/appkit',
                component: ComponentCreator('/api/appkit', '36f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/auth',
                component: ComponentCreator('/api/auth', 'ced'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/authentication',
                component: ComponentCreator('/api/authentication', '07a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/batch-transaction',
                component: ComponentCreator('/api/batch-transaction', '055'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/blockchain-api',
                component: ComponentCreator('/api/blockchain-api', '4c1'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/bundler',
                component: ComponentCreator('/api/bundler', '8c5'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/cdn',
                component: ComponentCreator('/api/cdn', '7c3'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/cinacoin-i18n',
                component: ComponentCreator('/api/cinacoin-i18n', '645'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/cinacoin-ui-theme',
                component: ComponentCreator('/api/cinacoin-ui-theme', '217'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/cli',
                component: ComponentCreator('/api/cli', '3e2'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/codemod',
                component: ComponentCreator('/api/codemod', '451'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/config',
                component: ComponentCreator('/api/config', '2a6'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/core-sdk',
                component: ComponentCreator('/api/core-sdk', '3bd'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/core-ui',
                component: ComponentCreator('/api/core-ui', 'f0f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/cross-chain-sync',
                component: ComponentCreator('/api/cross-chain-sync', 'ab1'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/custom-connectors',
                component: ComponentCreator('/api/custom-connectors', '729'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/deposit',
                component: ComponentCreator('/api/deposit', '07f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/design-tokens',
                component: ComponentCreator('/api/design-tokens', '2dc'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/dotnet',
                component: ComponentCreator('/api/dotnet', '1ab'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/embedded-wallet',
                component: ComponentCreator('/api/embedded-wallet', '496'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/ens-resolver',
                component: ComponentCreator('/api/ens-resolver', '646'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/erc6492',
                component: ComponentCreator('/api/erc6492', '954'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/errors',
                component: ComponentCreator('/api/errors', '947'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/explorer',
                component: ComponentCreator('/api/explorer', '152'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/farcaster-miniapp',
                component: ComponentCreator('/api/farcaster-miniapp', '93e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/flutter-dart',
                component: ComponentCreator('/api/flutter-dart', '86d'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/gas-estimator',
                component: ComponentCreator('/api/gas-estimator', 'c2c'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/gas-sponsorship',
                component: ComponentCreator('/api/gas-sponsorship', '2e8'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/i18n',
                component: ComponentCreator('/api/i18n', 'f08'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/ios-swift',
                component: ComponentCreator('/api/ios-swift', '768'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/keys',
                component: ComponentCreator('/api/keys', '22e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/keys-server',
                component: ComponentCreator('/api/keys-server', 'e00'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/kyc',
                component: ComponentCreator('/api/kyc', 'a54'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/multiwallet',
                component: ComponentCreator('/api/multiwallet', 'eca'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/next',
                component: ComponentCreator('/api/next', '318'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/notify-server',
                component: ComponentCreator('/api/notify-server', '488'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/nuxt',
                component: ComponentCreator('/api/nuxt', '1ab'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/onramp-sdk',
                component: ComponentCreator('/api/onramp-sdk', 'fac'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/overview',
                component: ComponentCreator('/api/overview', '0ef'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/passkey-auth',
                component: ComponentCreator('/api/passkey-auth', '28e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/pay-ui',
                component: ComponentCreator('/api/pay-ui', 'c4a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/paymaster',
                component: ComponentCreator('/api/paymaster', '154'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/payment-flow',
                component: ComponentCreator('/api/payment-flow', 'b6a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/performance-utils',
                component: ComponentCreator('/api/performance-utils', 'c75'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/push',
                component: ComponentCreator('/api/push', '457'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/push-server',
                component: ComponentCreator('/api/push-server', 'ace'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/rate-limiting',
                component: ComponentCreator('/api/rate-limiting', 'e27'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/react',
                component: ComponentCreator('/api/react', 'c22'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/react-native',
                component: ComponentCreator('/api/react-native', 'eda'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/relay',
                component: ComponentCreator('/api/relay', 'fe6'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/relay-server',
                component: ComponentCreator('/api/relay-server', '46d'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/rpc',
                component: ComponentCreator('/api/rpc', 'b2f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/rpc-proxy',
                component: ComponentCreator('/api/rpc-proxy', 'e84'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/safe-decoder',
                component: ComponentCreator('/api/safe-decoder', '3e6'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/session-keys',
                component: ComponentCreator('/api/session-keys', '994'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/siwe',
                component: ComponentCreator('/api/siwe', 'f71'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/siwx',
                component: ComponentCreator('/api/siwx', 'b14'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/social-login',
                component: ComponentCreator('/api/social-login', '0d2'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/svelte',
                component: ComponentCreator('/api/svelte', '7ad'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/swap-sdk',
                component: ComponentCreator('/api/swap-sdk', 'f65'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/telegram-miniapp',
                component: ComponentCreator('/api/telegram-miniapp', 'bde'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/testing',
                component: ComponentCreator('/api/testing', '9b1'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/token-list',
                component: ComponentCreator('/api/token-list', '071'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/travel-rule-demo',
                component: ComponentCreator('/api/travel-rule-demo', 'af4'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/ui-theme',
                component: ComponentCreator('/api/ui-theme', 'b7b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/unity-csharp',
                component: ComponentCreator('/api/unity-csharp', '6fc'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/vue',
                component: ComponentCreator('/api/vue', 'dc8'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/wallet-buttons',
                component: ComponentCreator('/api/wallet-buttons', '2b5'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/wallet-recommender',
                component: ComponentCreator('/api/wallet-recommender', 'eb5'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/wallet-recovery',
                component: ComponentCreator('/api/wallet-recovery', 'f13'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/api/walletconnect-v2',
                component: ComponentCreator('/api/walletconnect-v2', '4f5'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/framework/react',
                component: ComponentCreator('/framework/react', '92e'),
                exact: true
              },
              {
                path: '/guide',
                component: ComponentCreator('/guide', '1e5'),
                exact: true
              },
              {
                path: '/guide/configuration',
                component: ComponentCreator('/guide/configuration', '036'),
                exact: true
              },
              {
                path: '/guide/installation',
                component: ComponentCreator('/guide/installation', '788'),
                exact: true
              },
              {
                path: '/guide/migrate-from-reown',
                component: ComponentCreator('/guide/migrate-from-reown', '033'),
                exact: true
              },
              {
                path: '/guide/quick-start',
                component: ComponentCreator('/guide/quick-start', 'a3d'),
                exact: true
              },
              {
                path: '/guide/troubleshooting',
                component: ComponentCreator('/guide/troubleshooting', 'b5e'),
                exact: true
              },
              {
                path: '/',
                component: ComponentCreator('/', '921'),
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
