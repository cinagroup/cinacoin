import React from "react";
import type { Namespace } from "../types.js";
/** Props for the MultiwalletSwitcher component. */
export interface MultiwalletSwitcherProps {
    /** Optional CSS class name for the root element. */
    className?: string;
    /** Filter to show only connections from specific namespaces. */
    namespaces?: Namespace[];
    /** Custom render function for each wallet item. */
    renderWallet?: (wallet: {
        walletId: string;
        walletName: string;
        address: string;
        namespace: string;
        isActive: boolean;
        icon?: string;
    }) => React.ReactNode;
}
/**
 * React component that displays connected wallets grouped by namespace
 * and allows switching between them or adding/removing connections.
 *
 * @example
 * ```tsx
 * <MultiwalletSwitcher
 *   namespaces={["eip155", "solana"]}
 *   className="my-switcher"
 * />
 * ```
 */
export declare function MultiwalletSwitcher({ className, namespaces, renderWallet, }: MultiwalletSwitcherProps): JSX.Element;
//# sourceMappingURL=MultiwalletSwitcher.d.ts.map