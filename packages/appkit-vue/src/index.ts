/**
 * @cinacoin/appkit-vue
 *
 * Vue 3 adapter for @cinacoin/appkit.
 * Provides a composable, provider component, and ready-to-use components
 * for integrating Cinacoin wallet connection into Vue 3 applications.
 *
 * @example
 * ```vue
 * <script setup>
 * import { CinacoinProvider, ConnectButton, useCinacoinAppKit } from '@cinacoin/appkit-vue';
 *
 * const config = { projectId: 'xxx', chains: [...], metadata: {...} };
 * </script>
 *
 * <template>
 *   <CinacoinProvider :config="config">
 *     <ConnectButton />
 *   </CinacoinProvider>
 * </template>
 * ```
 */

// Composable
export { useCinacoinAppKit, CINACOIN_APPKIT_KEY } from './useCinacoinAppKit';
export type { UseCinacoinAppKitReturn } from './useCinacoinAppKit';

// Components
export { CinacoinProvider } from './CinacoinProvider';
export { ConnectButton } from './ConnectButton';

// Re-export commonly used types from @cinacoin/appkit for convenience
export type {
  CinacoinAppKitConfig,
  CinacoinAppKitInstance,
  ConnectionState,
  ConnectedAccount,
  ChainConfig,
  ThemeMode,
  ThemeVariables,
} from '@cinacoin/appkit';
