import React, { type CSSProperties } from 'react';
/** Props for the React ConnectModal wrapper. */
export interface ConnectModalProps {
    /** Whether the modal is open. */
    isOpen: boolean;
    /** Close callback. */
    onClose: () => void;
    /** Available views. */
    views?: Array<'wallets' | 'social' | 'email' | 'scan'>;
    /** Default view. */
    defaultView?: string;
    /** Recommended wallet IDs. */
    recommendedWalletIds?: string[];
    /** Theme override. */
    theme?: Record<string, string>;
    /** CSS class name. */
    className?: string;
    /** Inline styles. */
    style?: CSSProperties;
}
/**
 * ConnectModal — React wrapper for the OCX ConnectModal Web Component.
 *
 * ```tsx
 * <ConnectModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
 * ```
 */
export declare function ConnectModal({ isOpen, onClose, defaultView, recommendedWalletIds, className, style, }: ConnectModalProps): JSX.Element;
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'ocx-connect-modal': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
                'is-open'?: boolean;
                'default-view'?: string;
                'recommended-wallet-ids'?: string;
                className?: string;
                style?: CSSProperties;
            }, HTMLElement>;
        }
    }
}
//# sourceMappingURL=ConnectModal.d.ts.map