/**
 * Barrel re-export — alias for OnChainUXProvider.
 *
 * Exports both old (Cinacoin*) and new (Cinacoin*) names for backward compatibility.
 */

export {
  CinacoinProvider,
  useCinacoinContext,
  // New lowercase aliases
  CinacoinProvider as CinacoinProvider,
  useCinacoinContext as useCinacoinContext,
} from './OnChainUXProvider.js';

export type {
  CinacoinConfig,
  CinacoinConfig as CinacoinConfig,
  CinacoinContextValue,
  CinacoinContextValue as CinacoinContextValue,
  ChainConfig,
  ThemeMode,
  AccountState,
  CinacoinProviderProps,
  Connector,
} from './OnChainUXProvider.js';
