/**
 * @cinacoin/wallet-buttons
 *
 * Direct wallet connection buttons — no modal, no bloat.
 * Connect wallets individually with beautiful, customizable buttons.
 *
 * @packageDocumentation
 * @example
 * ```tsx
 * import { WalletButton, WalletButtonGroup, CinacoinButton } from '@cinacoin/wallet-buttons';
 * import { useWalletButtons } from '@cinacoin/wallet-buttons';
 *
 * function App() {
 *   return (
 *     <div>
 *       <WalletButton walletId="metamask" variant="brand" size="lg" />
 *       <WalletButtonGroup walletIds={['metamask', 'walletconnect', 'coinbase']} layout="grid" />
 *       <CinacoinButton size="md" />
 *     </div>
 *   );
 * }
 * ```
 */

export { WalletButton } from './WalletButton';
export { WalletButtonGroup } from './WalletButtonGroup';
export { CinacoinButton } from './CinacoinButton';
export { useWalletButtons } from './hooks/useWalletButtons';

export type {
  WalletButtonProps,
  WalletButtonVariant,
  WalletButtonSize,
  WalletButtonGroupProps,
  WalletButtonGroupLayout,
  WalletButtonData,
} from './types';
