/**
 * Pre-built wallet button group component.
 *
 * Renders a set of wallet buttons with configurable layout (grid/list).
 * Ships with a sensible default of popular wallets.
 */
import React from 'react';
import { WalletButtonGroupProps } from './types';
/**
 * Renders a group of wallet buttons.
 *
 * @example
 * ```tsx
 * // Default popular wallets in a grid
 * <WalletButtonGroup />
 *
 * // Custom wallet list in a list layout
 * <WalletButtonGroup
 *   walletIds={['metamask', 'walletconnect']}
 *   layout="list"
 *   size="lg"
 *   onClick={(id) => console.log('clicked', id)}
 * />
 * ```
 */
export declare const WalletButtonGroup: React.FC<WalletButtonGroupProps>;
//# sourceMappingURL=WalletButtonGroup.d.ts.map