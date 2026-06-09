/**
 * Vue 3 components for Cinacoin wallet connections.
 *
 * All components use Composition API, TypeScript, and Tailwind CSS.
 * They require being nested inside <CinaCoinProvider>.
 */

export { default as ConnectModal } from './ConnectModal.vue.js'
export type { ConnectModalProps } from './ConnectModal.vue.js'

export { default as ChainSwitcher } from './ChainSwitcher.vue.js'
export type { ChainSwitcherProps } from './ChainSwitcher.vue.js'

export { default as WalletButton } from './WalletButton.vue.js'
export type { WalletButtonProps } from './WalletButton.vue.js'

export { default as WalletButtonGroup } from './WalletButtonGroup.vue.js'
export type { WalletButtonGroupProps } from './WalletButtonGroup.vue.js'

export { default as AccountModal } from './AccountModal.vue.js'
export type { AccountModalProps } from './AccountModal.vue.js'

export { default as BalanceDisplay } from './BalanceDisplay.vue.js'
export type { BalanceDisplayProps } from './BalanceDisplay.vue.js'
