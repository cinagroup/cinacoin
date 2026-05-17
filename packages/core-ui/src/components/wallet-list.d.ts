/**
 * WalletList Web Component
 *
 * Renders a scrollable list of wallet cards.
 *
 * Properties:
 *   - wallets: WalletInfo[]
 *   - recommendedWalletIds: string[]
 *   - installedWalletIds: string[]
 *
 * Events:
 *   - ocx-wallet-select: fired when a wallet card is clicked
 */
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
export declare class WalletList extends BaseLitElement {
    static get styles(): import("lit").CSSResult[];
    wallets: WalletInfo[];
    recommendedWalletIds: string[];
    installedWalletIds: string[];
    render(): import("lit").TemplateResult<1>;
    private _renderCard;
    private _onSelect;
}
declare global {
    interface HTMLElementTagNameMap {
        'ocx-wallet-list': WalletList;
    }
}
//# sourceMappingURL=wallet-list.d.ts.map