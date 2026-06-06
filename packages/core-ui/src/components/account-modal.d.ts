/**
 * AccountModal Web Component (i18n-enabled)
 *
 * Modal for managing connected account — shows balance, copy address,
 * view explorer, switch account, and disconnect.
 *
 * Properties:
 *   - address: connected wallet address
 *   - chainId: current chain ID
 *   - balance: account balance string
 *   - chainSymbol: native currency symbol
 *   - allAccounts: additional account list
 *   - connectedApps: connected dApp list
 *
 * Events:
 *   - ocx-close, ocx-disconnect, ocx-copy-address, ocx-view-explorer, ocx-switch-account
 */
import { nothing } from 'lit';
import { BaseLitElement } from '../foundation/base-element.js';
export interface AccountInfo {
    address: string;
    balance?: string;
    chainSymbol?: string;
}
export interface ConnectedAppInfo {
    name: string;
    icon?: string;
    lastUsed?: string;
}
export declare class AccountModal extends BaseLitElement {
    static get styles(): import("lit").CSSResult[];
    address: string;
    chainId: number;
    balance: string;
    chainSymbol: string;
    allAccounts: AccountInfo[];
    connectedApps: ConnectedAppInfo[];
    isOpen: boolean;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private _onKeydown;
    private _close;
    private _copyAddress;
    private _viewExplorer;
    private _disconnect;
    private _switchAccount;
    render(): import("lit").TemplateResult<1> | typeof nothing;
}
declare global {
    interface HTMLElementTagNameMap {
        'ocx-account-modal': AccountModal;
    }
}
//# sourceMappingURL=account-modal.d.ts.map