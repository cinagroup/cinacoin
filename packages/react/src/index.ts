/**
 * @onchainux/react
 *
 * React adapter for OnChainUX white-label UI toolkit.
 *
 * Provides:
 * - OnChainUXProvider (React context)
 * - React wrapper components for OCX Web Components
 * - React hooks for on-chain state access
 */

export { OnChainUXProvider, useOnChainUXContext } from './OnChainUXProvider.js';
export type { OnChainUXConfig, OnChainUXContextValue, ChainConfig, ThemeMode } from './OnChainUXProvider.js';

export { ConnectButton } from './ConnectButton.js';
export type { ConnectButtonProps } from './ConnectButton.js';

export { ConnectModal } from './ConnectModal.js';
export type { ConnectModalProps } from './ConnectModal.js';

export { ChainSwitcher } from './ChainSwitcher.js';
export type { ChainSwitcherProps } from './ChainSwitcher.js';

export { useOnChainUX, useAccount, useChainId, useConnect, useDisconnect } from './hooks.js';
