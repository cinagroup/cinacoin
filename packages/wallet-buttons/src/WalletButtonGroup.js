import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Pre-built wallet button group component.
 *
 * Renders a set of wallet buttons with configurable layout (grid/list).
 * Ships with a sensible default of popular wallets.
 */
import { useMemo } from 'react';
import { WalletButton } from './WalletButton';
/** Default popular wallets shown when no `walletIds` are provided. */
const DEFAULT_WALLETS = [
    'metamask',
    'walletconnect',
    'coinbase',
    'rainbow',
    'trust',
    'phantom',
];
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
export const WalletButtonGroup = ({ walletIds, layout = 'grid', variant = 'default', size = 'md', columns = 3, onClick, className = '', }) => {
    const wallets = useMemo(() => walletIds ?? [...DEFAULT_WALLETS], [walletIds]);
    const isGrid = layout === 'grid';
    return (_jsx("div", { className: `cc-wallet-button-group cc-wallet-button-group--${layout} ${className}`, style: isGrid
            ? {
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }
            : undefined, children: wallets.map((walletId) => (_jsx(WalletButton, { walletId: walletId, variant: variant, size: size, onClick: onClick }, walletId))) }));
};
//# sourceMappingURL=WalletButtonGroup.js.map