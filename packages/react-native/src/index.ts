/**
 * @onchainux/react-native
 *
 * React Native adapter for OnChainUX — native UI components, not Web Components.
 */

export { OnChainUXProvider, useOnChainUXContext } from './OnChainUXProvider';
export type { OnChainUXConfig, OnChainUXContextValue, ThemeMode, ChainConfig } from './OnChainUXProvider';

export { ConnectButton } from './ConnectButton';
export type { ConnectButtonProps } from './ConnectButton';

export { ConnectModal } from './ConnectModal';
export type { ConnectModalProps, WalletInfo } from './ConnectModal';

export { QRScanner } from './QRScanner';
export type { QRScannerProps } from './QRScanner';
