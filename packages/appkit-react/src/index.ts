/**
 * @cinacoin/appkit-react
 *
 * React adapter for @cinacoin/appkit.
 * Provides a Context-based provider, hooks, and ready-to-use components
 * for integrating Cinacoin wallet connection into any React application.
 *
 * @example
 * ```tsx
 * import { CinacoinProvider, ConnectButton, useCinacoinAppKit } from '@cinacoin/appkit-react';
 *
 * function App() {
 *   return (
 *     <CinacoinProvider config={config}>
 *       <ConnectButton />
 *     </CinacoinProvider>
 *   );
 * }
 * ```
 */

// Provider & hook
export { CinacoinProvider, useCinacoinAppKit } from './CinacoinProvider';
export type { CinacoinProviderProps } from './CinacoinProvider';

// ConnectButton
export { ConnectButton } from './ConnectButton';
export type { ConnectButtonProps } from './ConnectButton';

// Imperative modal
export { CinacoinModal, useCinacoinModal } from './CinacoinModal';
export type { CinacoinModalHandle } from './CinacoinModal';

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
