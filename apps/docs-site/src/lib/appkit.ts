/**
 * Cinacoin Docs — AppKit Configuration
 *
 * Initializes Reown AppKit + Wagmi for the Docusaurus docs site.
 */
import {
  createCinacoinAppKit,
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  bsc,
  avalanche,
} from '@cinacoin/appkit-config';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

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
  return createCinacoinAppKit({
    projectId: PROJECT_ID,
    metadata: {
      name: 'Cinacoin Docs',
      description: 'Cinacoin Developer Documentation',
      url: 'https://docs.cinacoin.com',
      icons: ['https://cinacoin.com/favicon.svg'],
    },
    themeMode: 'dark',
  });
}
