/**
 * @cinacoin/appkit-next
 *
 * Next.js App Router adapter for Cinacoin AppKit.
 * Handles SSR/CSR boundary by marking all interactive components as
 * client components and providing dynamic-import helpers.
 */

'use client';

export { CinacoinProvider, useCinacoinAppKit } from '@cinacoin/appkit-react';
export type { CinacoinProviderProps } from '@cinacoin/appkit-react';

export { ConnectButton } from '@cinacoin/appkit-react';
export type { ConnectButtonProps } from '@cinacoin/appkit-react';

export { CinacoinModal, useCinacoinModal } from '@cinacoin/appkit-react';
export type { CinacoinModalHandle } from '@cinacoin/appkit-react';

export type {
  CinacoinAppKitConfig,
  CinacoinAppKitInstance,
  ConnectionState,
  ConnectedAccount,
  ChainConfig,
  ThemeMode,
  ThemeVariables,
} from '@cinacoin/appkit';
