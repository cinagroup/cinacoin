/**
 * Reown AppKit + Wagmi initialization for Cinacoin website
 *
 * - WagmiAdapter provides the wagmi config for WagmiProvider
 * - createCinacoinAppKit creates the wallet-connect modal with Cinacoin branding
 */
import {
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  bsc,
  avalanche,
  createCinacoinAppKit,
} from '@cinacoin/appkit-config';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? '';

export const networks = [mainnet, polygon, arbitrum, optimism, base, bsc, avalanche];

/**
 * Wagmi adapter – provides wagmiConfig + queryClient for providers.
 */
export const wagmiAdapter = new WagmiAdapter({
  networks: networks as unknown as [typeof mainnet, ...(typeof networks)[number][]],
  projectId,
  ssr: true,
});

export const queryClient = wagmiAdapter.queryClient;

/**
 * Create the Cinacoin-branded AppKit modal.
 * Called once on the client side (imported from a 'use client' module).
 */
export function initAppKit() {
  return createCinacoinAppKit({
    projectId,
    themeMode: 'dark',
    enableAnalytics: false,
    enableEmail: false,
    enableSocials: false,
  });
}
