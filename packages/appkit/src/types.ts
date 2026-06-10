/**
 * @cinacoin/appkit type definitions
 * Unified wallet connection modal component types
 */

import type { ReactNode } from 'react';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Theme mode for the AppKit modal
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Theme variable overrides for customizing the modal appearance
 */
export interface ThemeVariables {
  /** Primary brand color */
  '--cc-accent'?: string;
  /** Background color */
  '--cc-canvas'?: string;
  /** Text color */
  '--cc-ink'?: string;
  /** Secondary/background surface */
  '--cc-surface'?: string;
  /** Border color */
  '--cc-border'?: string;
  /** Error/danger color */
  '--cc-danger'?: string;
  /** Success color */
  '--cc-success'?: string;
  /** Warning color */
  '--cc-warning'?: string;
  /** Border radius override */
  '--cc-radius'?: string;
  /** Font family override */
  '--cc-font'?: string;
  /** Allow any custom CSS variables */
  [key: `--${string}`]: string | undefined;
}

/**
 * DApp metadata for WalletConnect
 */
export interface AppMetadata {
  /** Application name */
  name: string;
  /** Application description */
  description: string;
  /** Application URL */
  url: string;
  /** Application icon URLs */
  icons: string[];
}

/**
 * Chain configuration for supported networks
 */
export interface ChainConfig {
  /** Chain ID (e.g., 1 for Ethereum mainnet) */
  id: number;
  /** Chain name */
  name: string;
  /** Chain short name / ticker */
  ticker: string;
  /** RPC URL */
  rpcUrl: string;
  /** Block explorer URL */
  explorerUrl?: string;
  /** Chain icon URL */
  iconUrl?: string;
  /** Whether this is a testnet */
  testnet?: boolean;
}

/**
 * Multi-chain connection mode
 * - 'single': Connect to one chain at a time (default)
 * - 'multi': Connect to multiple chains in parallel
 */
export type ChainMode = 'single' | 'multi';

/**
 * Per-chain connection status (for multi-chain mode)
 */
export interface ChainConnectionStatus {
  /** Chain ID */
  chainId: number;
  /** Connection status for this chain */
  status: ConnectionStatus;
  /** Connected account on this chain (if connected) */
  account: ConnectedAccount | null;
  /** Account balance on this chain (formatted) */
  balance: string | null;
  /** Error message (if status is 'error') */
  error: string | null;
}

/**
 * Main configuration for createCinacoinAppKit
 */
export interface CinacoinAppKitConfig {
  /** WalletConnect Cloud Project ID */
  projectId: string;
  /** Supported chains */
  chains: ChainConfig[];
  /** DApp metadata */
  metadata: AppMetadata;
  /** Theme mode */
  themeMode?: ThemeMode;
  /** Theme variable overrides */
  themeVariables?: ThemeVariables;
  /** Default chain ID */
  defaultChain?: number;
  /** Custom wallet list (optional, uses built-in list if not provided) */
  wallets?: WalletInfo[];
  /** Enable email/social login (future) */
  enableSocial?: boolean;
  /** Custom terms of service URL */
  termsOfServiceUrl?: string;
  /** Custom privacy policy URL */
  privacyPolicyUrl?: string;
  /**
   * Chain connection mode.
   * - `'single'` (default): connect to one chain at a time
   * - `'multi'`: connect to multiple chains in parallel, showing
   *    balance + status per chain in the modal
   * @default 'single'
   */
  mode?: ChainMode;
}

// ============================================================================
// Wallet Types
// ============================================================================

/**
 * Wallet platform support
 */
export type WalletPlatform = 'browser' | 'mobile' | 'desktop' | 'hardware';

/**
 * Wallet information
 */
export interface WalletInfo {
  /** Unique wallet identifier */
  id: string;
  /** Wallet display name */
  name: string;
  /** Wallet icon URL */
  icon: string;
  /** Supported platforms */
  platforms: WalletPlatform[];
  /** WalletConnect RDNS (e.g., 'io.metamask') */
  rdns?: string;
  /** Deep link URL template (for mobile) */
  deepLink?: string;
  /** Chrome Web Store URL (for browser extensions) */
  chromeUrl?: string;
  /** Website URL */
  homepage?: string;
  /** Whether this wallet is featured/popular */
  featured?: boolean;
}

/**
 * Recently used wallet entry
 */
export interface RecentWallet {
  /** Wallet ID */
  id: string;
  /** Last used timestamp */
  lastUsed: number;
  /** Connected account address */
  address?: string;
}

// ============================================================================
// Connection Types
// ============================================================================

/**
 * Connection status
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Connected account information
 */
export interface ConnectedAccount {
  /** Account address */
  address: string;
  /** Chain ID */
  chainId: number;
  /** Connected wallet ID */
  walletId: string;
  /** ENS name (if available) */
  ensName?: string;
  /** Account balance (formatted) */
  balance?: string;
}

/**
 * Connection state
 */
export interface ConnectionState {
  /** Current connection status */
  status: ConnectionStatus;
  /** Connected account (if connected) */
  account: ConnectedAccount | null;
  /** Error message (if status is 'error') */
  error: string | null;
  /** Whether the modal is open */
  isOpen: boolean;
}

/**
 * Connection actions
 */
export interface ConnectionActions {
  /** Open the modal */
  open: () => void;
  /** Close the modal */
  close: () => void;
  /** Connect to a wallet */
  connect: (walletId: string) => Promise<void>;
  /** Disconnect the current wallet */
  disconnect: () => Promise<void>;
  /** Switch to a different chain */
  switchChain: (chainId: number) => Promise<void>;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for the Modal component
 */
export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal children */
  children: ReactNode;
  /** Theme mode */
  themeMode?: ThemeMode;
  /** Theme variables */
  themeVariables?: ThemeVariables;
}

/**
 * Props for WalletList component
 */
export interface WalletListProps {
  /** List of wallets to display */
  wallets: WalletInfo[];
  /** Recently used wallets */
  recentWallets?: RecentWallet[];
  /** Callback when a wallet is selected */
  onSelect: (wallet: WalletInfo) => void;
  /** Whether a connection is in progress */
  isLoading?: boolean;
  /** ID of the wallet being connected */
  connectingWalletId?: string | null;
}

/**
 * Props for WalletSearch component
 */
export interface WalletSearchProps {
  /** Current search value */
  value: string;
  /** Callback when search value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Props for ChainSelector component
 */
export interface ChainSelectorProps {
  /** Available chains */
  chains: ChainConfig[];
  /** Currently selected chain ID */
  selectedChainId: number;
  /** Callback when chain is selected */
  onSelect: (chainId: number) => void;
  /** Whether switching is in progress */
  isSwitching?: boolean;
  /**
   * Chain connection mode — when `'multi'`, each chain shows
   * its own balance and connection status indicator.
   * @default 'single'
   */
  mode?: ChainMode;
  /**
   * Per-chain connection statuses (used in multi-chain mode)
   */
  chainStatuses?: ChainConnectionStatus[];
}

/**
 * Props for AccountPanel component
 */
export interface AccountPanelProps {
  /** Connected account */
  account: ConnectedAccount;
  /** Callback to disconnect */
  onDisconnect: () => void;
  /** Callback to copy address */
  onCopyAddress?: () => void;
  /** Available chains for switching */
  chains?: ChainConfig[];
  /** Callback to switch chain */
  onSwitchChain?: (chainId: number) => void;
}

/**
 * Props for QRCode component
 */
export interface QRCodeProps {
  /** URI to encode */
  uri: string;
  /** Size in pixels */
  size?: number;
  /** Logo URL to display in center */
  logoUrl?: string;
}

// ============================================================================
// AppKit Instance Types
// ============================================================================

/**
 * CinacoinAppKit instance returned by createCinacoinAppKit
 */
export interface CinacoinAppKitInstance {
  /** Open the connection modal */
  open: () => void;
  /** Close the connection modal */
  close: () => void;
  /** Get current connection state */
  getState: () => ConnectionState;
  /** Subscribe to state changes */
  subscribe: (callback: (state: ConnectionState) => void) => () => void;
  /** Connect to a specific wallet */
  connect: (walletId: string) => Promise<ConnectedAccount>;
  /** Disconnect current wallet */
  disconnect: () => Promise<void>;
  /** Switch chain */
  switchChain: (chainId: number) => Promise<void>;
  /** Get the React component */
  Component: () => ReactNode;
}
