/**
 * Barrel re-export — alias for OnChainUXProvider.
 *
 * Exports both old (CinaCoin*) and new (Cinacoin*) names for backward compatibility.
 */

export {
  CinaCoinProvider,
  useCinaCoinContext,
  // New lowercase aliases
  CinaCoinProvider as CinacoinProvider,
  useCinaCoinContext as useCinacoinContext,
} from './OnChainUXProvider.js';

export type {
  CinaCoinConfig,
  CinaCoinConfig as CinacoinConfig,
  CinaCoinContextValue,
  CinaCoinContextValue as CinacoinContextValue,
  ChainConfig,
  ThemeMode,
  AccountState,
  CinaCoinProviderProps,
  Connector,
} from './OnChainUXProvider.js';
