/**
 * Reown AppKit + Wagmi initialization for Cinacoin website
 *
 * - WagmiAdapter provides the wagmi config for WagmiProvider
 * - createAppKit creates the wallet-connect modal with Cinacoin branding
 */
import { createAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, polygon, arbitrum, optimism, base, bsc, avalanche } from '@reown/appkit/networks';

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
  return createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#0066FF',
      '--w3m-color-mix': '#0066FF',
      '--w3m-color-mix-strength': 20,
    },
    features: {
      analytics: false,
      email: false,
      socials: [],
    },
  });
}
