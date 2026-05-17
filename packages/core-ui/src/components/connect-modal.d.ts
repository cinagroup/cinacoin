/**
 * ConnectModal Web Component (i18n-enabled)
 *
 * Modal dialog for wallet connection. Supports wallet list, social login,
 * email login, and QR scan views.
 *
 * Attributes:
 *   - is-open: whether the modal is visible
 *   - default-view: 'wallets' | 'social' | 'email' | 'scan'
 *
 * Properties:
 *   - wallets: WalletInfo[]
 *   - recommendedWalletIds: string[]
 *
 * Events:
 *   - ocx-close: fired when modal is closed
 *   - ocx-wallet-select: fired when a wallet is selected (detail: WalletInfo)
 */
import { nothing } from 'lit';
import { BaseLitElement } from '../foundation/base-element.js';
export interface WalletInfo {
    id: string;
    name: string;
    icon: string;
    iconBackground?: string;
    description?: string;
    downloadUrl?: string;
    rdns?: string;
}
export type ConnectModalView = 'wallets' | 'social' | 'email' | 'scan';
export declare class ConnectModal extends BaseLitElement {
    static get styles(): import("lit").CSSResult[];
    isOpen: boolean;
    defaultView: ConnectModalView;
    wallets: WalletInfo[];
    recommendedWalletIds: string[];
    private _currentView;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private _onKeydown;
    private _close;
    private _selectWallet;
    render(): import("lit").TemplateResult<1> | typeof nothing;
    private _onOverlayClick;
    private _renderCurrentView;
    private _renderWalletCard;
}
declare global {
    interface HTMLElementTagNameMap {
        'ocx-connect-modal': ConnectModal;
    }
}
//# sourceMappingURL=connect-modal.d.ts.map