import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/ja/api-reference',
    component: ComponentCreator('/ja/api-reference', 'a33'),
    exact: true
  },
  {
    path: '/ja/search',
    component: ComponentCreator('/ja/search', 'a50'),
    exact: true
  },
  {
    path: '/ja/',
    component: ComponentCreator('/ja/', 'c11'),
    routes: [
      {
        path: '/ja/',
        component: ComponentCreator('/ja/', '2d1'),
        routes: [
          {
            path: '/ja/',
            component: ComponentCreator('/ja/', 'dad'),
            routes: [
              {
                path: '/ja/api/aa-sdk',
                component: ComponentCreator('/ja/api/aa-sdk', '1d0'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/adapter-bitcoin',
                component: ComponentCreator('/ja/api/adapter-bitcoin', 'a46'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/adapter-cosmos',
                component: ComponentCreator('/ja/api/adapter-cosmos', 'c41'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/adapter-hedera',
                component: ComponentCreator('/ja/api/adapter-hedera', 'ced'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/adapter-near',
                component: ComponentCreator('/ja/api/adapter-near', '41b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/adapter-starknet',
                component: ComponentCreator('/ja/api/adapter-starknet', 'f36'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/adapter-sui',
                component: ComponentCreator('/ja/api/adapter-sui', '93e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/adapter-xrpl',
                component: ComponentCreator('/ja/api/adapter-xrpl', 'a58'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/analytics',
                component: ComponentCreator('/ja/api/analytics', '760'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/android-kotlin',
                component: ComponentCreator('/ja/api/android-kotlin', '001'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/angular',
                component: ComponentCreator('/ja/api/angular', '04e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/appkit',
                component: ComponentCreator('/ja/api/appkit', '8c1'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/auth',
                component: ComponentCreator('/ja/api/auth', 'e6f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/authentication',
                component: ComponentCreator('/ja/api/authentication', 'f4b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/batch-transaction',
                component: ComponentCreator('/ja/api/batch-transaction', '58a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/blockchain-api',
                component: ComponentCreator('/ja/api/blockchain-api', 'c55'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/bundler',
                component: ComponentCreator('/ja/api/bundler', '842'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/cdn',
                component: ComponentCreator('/ja/api/cdn', 'c07'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/cinacoin-i18n',
                component: ComponentCreator('/ja/api/cinacoin-i18n', 'ecb'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/cinacoin-ui-theme',
                component: ComponentCreator('/ja/api/cinacoin-ui-theme', '959'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/cli',
                component: ComponentCreator('/ja/api/cli', '1ab'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/codemod',
                component: ComponentCreator('/ja/api/codemod', '9a3'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/config',
                component: ComponentCreator('/ja/api/config', 'a63'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/core-sdk',
                component: ComponentCreator('/ja/api/core-sdk', '0c7'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/core-ui',
                component: ComponentCreator('/ja/api/core-ui', '3d5'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/cross-chain-sync',
                component: ComponentCreator('/ja/api/cross-chain-sync', 'f96'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/custom-connectors',
                component: ComponentCreator('/ja/api/custom-connectors', '44e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/deposit',
                component: ComponentCreator('/ja/api/deposit', '97f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/design-tokens',
                component: ComponentCreator('/ja/api/design-tokens', '740'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/dotnet',
                component: ComponentCreator('/ja/api/dotnet', 'd19'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/embedded-wallet',
                component: ComponentCreator('/ja/api/embedded-wallet', '152'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/ens-resolver',
                component: ComponentCreator('/ja/api/ens-resolver', '53b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/erc6492',
                component: ComponentCreator('/ja/api/erc6492', 'b61'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/errors',
                component: ComponentCreator('/ja/api/errors', 'd21'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/explorer',
                component: ComponentCreator('/ja/api/explorer', '439'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/farcaster-miniapp',
                component: ComponentCreator('/ja/api/farcaster-miniapp', '289'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/flutter-dart',
                component: ComponentCreator('/ja/api/flutter-dart', '48a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/gas-estimator',
                component: ComponentCreator('/ja/api/gas-estimator', '3cc'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/gas-sponsorship',
                component: ComponentCreator('/ja/api/gas-sponsorship', '430'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/i18n',
                component: ComponentCreator('/ja/api/i18n', '24f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/ios-swift',
                component: ComponentCreator('/ja/api/ios-swift', 'cd7'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/keys',
                component: ComponentCreator('/ja/api/keys', '0bd'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/keys-server',
                component: ComponentCreator('/ja/api/keys-server', '968'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/kyc',
                component: ComponentCreator('/ja/api/kyc', 'b23'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/multiwallet',
                component: ComponentCreator('/ja/api/multiwallet', 'dca'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/next',
                component: ComponentCreator('/ja/api/next', '1d4'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/notify-server',
                component: ComponentCreator('/ja/api/notify-server', '077'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/nuxt',
                component: ComponentCreator('/ja/api/nuxt', '54e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/onramp-sdk',
                component: ComponentCreator('/ja/api/onramp-sdk', '492'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/overview',
                component: ComponentCreator('/ja/api/overview', 'dff'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/passkey-auth',
                component: ComponentCreator('/ja/api/passkey-auth', '508'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/pay-ui',
                component: ComponentCreator('/ja/api/pay-ui', '48b'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/paymaster',
                component: ComponentCreator('/ja/api/paymaster', 'ad8'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/payment-flow',
                component: ComponentCreator('/ja/api/payment-flow', 'aa9'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/performance-utils',
                component: ComponentCreator('/ja/api/performance-utils', '868'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/push',
                component: ComponentCreator('/ja/api/push', 'dee'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/push-server',
                component: ComponentCreator('/ja/api/push-server', '3f7'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/rate-limiting',
                component: ComponentCreator('/ja/api/rate-limiting', 'a11'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/react',
                component: ComponentCreator('/ja/api/react', '7f7'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/react-native',
                component: ComponentCreator('/ja/api/react-native', '0b6'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/relay',
                component: ComponentCreator('/ja/api/relay', '0c0'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/relay-server',
                component: ComponentCreator('/ja/api/relay-server', '81e'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/rpc',
                component: ComponentCreator('/ja/api/rpc', 'e0a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/rpc-proxy',
                component: ComponentCreator('/ja/api/rpc-proxy', 'eb9'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/safe-decoder',
                component: ComponentCreator('/ja/api/safe-decoder', '5c5'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/session-keys',
                component: ComponentCreator('/ja/api/session-keys', '4cd'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/siwe',
                component: ComponentCreator('/ja/api/siwe', '57d'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/siwx',
                component: ComponentCreator('/ja/api/siwx', 'dc8'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/social-login',
                component: ComponentCreator('/ja/api/social-login', '1ac'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/svelte',
                component: ComponentCreator('/ja/api/svelte', 'b90'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/swap-sdk',
                component: ComponentCreator('/ja/api/swap-sdk', 'dc4'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/telegram-miniapp',
                component: ComponentCreator('/ja/api/telegram-miniapp', '6e8'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/testing',
                component: ComponentCreator('/ja/api/testing', 'ed4'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/token-list',
                component: ComponentCreator('/ja/api/token-list', 'd6a'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/travel-rule-demo',
                component: ComponentCreator('/ja/api/travel-rule-demo', '806'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/ui-theme',
                component: ComponentCreator('/ja/api/ui-theme', '1ec'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/unity-csharp',
                component: ComponentCreator('/ja/api/unity-csharp', 'd0f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/vue',
                component: ComponentCreator('/ja/api/vue', 'c79'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/wallet-buttons',
                component: ComponentCreator('/ja/api/wallet-buttons', '3f4'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/wallet-recommender',
                component: ComponentCreator('/ja/api/wallet-recommender', '9b3'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/wallet-recovery',
                component: ComponentCreator('/ja/api/wallet-recovery', '28f'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/api/walletconnect-v2',
                component: ComponentCreator('/ja/api/walletconnect-v2', '5a1'),
                exact: true,
                sidebar: "apiSidebar"
              },
              {
                path: '/ja/framework/react',
                component: ComponentCreator('/ja/framework/react', '893'),
                exact: true
              },
              {
                path: '/ja/guide',
                component: ComponentCreator('/ja/guide', '6da'),
                exact: true
              },
              {
                path: '/ja/guide/configuration',
                component: ComponentCreator('/ja/guide/configuration', 'f0d'),
                exact: true
              },
              {
                path: '/ja/guide/installation',
                component: ComponentCreator('/ja/guide/installation', '2a5'),
                exact: true
              },
              {
                path: '/ja/guide/migrate-from-reown',
                component: ComponentCreator('/ja/guide/migrate-from-reown', '5b0'),
                exact: true
              },
              {
                path: '/ja/guide/quick-start',
                component: ComponentCreator('/ja/guide/quick-start', '506'),
                exact: true
              },
              {
                path: '/ja/guide/troubleshooting',
                component: ComponentCreator('/ja/guide/troubleshooting', 'f5e'),
                exact: true
              },
              {
                path: '/ja/',
                component: ComponentCreator('/ja/', 'f8c'),
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
