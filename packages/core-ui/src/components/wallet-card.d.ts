/**
 * WalletCard Web Component (i18n-enabled)
 *
 * Single wallet card shown in wallet lists or modal grids.
 *
 * Properties:
 *   - wallet: WalletInfo
 *   - installed: boolean
 *   - recommended: boolean
 *
 * Events:
 *   - ocx-wallet-select: fired on click
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
export declare class WalletCard extends BaseLitElement {
    static get styles(): import("lit").CSSResult[];
    wallet: WalletInfo | null;
    installed: boolean;
    recommended: boolean;
    connectedCallback(): void;
    render(): import("lit").TemplateResult<1> | null;
}
declare global {
    interface HTMLElementTagNameMap {
        'ocx-wallet-card': WalletCard;
    }
}
//# sourceMappingURL=wallet-card.d.ts.map