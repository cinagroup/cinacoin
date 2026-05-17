import React, { type CSSProperties } from 'react';
/** Props for the React ChainSwitcher wrapper. */
export interface ChainSwitcherProps {
    /** CSS class name. */
    className?: string;
    /** Inline styles. */
    style?: CSSProperties;
    /** Chain change callback. */
    onChainChange?: (chainId: number) => void;
}
/**
 * ChainSwitcher — React wrapper for the OCX ChainSwitcher Web Component.
 *
 * Automatically reads available chains and active chain from context.
 *
 * ```tsx
 * <ChainSwitcher onChainChange={(id) => console.log('switched to', id)} />
 * ```
 */
export declare function ChainSwitcher({ className, style, onChainChange, }: ChainSwitcherProps): JSX.Element;
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'ocx-chain-switcher': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
                'active-chain-id'?: number;
                className?: string;
                style?: CSSProperties;
            }, HTMLElement>;
        }
    }
}
//# sourceMappingURL=ChainSwitcher.d.ts.map