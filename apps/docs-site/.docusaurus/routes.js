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
    component: ComponentCreator('/docs/', 'd7c'),
    routes: [
      {
        path: '/docs/',
        component: ComponentCreator('/docs/', 'bcb'),
        routes: [
          {
            path: '/docs/',
            component: ComponentCreator('/docs/', '752'),
            routes: [
              {
                path: '/docs/api/aa-sdk',
                component: ComponentCreator('/docs/api/aa-sdk', '4ef'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/adapter-bitcoin',
                component: ComponentCreator('/docs/api/adapter-bitcoin', 'b63'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/adapter-cosmos',
                component: ComponentCreator('/docs/api/adapter-cosmos', '122'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/adapter-hedera',
                component: ComponentCreator('/docs/api/adapter-hedera', '4ce'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/adapter-near',
                component: ComponentCreator('/docs/api/adapter-near', '836'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/adapter-starknet',
                component: ComponentCreator('/docs/api/adapter-starknet', '16d'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/adapter-sui',
                component: ComponentCreator('/docs/api/adapter-sui', '063'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/adapter-xrpl',
                component: ComponentCreator('/docs/api/adapter-xrpl', '0c3'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/analytics',
                component: ComponentCreator('/docs/api/analytics', '1c6'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/android-kotlin',
                component: ComponentCreator('/docs/api/android-kotlin', '57d'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/angular',
                component: ComponentCreator('/docs/api/angular', '3ae'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/appkit',
                component: ComponentCreator('/docs/api/appkit', 'ca4'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/auth',
                component: ComponentCreator('/docs/api/auth', 'fd6'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/authentication',
                component: ComponentCreator('/docs/api/authentication', '52f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/batch-transaction',
                component: ComponentCreator('/docs/api/batch-transaction', 'ef1'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/blockchain-api',
                component: ComponentCreator('/docs/api/blockchain-api', 'af9'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/bundler',
                component: ComponentCreator('/docs/api/bundler', 'f0a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/cdn',
                component: ComponentCreator('/docs/api/cdn', 'e9a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/cinacoin-i18n',
                component: ComponentCreator('/docs/api/cinacoin-i18n', 'c02'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/cinacoin-ui-theme',
                component: ComponentCreator('/docs/api/cinacoin-ui-theme', 'edf'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/cli',
                component: ComponentCreator('/docs/api/cli', '99f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/codemod',
                component: ComponentCreator('/docs/api/codemod', '545'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/config',
                component: ComponentCreator('/docs/api/config', '6e5'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/core-sdk',
                component: ComponentCreator('/docs/api/core-sdk', '4e1'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/core-ui',
                component: ComponentCreator('/docs/api/core-ui', '11e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/cross-chain-sync',
                component: ComponentCreator('/docs/api/cross-chain-sync', '280'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/custom-connectors',
                component: ComponentCreator('/docs/api/custom-connectors', 'b40'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/deposit',
                component: ComponentCreator('/docs/api/deposit', 'b69'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/design-tokens',
                component: ComponentCreator('/docs/api/design-tokens', '681'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/dotnet',
                component: ComponentCreator('/docs/api/dotnet', 'f5e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/embedded-wallet',
                component: ComponentCreator('/docs/api/embedded-wallet', '01a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/ens-resolver',
                component: ComponentCreator('/docs/api/ens-resolver', '5e1'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/erc6492',
                component: ComponentCreator('/docs/api/erc6492', '5c0'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/errors',
                component: ComponentCreator('/docs/api/errors', '3a7'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/explorer',
                component: ComponentCreator('/docs/api/explorer', '688'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/farcaster-miniapp',
                component: ComponentCreator('/docs/api/farcaster-miniapp', '82c'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/flutter-dart',
                component: ComponentCreator('/docs/api/flutter-dart', 'f12'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/gas-estimator',
                component: ComponentCreator('/docs/api/gas-estimator', '23c'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/gas-sponsorship',
                component: ComponentCreator('/docs/api/gas-sponsorship', 'da7'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/i18n',
                component: ComponentCreator('/docs/api/i18n', 'a52'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/ios-swift',
                component: ComponentCreator('/docs/api/ios-swift', 'e5e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/keys',
                component: ComponentCreator('/docs/api/keys', '847'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/keys-server',
                component: ComponentCreator('/docs/api/keys-server', '60f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/kyc',
                component: ComponentCreator('/docs/api/kyc', '0c3'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/multiwallet',
                component: ComponentCreator('/docs/api/multiwallet', '7fb'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/next',
                component: ComponentCreator('/docs/api/next', '4ec'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/notify-server',
                component: ComponentCreator('/docs/api/notify-server', '326'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/nuxt',
                component: ComponentCreator('/docs/api/nuxt', 'b45'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/onramp-sdk',
                component: ComponentCreator('/docs/api/onramp-sdk', '283'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/overview',
                component: ComponentCreator('/docs/api/overview', '3c0'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/passkey-auth',
                component: ComponentCreator('/docs/api/passkey-auth', 'bac'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/pay-ui',
                component: ComponentCreator('/docs/api/pay-ui', 'e8b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/paymaster',
                component: ComponentCreator('/docs/api/paymaster', '3bb'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/payment-flow',
                component: ComponentCreator('/docs/api/payment-flow', '607'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/performance-utils',
                component: ComponentCreator('/docs/api/performance-utils', '96b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/push',
                component: ComponentCreator('/docs/api/push', '811'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/push-server',
                component: ComponentCreator('/docs/api/push-server', '63a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/rate-limiting',
                component: ComponentCreator('/docs/api/rate-limiting', 'fee'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/react',
                component: ComponentCreator('/docs/api/react', '864'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/react-native',
                component: ComponentCreator('/docs/api/react-native', 'e26'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/relay',
                component: ComponentCreator('/docs/api/relay', '246'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/relay-server',
                component: ComponentCreator('/docs/api/relay-server', '3b6'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/rpc',
                component: ComponentCreator('/docs/api/rpc', '585'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/rpc-proxy',
                component: ComponentCreator('/docs/api/rpc-proxy', '3a4'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/safe-decoder',
                component: ComponentCreator('/docs/api/safe-decoder', '104'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/session-keys',
                component: ComponentCreator('/docs/api/session-keys', 'f0b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/siwe',
                component: ComponentCreator('/docs/api/siwe', 'd2e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/siwx',
                component: ComponentCreator('/docs/api/siwx', 'efd'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/social-login',
                component: ComponentCreator('/docs/api/social-login', 'f61'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/svelte',
                component: ComponentCreator('/docs/api/svelte', 'f8b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/swap-sdk',
                component: ComponentCreator('/docs/api/swap-sdk', 'c65'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/telegram-miniapp',
                component: ComponentCreator('/docs/api/telegram-miniapp', '6b1'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/testing',
                component: ComponentCreator('/docs/api/testing', '276'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/token-list',
                component: ComponentCreator('/docs/api/token-list', 'eea'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/travel-rule-demo',
                component: ComponentCreator('/docs/api/travel-rule-demo', '787'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/ui-theme',
                component: ComponentCreator('/docs/api/ui-theme', '55f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/unity-csharp',
                component: ComponentCreator('/docs/api/unity-csharp', '266'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/vue',
                component: ComponentCreator('/docs/api/vue', '0ad'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/wallet-buttons',
                component: ComponentCreator('/docs/api/wallet-buttons', 'd67'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/wallet-recommender',
                component: ComponentCreator('/docs/api/wallet-recommender', 'afe'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/wallet-recovery',
                component: ComponentCreator('/docs/api/wallet-recovery', 'b1a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/api/walletconnect-v2',
                component: ComponentCreator('/docs/api/walletconnect-v2', '467'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/docs/framework/react',
                component: ComponentCreator('/docs/framework/react', 'a4c'),
                exact: true
              },
              {
                path: '/docs/guide',
                component: ComponentCreator('/docs/guide', '0bf'),
                exact: true
              },
              {
                path: '/docs/guide/configuration',
                component: ComponentCreator('/docs/guide/configuration', 'e94'),
                exact: true
              },
              {
                path: '/docs/guide/installation',
                component: ComponentCreator('/docs/guide/installation', '4ff'),
                exact: true
              },
              {
                path: '/docs/guide/migrate-from-reown',
                component: ComponentCreator('/docs/guide/migrate-from-reown', '908'),
                exact: true
              },
              {
                path: '/docs/guide/quick-start',
                component: ComponentCreator('/docs/guide/quick-start', '9fc'),
                exact: true
              },
              {
                path: '/docs/guide/troubleshooting',
                component: ComponentCreator('/docs/guide/troubleshooting', 'a89'),
                exact: true
              },
              {
                path: '/docs/',
                component: ComponentCreator('/docs/', '8e5'),
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
