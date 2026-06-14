/**
 * @cinacoin/appkit-config/react
 *
 * React-specific exports for Cinacoin AppKit configuration.
 * Provides React hooks and components for wallet connection.
 */

import { useAppKit, useAppKitAccount, useAppKitState, useAppKitNetwork } from '@reown/appkit/react';

// Re-export Reown React hooks with Cinacoin naming
export { useAppKit, useAppKitAccount, useAppKitState, useAppKitNetwork };

/**
 * Hook to get current wallet connection status
 */
export function useCinacoinWallet() {
  const account = useAppKitAccount();
  const { open } = useAppKit();
  const state = useAppKitState();
  const network = useAppKitNetwork();

  return {
    address: account.address,
    isConnected: account.isConnected,
    chainId: network.chainId,
    caipNetwork: network.caipNetwork,
    openConnectModal: open,
    isOpen: state.open,
  };
}

/**
 * Type for wallet connection return value
 */
export type UseCinacoinWalletReturn = ReturnType<typeof useCinacoinWallet>;
