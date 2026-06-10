/**
 * @cinacoin/appkit — 统一钱包连接弹窗组件
 *对标 Reown AppKit，一键式钱包连接 UI
 *
 * @example
 * ```typescript
 * import { createCinacoinAppKit } from '@cinacoin/appkit'
 *
 * const appkit = createCinacoinAppKit({
 *   projectId: 'xxx',
 *   chains: [mainnet, polygon],
 *   metadata: { name: 'My App', description: '...', url: '...', icons: [] },
 *   themeMode: 'dark',
 * })
 *
 * // In React:
 * function App() { return <appkit.Component /> }
 *
 * // Or imperatively:
 * appkit.open()
 * appkit.connect('metamask')
 * ```
 */

export { createCinacoinAppKit, CinacoinAppKitProvider, useCinacoinAppKit } from './CinacoinAppKit';

export { useConnection } from './hooks/useConnection';
export { useWallets } from './hooks/useWallets';

export { Modal } from './components/Modal';
export { WalletList } from './components/WalletList';
export { WalletSearch } from './components/WalletSearch';
export { ChainSelector } from './components/ChainSelector';
export { AccountPanel } from './components/AccountPanel';
export { QRCode } from './components/QRCode';

export type {
  // Config
  CinacoinAppKitConfig,
  CinacoinAppKitInstance,
  AppMetadata,
  ChainConfig,
  ThemeMode,
  ThemeVariables,
  ChainMode,
  // Wallets
  WalletInfo,
  WalletPlatform,
  RecentWallet,
  // Connection
  ConnectionState,
  ConnectionStatus,
  ConnectedAccount,
  ConnectionActions,
  ChainConnectionStatus,
  // Props
  ModalProps,
  WalletListProps,
  WalletSearchProps,
  ChainSelectorProps,
  AccountPanelProps,
  QRCodeProps,
} from './types';
