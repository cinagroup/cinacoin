/**
 * Shims for .vue SFC imports so TypeScript can resolve them.
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
  export default component;
}

/**
 * Allow importing .vue files with .js extension (TypeScript module resolution).
 */
declare module '*.vue.js' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<unknown, Record<string, never>, unknown>;
  export default component;
  export interface CinaCoinProviderProps {
    config: import('./types').CinacoinConfig;
  }
  export interface ConnectModalProps {
    isOpen?: boolean;
    title?: string;
    subtitle?: string;
    teleportTo?: string | false;
    recommendedWalletIds?: string[];
  }
  export interface ChainSwitcherProps {
    chains?: import('./types').ChainConfig[];
  }
  export interface WalletButtonProps {
    connector: import('./types').Connector;
    disabled?: boolean;
  }
  export interface WalletButtonGroupProps {
    layout?: 'grid' | 'list';
    columns?: number;
    recommendedWalletIds?: string[];
  }
  export interface AccountModalProps {
    isOpen?: boolean;
    title?: string;
    teleportTo?: string | false;
  }
  export interface BalanceDisplayProps {
    showBalance?: boolean;
    showAvatar?: boolean;
    address?: string;
    decimals?: number;
  }
}
