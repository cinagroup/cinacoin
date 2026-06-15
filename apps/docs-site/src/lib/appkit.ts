/**
 * Cinacoin Docs — AppKit Configuration
 *
 * Initializes Reown AppKit + Wagmi for the Docusaurus docs site.
 */
import { createAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, polygon, arbitrum, optimism, base, bsc, avalanche } from '@reown/appkit/networks';

const PROJECT_ID = process.env.DOCS_WC_PROJECT_ID ?? '';

export const networks = [mainnet, polygon, arbitrum, optimism, base, bsc, avalanche];

export const wagmiAdapter = new WagmiAdapter({
  networks: networks as unknown as [typeof mainnet, ...(typeof networks)[number][]],
  projectId: PROJECT_ID,
  ssr: false,
});

export const queryClient = wagmiAdapter.queryClient;

let appKitInitialized = false;

export function initDocsAppKit() {
  if (appKitInitialized) return;
  appKitInitialized = true;
  return createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId: PROJECT_ID,
    metadata: {
      name: 'Cinacoin Docs',
      description: 'Cinacoin Developer Documentation',
      url: 'https://docs.cinacoin.com',
      icons: ['https://cinacoin.com/favicon.svg'],
    },
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#0066FF',
      '--w3m-color-mix': '#0066FF',
      '--w3m-color-mix-strength': 20,
    },
  });
}
